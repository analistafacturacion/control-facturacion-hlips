const bcrypt = require('bcryptjs');

async function generatePasswords() {
  const passwords = ['admin123', 'analista123', 'coordinador123'];
  
  for (const password of passwords) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`${password} -> ${hash}`);
  }
}

generatePasswords();
