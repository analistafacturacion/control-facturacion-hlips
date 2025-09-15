const { Client } = require('pg');

async function run() {
  const host = process.env.PGHOST || 'dpg-d312mu0dl3ps73e0d3j0-a.oregon-postgres.render.com';
  const port = parseInt(process.env.PGPORT || '5432', 10);
  const user = process.env.PGUSER || 'facturacion_user';
  const password = process.env.PGPASSWORD || 'X5Mo5OAtH76XXidV0uj7icHvBXdmKAdJ';
  const database = process.env.PGDATABASE || 'control_facturacion_ykul';

  const client = new Client({ host, port, user, password, database, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Conectado para verificación.');
    const r1 = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='ultima_actualizacion'");
    console.log('table exists rows:', r1.rowCount);
    if (r1.rowCount > 0) {
      const r2 = await client.query('SELECT * FROM ultima_actualizacion LIMIT 5');
      console.log('rows:', r2.rows);
    }
  } catch (err) {
    console.error('Error check:', err);
    process.exitCode = 2;
  } finally {
    await client.end();
  }
}

run();
