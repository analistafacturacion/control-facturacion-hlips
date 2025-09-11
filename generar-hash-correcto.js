const bcrypt = require('bcryptjs');

const password = 'Sistemas1234*';
const saltRounds = 10;

console.log('Generando hash para la contraseña:', password);

bcrypt.hash(password, saltRounds, function(err, hash) {
    if (err) {
        console.error('Error generando hash:', err);
        return;
    }
    
    console.log('\n=== HASH GENERADO ===');
    console.log('Contraseña original:', password);
    console.log('Hash bcrypt:', hash);
    
    // Verificar que el hash funciona
    bcrypt.compare(password, hash, function(err, result) {
        if (err) {
            console.error('Error verificando hash:', err);
            return;
        }
        
        console.log('\n=== VERIFICACIÓN ===');
        console.log('Hash válido:', result ? '✅ SÍ' : '❌ NO');
        
        if (result) {
            console.log('\n=== COMANDO SQL PARA PGADMIN ===');
            console.log(`UPDATE "user" SET password = '${hash}' WHERE usuario = '1100967623';`);
            console.log('\n=== VERIFICAR EN PGADMIN ===');
            console.log(`SELECT id, usuario, nombre, rol, estado FROM "user" WHERE usuario = '1100967623';`);
        }
    });
});
