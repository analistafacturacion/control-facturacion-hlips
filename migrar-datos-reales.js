const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Configuración de la base de datos en la nube (Render)
const cloudClient = new Client({
  connectionString: 'postgresql://control_facturacion_hlips_user:N39OuQyZlz8dSI9k3gTbLOC8eYzw4CqQ@dpg-csl7tklds78s73d3vu30-a.oregon-postgres.render.com/control_facturacion_hlips',
  ssl: { rejectUnauthorized: false }
});

async function migrarDatosReales() {
  try {
    console.log('🔄 Iniciando migración de datos reales...');
    
    // Conectar a la base de datos en la nube
    console.log('🔌 Conectando a la base de datos en la nube...');
    await cloudClient.connect();
    
    // Buscar el archivo de backup más reciente
    const respaldosDir = './respaldos';
    const archivos = fs.readdirSync(respaldosDir)
      .filter(file => file.startsWith('control_usuarios_real_') && file.endsWith('.sql'))
      .sort()
      .reverse();
    
    if (archivos.length === 0) {
      throw new Error('No se encontró ningún archivo de backup');
    }
    
    const archivoBackup = path.join(respaldosDir, archivos[0]);
    console.log(`📁 Usando archivo: ${archivoBackup}`);
    
    // Leer el contenido del backup
    console.log('📖 Leyendo archivo de backup...');
    const contenidoSQL = fs.readFileSync(archivoBackup, 'utf8');
    
    // Primero, limpiar la base de datos existente
    console.log('🧹 Limpiando datos existentes...');
    
    // Eliminar datos en orden correcto (respetando foreign keys)
    const tablas = ['anulacion', 'facturacion_evento', 'reporte_rips', 'rips_factura', 'user', 'sede', 'aseguradora'];
    for (const tabla of tablas) {
      try {
        await cloudClient.query(`DELETE FROM "${tabla}"`);
        console.log(`   ✓ Tabla ${tabla} limpiada`);
      } catch (error) {
        console.log(`   ⚠ Warning: No se pudo limpiar tabla ${tabla}: ${error.message}`);
      }
    }
    
    // Resetear secuencias
    console.log('🔄 Reseteando secuencias...');
    const secuencias = ['anulacion_id_seq', 'aseguradora_id_seq', 'facturacion_evento_id_seq', 'reporte_rips_id_seq', 'rips_factura_id_seq', 'sede_id_seq', 'user_id_seq'];
    for (const seq of secuencias) {
      try {
        await cloudClient.query(`ALTER SEQUENCE ${seq} RESTART WITH 1`);
        console.log(`   ✓ Secuencia ${seq} reseteada`);
      } catch (error) {
        console.log(`   ⚠ Warning: No se pudo resetear secuencia ${seq}: ${error.message}`);
      }
    }
    
    // Ejecutar el contenido SQL
    console.log('💾 Ejecutando migración...');
    
    // Dividir en statements individuales para mejor control de errores
    const statements = contenidoSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .filter(stmt => 
        stmt.includes('INSERT INTO') || 
        stmt.includes('CREATE TABLE') || 
        stmt.includes('ALTER TABLE') ||
        stmt.includes('CREATE SEQUENCE') ||
        stmt.includes('SELECT pg_catalog.setval')
      );
    
    let ejecutados = 0;
    let errores = 0;
    
    for (const statement of statements) {
      try {
        await cloudClient.query(statement);
        ejecutados++;
        if (statement.includes('INSERT INTO')) {
          console.log(`   ✓ INSERT ejecutado (${ejecutados}/${statements.length})`);
        }
      } catch (error) {
        errores++;
        if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
          // Ignorar errores de duplicados o ya existentes
          console.log(`   ⚠ Ignorando: ${error.message.substring(0, 100)}...`);
        } else {
          console.error(`   ❌ Error: ${error.message.substring(0, 100)}...`);
        }
      }
    }
    
    // Verificar que los datos se migraron correctamente
    console.log('✅ Verificando migración...');
    
    const resultUsers = await cloudClient.query('SELECT COUNT(*) FROM "user"');
    const resultAseguradoras = await cloudClient.query('SELECT COUNT(*) FROM "aseguradora"');
    const resultSedes = await cloudClient.query('SELECT COUNT(*) FROM "sede"');
    
    console.log(`📊 Resultados de migración:`);
    console.log(`   👥 Usuarios: ${resultUsers.rows[0].count}`);
    console.log(`   🏢 Aseguradoras: ${resultAseguradoras.rows[0].count}`);
    console.log(`   🏭 Sedes: ${resultSedes.rows[0].count}`);
    console.log(`   📝 Statements ejecutados: ${ejecutados}/${statements.length}`);
    console.log(`   ❌ Errores: ${errores}`);
    
    // Verificar específicamente el usuario JUAN BENAVIDES
    const userJuan = await cloudClient.query('SELECT * FROM "user" WHERE usuario = $1', ['1100967623']);
    if (userJuan.rows.length > 0) {
      console.log('✅ Usuario JUAN BENAVIDES migrado correctamente:');
      console.log(`   ID: ${userJuan.rows[0].id}`);
      console.log(`   Nombre: ${userJuan.rows[0].nombre}`);
      console.log(`   Usuario: ${userJuan.rows[0].usuario}`);
      console.log(`   Rol: ${userJuan.rows[0].rol}`);
      console.log(`   Estado: ${userJuan.rows[0].estado}`);
      
      // Verificar si el password necesita ser hasheado
      const currentPassword = userJuan.rows[0].password;
      if (!currentPassword.startsWith('$2a$') && !currentPassword.startsWith('$2b$')) {
        console.log('🔒 Password no está hasheado, aplicando bcrypt...');
        const hashedPassword = await bcrypt.hash(currentPassword, 10);
        await cloudClient.query('UPDATE "user" SET password = $1 WHERE id = $2', [hashedPassword, userJuan.rows[0].id]);
        console.log('✅ Password hasheado correctamente');
      } else {
        console.log('✅ Password ya está hasheado');
      }
    } else {
      console.log('❌ Usuario JUAN BENAVIDES NO encontrado después de la migración');
    }
    
    console.log('🎉 Migración completada!');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await cloudClient.end();
    console.log('🔌 Conexión cerrada');
  }
}

migrarDatosReales();
