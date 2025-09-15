import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
const { Client } = require('pg');

const execAsync = promisify(exec);

// Configuración de la base de datos de producción (Render)
const PRODUCTION_CONFIG = {
  host: process.env.POSTGRES_HOST || '',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || '',
  user: process.env.POSTGRES_USER || '',
  password: process.env.POSTGRES_PASSWORD || '',
  ssl: {
    rejectUnauthorized: false // Render requiere SSL
  }
};

async function verificarCredenciales() {
  console.log('🔍 Verificando credenciales...');
  
  const requiredVars = ['POSTGRES_HOST', 'POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Faltan las siguientes variables de entorno:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('\n📋 Crea un archivo .env con las credenciales de Render:');
    console.error('POSTGRES_HOST=dpg-xxxxx-a.oregon-postgres.render.com');
    console.error('POSTGRES_PORT=5432');
    console.error('POSTGRES_DB=control_facturacion_xxxx');
    console.error('POSTGRES_USER=control_facturacion_xxxx_user');
    console.error('POSTGRES_PASSWORD=xxxxxxxxxxxxxxxx');
    process.exit(1);
  }
}

async function testConnection() {
  console.log('🔌 Probando conexión a Render PostgreSQL...');
  
  const client = new Client(PRODUCTION_CONFIG);
  
  try {
    await client.connect();
    const result = await client.query('SELECT version()');
    console.log('✅ Conexión exitosa a PostgreSQL en Render');
    console.log(`📦 Versión: ${result.rows[0].version}`);
    await client.end();
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return false;
  }
}

async function verificarArchivos() {
  console.log('📁 Verificando archivos de migración...');
  
  const sqlFile = path.join(process.cwd(), '../../maindb.sql');
  
  if (!fs.existsSync(sqlFile)) {
    console.error('❌ No se encontró maindb.sql en la raíz del proyecto');
    return false;
  }
  
  const stats = fs.statSync(sqlFile);
  console.log(`✅ Archivo encontrado: maindb.sql (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  return true;
}

async function ejecutarMigracion() {
  console.log('🚀 Iniciando migración de datos...');
  
  const sqlFile = path.join(process.cwd(), '../../maindb.sql');
  const { host, port, database, user, password } = PRODUCTION_CONFIG;
  
  // Construir comando psql
  const command = `psql "postgresql://${user}:${password}@${host}:${port}/${database}?sslmode=require" < "${sqlFile}"`;
  
  try {
    console.log('⏳ Ejecutando migración... (esto puede tomar varios minutos)');
    const { stdout, stderr } = await execAsync(command, { 
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      timeout: 300000 // 5 minutos timeout
    });
    
    if (stderr && !stderr.includes('NOTICE')) {
      console.warn('⚠️ Warnings durante la migración:');
      console.warn(stderr);
    }
    
    if (stdout) {
      console.log('📄 Salida de psql:');
      console.log(stdout);
    }
    
    console.log('✅ Migración completada exitosamente');
    return true;
    
  } catch (error) {
    console.error('❌ Error durante la migración:');
    console.error(error.message);
    return false;
  }
}

async function verificarMigracion() {
  console.log('🔍 Verificando datos migrados...');
  
  const client = new Client(PRODUCTION_CONFIG);
  
  try {
    await client.connect();
    
    // Verificar tablas principales
    const tablas = ['users', 'aseguradora', 'sede', 'facturacion_evento', 'anulacion'];
    
    for (const tabla of tablas) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${tabla}`);
        const count = result.rows[0].count;
        console.log(`✅ Tabla ${tabla}: ${count} registros`);
      } catch (error) {
        console.log(`⚠️ Tabla ${tabla}: No encontrada o error`);
      }
    }
    
    await client.end();
    console.log('✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error en verificación:', error.message);
  }
}

async function main() {
  console.log('🎯 Script de Migración - Control Facturación');
  console.log('==========================================\n');
  
  try {
    // Paso 1: Verificar credenciales
    await verificarCredenciales();
    
    // Paso 2: Probar conexión
    const conexionOk = await testConnection();
    if (!conexionOk) {
      console.error('❌ No se puede conectar a la base de datos');
      process.exit(1);
    }
    
    // Paso 3: Verificar archivos
    const archivosOk = await verificarArchivos();
    if (!archivosOk) {
      process.exit(1);
    }
    
    // Paso 4: Confirmar migración
    console.log('\n⚠️ ADVERTENCIA: Esta operación sobrescribirá los datos existentes en Render');
    console.log('¿Deseas continuar? Presiona Ctrl+C para cancelar o Enter para continuar...');
    
    // En un entorno no interactivo, continúa automáticamente
    if (process.env.AUTO_CONFIRM !== 'true') {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      await new Promise(resolve => process.stdin.once('data', resolve));
    }
    
    // Paso 5: Ejecutar migración
    const migracionOk = await ejecutarMigracion();
    if (!migracionOk) {
      process.exit(1);
    }
    
    // Paso 6: Verificar resultados
    await verificarMigracion();
    
    console.log('\n🎉 ¡Migración completada exitosamente!');
    console.log('🌐 Verifica tu aplicación en:');
    console.log('   Frontend: https://analistafacturacion.github.io/control-facturacion-hlips/');
    console.log('   API: https://control-facturacion-hlips.onrender.com/api/health');
    
  } catch (error) {
    console.error('💥 Error inesperado:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { main as migrarDatos };
