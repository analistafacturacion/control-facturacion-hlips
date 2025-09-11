const fetch = require('node-fetch');

console.log('Testing login with different credentials...');

const testLogin = async (usuario, password, rol) => {
  try {
    const res = await fetch('https://control-facturacion-hlips.onrender.com/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password, rol })
    });
    const text = await res.text();
    console.log(`${usuario}:${rol} -> Status: ${res.status}, Response: ${text}`);
  } catch (err) {
    console.error(`Error testing ${usuario}:${rol}`, err.message);
  }
};

// Intentar con diferentes credenciales
(async () => {
  await testLogin('admin', 'admin123', 'admin');
  await testLogin('admin', 'admin123', 'administrador');
  await testLogin('analista', 'analista123', 'analista');
  await testLogin('coordinador', 'coordinador123', 'coordinador');
})();
