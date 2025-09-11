const { Client } = require('pg');

// Configuración de la base de datos en la nube (Render)
const cloudClient = new Client({
  connectionString: 'postgresql://control_facturacion_hlips_user:N39OuQyZlz8dSI9k3gTbLOC8eYzw4CqQ@dpg-csl7tklds78s73d3vu30-a.oregon-postgres.render.com/control_facturacion_hlips',
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    console.log('🔌 Probando conexión...');
    await cloudClient.connect();
    console.log('✅ Conexión exitosa');
    
    // Probar una consulta simple
    const result = await cloudClient.query('SELECT NOW()');
    console.log('⏰ Hora del servidor:', result.rows[0].now);
    
    // Ver qué datos hay actualmente
    const users = await cloudClient.query('SELECT COUNT(*) FROM "user"');
    console.log('👥 Usuarios actuales:', users.rows[0].count);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await cloudClient.end();
  }
}

testConnection();
