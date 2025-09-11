const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de la base de datos en Render
const dbConfig = {
    host: 'dpg-d312mu0dl3ps73e0d3j0-a.oregon-postgres.render.com',
    port: 5432,
    database: 'control_facturacion_ykul',
    user: 'facturacion_user',
    password: 'X5Mo5OAtH76XXidV0uj7icHvBXdmKAdJ',
    ssl: {
        rejectUnauthorized: false // Render requiere SSL
    }
};

async function migrateDatabase() {
    console.log('\n🚀 Control Facturación - Migración de Base de Datos');
    console.log('=' .repeat(50));
    
    // Verificar que existe el archivo maindb.sql
    const sqlFilePath = path.join(__dirname, 'maindb.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
        console.error('❌ No se encontró el archivo maindb.sql');
        console.log('📁 Archivo esperado:', sqlFilePath);
        process.exit(1);
    }
    
    const fileStats = fs.statSync(sqlFilePath);
    const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
    console.log(`✅ Archivo encontrado: maindb.sql (${fileSizeMB} MB)`);
    
    // Leer el contenido del archivo SQL
    console.log('\n📖 Leyendo archivo SQL...');
    let sqlContent;
    
    try {
        sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        console.log('✅ Archivo SQL leído correctamente');
    } catch (error) {
        console.error('❌ Error al leer el archivo SQL:', error.message);
        process.exit(1);
    }
    
    // Conectar a la base de datos
    const client = new Client(dbConfig);
    
    try {
        console.log('\n🔗 Conectando a PostgreSQL en Render...');
        console.log(`   Host: ${dbConfig.host}`);
        console.log(`   Database: ${dbConfig.database}`);
        console.log(`   User: ${dbConfig.user}`);
        
        await client.connect();
        console.log('✅ Conexión exitosa a PostgreSQL');
        
        // Verificar versión de PostgreSQL
        const versionResult = await client.query('SELECT version()');
        console.log('🔍 Versión:', versionResult.rows[0].version);
        
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        console.log('\n💡 Verifica que:');
        console.log('   - Las credenciales sean correctas');
        console.log('   - La base de datos esté activa en Render');
        console.log('   - Tu conexión a internet funcione');
        process.exit(1);
    }
    
    // Confirmación antes de migrar
    console.log('\n⚠️  ADVERTENCIA: Esta operación puede sobrescribir datos existentes');
    console.log(`🎯 Base de datos destino: ${dbConfig.database} en ${dbConfig.host}`);
    
    // Para automatizar, puedes comentar esta parte si no quieres confirmación manual
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
        rl.question('\n¿Continuar con la migración? (s/N): ', resolve);
    });
    rl.close();
    
    if (answer.toLowerCase() !== 's' && answer.toLowerCase() !== 'si') {
        console.log('❌ Migración cancelada por el usuario');
        await client.end();
        process.exit(0);
    }
    
    // Ejecutar migración
    console.log('\n🚀 Iniciando migración...');
    console.log('⏳ Esto puede tomar varios minutos dependiendo del tamaño de los datos...');
    
    try {
        // Limpiar y dividir el SQL en sentencias
        console.log('🔧 Procesando archivo SQL...');
        
        // Eliminar caracteres no válidos y dividir por sentencias
        const cleanedSql = sqlContent
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Eliminar caracteres de control
            .replace(/\0/g, '') // Eliminar null bytes
            .trim();
            
        // Dividir en sentencias (separadas por ;)
        const sqlStatements = cleanedSql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--')); // Filtrar líneas vacías y comentarios
        
        console.log(`📊 Encontradas ${sqlStatements.length} sentencias SQL para ejecutar`);
        
        // Ejecutar sentencias una por una para mejor control de errores
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < sqlStatements.length; i++) {
            const statement = sqlStatements[i];
            
            try {
                // Mostrar progreso cada 100 sentencias
                if (i % 100 === 0) {
                    console.log(`📄 Ejecutando sentencia ${i + 1}/${sqlStatements.length}...`);
                }
                
                await client.query(statement);
                successCount++;
                
            } catch (stmtError) {
                errorCount++;
                console.warn(`⚠️  Error en sentencia ${i + 1}: ${stmtError.message}`);
                
                // Si es un error crítico, detener la migración
                if (stmtError.message.includes('syntax error') || 
                    stmtError.message.includes('permission denied') ||
                    errorCount > 10) {
                    throw stmtError;
                }
                
                // Continuar con errores menores (como tablas que ya existen)
                continue;
            }
        }
        
        console.log(`\n📊 Resumen de migración:`);
        console.log(`   ✅ Sentencias exitosas: ${successCount}`);
        console.log(`   ⚠️  Sentencias con errores: ${errorCount}`);
        
        if (successCount > 0) {
            console.log('\n✅ ¡Migración completada!');
            console.log('\n🔍 Verificación recomendada:');
            console.log('1. API Health: https://control-facturacion-hlips.onrender.com/api/health');
            console.log('2. Frontend: https://analistafacturacion.github.io/control-facturacion-hlips/');
            console.log('3. Prueba el login con tus credenciales existentes');
            console.log('\n🎉 ¡Tu sistema está ahora completamente en la nube!');
        } else {
            throw new Error('No se ejecutaron sentencias exitosamente');
        }
        
    } catch (error) {
        console.error('\n❌ Error durante la migración:', error.message);
        console.log('\n💡 Posibles soluciones:');
        console.log('   - Verifica que el archivo maindb.sql sea válido');
        console.log('   - Confirma que tienes permisos de escritura en la BD');
        console.log('   - Revisa los logs para más detalles');
        
        // Mostrar más detalles del error si está disponible
        if (error.detail) {
            console.log('📋 Detalle del error:', error.detail);
        }
        if (error.hint) {
            console.log('💡 Sugerencia:', error.hint);
        }
        
        process.exit(1);
        
    } finally {
        // Cerrar conexión
        await client.end();
        console.log('\n🔐 Conexión cerrada');
    }
}

// Ejecutar migración
if (require.main === module) {
    migrateDatabase()
        .then(() => {
            console.log('\n🎯 Migración finalizada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Error inesperado:', error.message);
            process.exit(1);
        });
}

module.exports = { migrateDatabase };
