const { Client } = require('pg');
const bcrypt = require('bcryptjs');

// Configuración de la base de datos de Render
const client = new Client({
  connectionString: 'postgresql://control_facturacion_hlips_user:N39OuQyZlz8dSI9k3gTbLOC8eYzw4CqQ@dpg-csl7tklds78s73d3vu30-a.oregon-postgres.render.com/control_facturacion_hlips',
  ssl: { rejectUnauthorized: false }
});

async function insertRealUser() {
  try {
    console.log('Conectando a la base de datos...');
    await client.connect();
    
    // Hashear el password real
    const hashedPassword = await bcrypt.hash('Sistemas1234*', 10);
    console.log('Password hasheado:', hashedPassword);
    
    // Insertar el usuario real
    const insertQuery = `
      INSERT INTO "user" (nombre, usuario, rol, aseguradoras, password, estado) 
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (usuario) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        rol = EXCLUDED.rol,
        aseguradoras = EXCLUDED.aseguradoras,
        password = EXCLUDED.password,
        estado = EXCLUDED.estado
      RETURNING *;
    `;
    
    const values = [
      'JUAN BENAVIDES',           // nombre
      '1100967623',               // usuario  
      'admin',                    // rol
      '{}',                       // aseguradoras (array vacío)
      hashedPassword,             // password hasheado
      true                        // estado
    ];
    
    console.log('Insertando usuario real...');
    const result = await client.query(insertQuery, values);
    console.log('Usuario insertado exitosamente:', result.rows[0]);
    
    // Verificar que el usuario se insertó
    const verifyQuery = 'SELECT * FROM "user" WHERE usuario = $1';
    const verifyResult = await client.query(verifyQuery, ['1100967623']);
    console.log('Verificación:', verifyResult.rows[0]);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('Conexión cerrada');
  }
}

insertRealUser();
