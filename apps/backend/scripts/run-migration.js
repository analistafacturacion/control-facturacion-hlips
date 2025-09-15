// Script temporal para ejecutar migración SQL usando 'pg'
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function run() {
  const host = process.env.PGHOST || 'dpg-d312mu0dl3ps73e0d3j0-a';
  const port = parseInt(process.env.PGPORT || '5432', 10);
  const user = process.env.PGUSER || 'facturacion_user';
  const password = process.env.PGPASSWORD || 'facturacion_user';
  const database = process.env.PGDATABASE || 'control_facturacion_ykul';

  const sqlPath = path.join(__dirname, '..', 'ops', 'migrations', '1694770000000-create-ultima-actualizacion.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('No se encontró el archivo SQL en', sqlPath);
    process.exit(1);
  }
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = new Client({ host, port, user, password, database, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Conectado a la DB, ejecutando SQL...');
    await client.query(sql);
    console.log('Migración ejecutada correctamente');
  } catch (err) {
    console.error('Error ejecutando migración:', err);
    process.exitCode = 2;
  } finally {
    await client.end();
  }
}

run();
