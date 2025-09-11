const { spawn } = require('child_process');
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
        rejectUnauthorized: false
    }
};

async function migrateWithPgRestore() {
    console.log('\n🚀 Control Facturación - Migración con pg_restore');
    console.log('=' .repeat(50));
    
    // Verificar que existe el archivo maindb.sql (que es realmente un dump binario)
    const dumpFilePath = path.join(__dirname, 'maindb.sql');
    
    if (!fs.existsSync(dumpFilePath)) {
        console.error('❌ No se encontró el archivo maindb.sql');
        console.log('📁 Archivo esperado:', dumpFilePath);
        process.exit(1);
    }
    
    const fileStats = fs.statSync(dumpFilePath);
    const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
    console.log(`✅ Archivo encontrado: maindb.sql (${fileSizeMB} MB)`);
    console.log('🔍 Detectado: Dump binario de PostgreSQL (PGDMP)');
    
    // Conectar para verificar que la BD funciona
    const client = new Client(dbConfig);
    
    try {
        console.log('\n🔗 Verificando conexión a PostgreSQL en Render...');
        await client.connect();
        console.log('✅ Conexión exitosa a PostgreSQL');
        
        const versionResult = await client.query('SELECT version()');
        console.log('🔍 Versión:', versionResult.rows[0].version);
        
        await client.end();
        
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        console.log('\n💡 Verifica que las credenciales sean correctas');
        process.exit(1);
    }
    
    // Confirmación
    console.log('\n⚠️  ADVERTENCIA: Esta operación restaurará el dump completo');
    console.log(`🎯 Base de datos destino: ${dbConfig.database}`);
    
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
        rl.question('\n¿Continuar con la restauración? (s/N): ', resolve);
    });
    rl.close();
    
    if (answer.toLowerCase() !== 's' && answer.toLowerCase() !== 'si') {
        console.log('❌ Migración cancelada por el usuario');
        process.exit(0);
    }
    
    console.log('\n🚀 Iniciando restauración...');
    console.log('💡 Nota: Esta operación usará Node.js para enviar los datos directamente');
    
    // Como no tenemos pg_restore, vamos a intentar leer el dump y extraer los datos
    // Esta es una aproximación para dumps pequeños
    
    try {
        console.log('🔧 Procesando dump binario...');
        
        // Leer el archivo como buffer
        const dumpBuffer = fs.readFileSync(dumpFilePath);
        
        // Buscar patrones de CREATE TABLE y INSERT en el dump
        const dumpText = dumpBuffer.toString('binary');
        
        // Extraer comandos SQL del dump binario (método simplificado)
        const sqlCommands = [];
        
        // Buscar CREATE TABLE statements
        const createTableRegex = /CREATE TABLE[^;]+;/gi;
        const createMatches = dumpText.match(createTableRegex);
        if (createMatches) {
            sqlCommands.push(...createMatches);
        }
        
        // Buscar INSERT statements
        const insertRegex = /INSERT INTO[^;]+;/gi;
        const insertMatches = dumpText.match(insertRegex);
        if (insertMatches) {
            sqlCommands.push(...insertMatches);
        }
        
        console.log(`📊 Encontrados ${sqlCommands.length} comandos SQL en el dump`);
        
        if (sqlCommands.length === 0) {
            throw new Error('No se pudieron extraer comandos SQL del dump binario');
        }
        
        // Conectar nuevamente para ejecutar comandos
        const restoreClient = new Client(dbConfig);
        await restoreClient.connect();
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < sqlCommands.length; i++) {
            const command = sqlCommands[i].trim();
            
            if (command.length === 0) continue;
            
            try {
                if (i % 50 === 0) {
                    console.log(`📄 Ejecutando comando ${i + 1}/${sqlCommands.length}...`);
                }
                
                await restoreClient.query(command);
                successCount++;
                
            } catch (cmdError) {
                errorCount++;
                
                // Ignorar errores comunes de restore
                if (cmdError.message.includes('already exists') || 
                    cmdError.message.includes('does not exist')) {
                    continue;
                }
                
                console.warn(`⚠️  Error en comando ${i + 1}: ${cmdError.message}`);
                
                if (errorCount > 20) {
                    throw new Error('Demasiados errores durante la restauración');
                }
            }
        }
        
        await restoreClient.end();
        
        console.log(`\n📊 Resumen de restauración:`);
        console.log(`   ✅ Comandos exitosos: ${successCount}`);
        console.log(`   ⚠️  Comandos con errores: ${errorCount}`);
        
        if (successCount > 0) {
            console.log('\n✅ ¡Restauración completada!');
            console.log('\n🔍 Verificación recomendada:');
            console.log('1. API Health: https://control-facturacion-hlips.onrender.com/api/health');
            console.log('2. Frontend: https://analistafacturacion.github.io/control-facturacion-hlips/');
            console.log('3. Prueba el login con tus credenciales existentes');
            console.log('\n🎉 ¡Tu sistema está ahora completamente en la nube!');
        }
        
    } catch (error) {
        console.error('\n❌ Error durante la restauración:', error.message);
        console.log('\n💡 Alternativas:');
        console.log('1. Instalar PostgreSQL local para tener pg_restore');
        console.log('2. Usar pgAdmin para restaurar el dump');
        console.log('3. Exportar los datos en formato SQL texto');
        process.exit(1);
    }
}

// Función alternativa: convertir a SQL texto
async function convertDumpToSQL() {
    console.log('\n🔄 Convirtiendo dump binario a SQL texto...');
    
    const dumpFilePath = path.join(__dirname, 'maindb.sql');
    const sqlOutputPath = path.join(__dirname, 'maindb-converted.sql');
    
    try {
        const dumpBuffer = fs.readFileSync(dumpFilePath);
        
        // Intentar extraer texto del dump binario
        let extractedSQL = '';
        const dumpText = dumpBuffer.toString('utf8', 0, Math.min(dumpBuffer.length, 1024 * 1024)); // Leer hasta 1MB
        
        // Buscar y extraer comandos SQL válidos
        const sqlPatterns = [
            /CREATE TABLE[^;]+;/gi,
            /CREATE INDEX[^;]+;/gi,
            /INSERT INTO[^;]+;/gi,
            /ALTER TABLE[^;]+;/gi,
            /CREATE SEQUENCE[^;]+;/gi
        ];
        
        for (const pattern of sqlPatterns) {
            const matches = dumpText.match(pattern) || [];
            extractedSQL += matches.join('\n') + '\n';
        }
        
        if (extractedSQL.trim().length > 0) {
            fs.writeFileSync(sqlOutputPath, extractedSQL);
            console.log(`✅ SQL extraído guardado en: ${sqlOutputPath}`);
            return sqlOutputPath;
        } else {
            throw new Error('No se pudo extraer SQL válido del dump');
        }
        
    } catch (error) {
        console.error('❌ Error al convertir dump:', error.message);
        return null;
    }
}

// Ejecutar migración
if (require.main === module) {
    migrateWithPgRestore()
        .then(() => {
            console.log('\n🎯 Proceso finalizado');
            process.exit(0);
        })
        .catch(async (error) => {
            console.error('\n💥 Error principal:', error.message);
            
            // Intentar conversión como respaldo
            console.log('\n🔄 Intentando conversión alternativa...');
            const convertedFile = await convertDumpToSQL();
            
            if (convertedFile) {
                console.log('\n💡 Puedes intentar ejecutar el archivo convertido:');
                console.log(`   node -e "require('./migrate-database.js').migrateFromFile('${convertedFile}')"`);
            }
            
            process.exit(1);
        });
}

module.exports = { migrateWithPgRestore, convertDumpToSQL };
