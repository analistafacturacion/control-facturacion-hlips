const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 BUSCADOR AUTOMÁTICO DE POSTGRESQL');
console.log('==================================');

// Ubicaciones comunes donde puede estar PostgreSQL
const commonLocations = [
    'C:\\Program Files\\PostgreSQL',
    'C:\\Program Files (x86)\\PostgreSQL',
    'C:\\PostgreSQL',
    'C:\\Program Files\\pgAdmin 4',
    'C:\\Program Files (x86)\\pgAdmin 4'
];

// Versiones comunes de PostgreSQL
const versions = ['16', '15', '14', '13', '12', '11', '10', '9.6'];

async function findPostgreSQL() {
    console.log('Buscando instalaciones de PostgreSQL...\n');
    
    for (let location of commonLocations) {
        console.log(`🔍 Revisando: ${location}`);
        
        if (fs.existsSync(location)) {
            console.log(`✅ Carpeta encontrada: ${location}`);
            
            try {
                const contents = fs.readdirSync(location);
                console.log(`   Contenido: ${contents.join(', ')}`);
                
                // Buscar carpetas de versiones
                for (let version of versions) {
                    const versionPath = path.join(location, version);
                    if (fs.existsSync(versionPath)) {
                        const binPath = path.join(versionPath, 'bin');
                        if (fs.existsSync(binPath)) {
                            console.log(`✅ ENCONTRADO: ${binPath}`);
                            
                            // Verificar si pg_dump existe
                            const pgDumpPath = path.join(binPath, 'pg_dump.exe');
                            if (fs.existsSync(pgDumpPath)) {
                                console.log(`🎯 pg_dump encontrado: ${pgDumpPath}`);
                                return pgDumpPath;
                            }
                        }
                    }
                }
            } catch (error) {
                console.log(`   ❌ Error accediendo a la carpeta: ${error.message}`);
            }
        } else {
            console.log(`   ❌ Carpeta no existe`);
        }
        console.log('');
    }
    
    return null;
}

async function testConnection(pgDumpPath) {
    return new Promise((resolve) => {
        const testCommand = `"${pgDumpPath}" --version`;
        exec(testCommand, (error, stdout, stderr) => {
            if (error) {
                console.log(`❌ Error ejecutando pg_dump: ${error.message}`);
                resolve(false);
            } else {
                console.log(`✅ pg_dump funciona: ${stdout.trim()}`);
                resolve(true);
            }
        });
    });
}

async function exportDatabase(pgDumpPath) {
    return new Promise((resolve) => {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        const outputFile = `backup_control_usuarios_${timestamp}.sql`;
        
        // Configurar la contraseña
        process.env.PGPASSWORD = 'Sistemas1234*';
        
        const exportCommand = `"${pgDumpPath}" -h localhost -p 5432 -U postgres -d control_usuarios > ${outputFile}`;
        
        console.log(`🚀 Ejecutando exportación: ${exportCommand}`);
        
        exec(exportCommand, (error, stdout, stderr) => {
            if (error) {
                console.log(`❌ Error en exportación: ${error.message}`);
                if (stderr) console.log(`Error details: ${stderr}`);
                resolve(false);
            } else {
                console.log(`✅ Base de datos exportada a: ${outputFile}`);
                
                // Verificar que el archivo se creó
                if (fs.existsSync(outputFile)) {
                    const size = fs.statSync(outputFile).size;
                    console.log(`📁 Tamaño del archivo: ${(size / 1024).toFixed(2)} KB`);
                    resolve(true);
                } else {
                    console.log(`❌ El archivo de backup no se creó`);
                    resolve(false);
                }
            }
        });
    });
}

// Ejecutar la búsqueda
async function main() {
    try {
        const pgDumpPath = await findPostgreSQL();
        
        if (pgDumpPath) {
            console.log('\n🎉 PostgreSQL encontrado!');
            console.log(`Ubicación: ${pgDumpPath}\n`);
            
            // Probar la conexión
            const connectionWorks = await testConnection(pgDumpPath);
            
            if (connectionWorks) {
                console.log('\n💾 Iniciando exportación de la base de datos...');
                const exportSuccess = await exportDatabase(pgDumpPath);
                
                if (exportSuccess) {
                    console.log('\n🎊 ¡EXPORTACIÓN COMPLETADA EXITOSAMENTE!');
                } else {
                    console.log('\n❌ La exportación falló. Verifica la conexión a la base de datos.');
                }
            }
        } else {
            console.log('\n❌ PostgreSQL no encontrado automáticamente.');
            console.log('\n📋 OPCIONES MANUALES:');
            console.log('1. Buscar "pgAdmin" en el menú inicio de Windows');
            console.log('2. Usar pgAdmin para hacer backup de la base de datos');
            console.log('3. Revisar si PostgreSQL está instalado en otras ubicaciones');
        }
    } catch (error) {
        console.log(`❌ Error durante la búsqueda: ${error.message}`);
    }
}

main();
