// Script para crear el archivo .env si no existe
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

const defaultEnv = `OJV_URL=https://oficinajudicialvirtual.pjud.cl/home/index.php
`;

if (!fs.existsSync(envPath)) {
  console.log('📝 Creando archivo .env...');
  fs.writeFileSync(envPath, defaultEnv, 'utf8');
  console.log('✅ Archivo .env creado exitosamente');
  console.log('   Ubicación:', envPath);
} else {
  console.log('✅ El archivo .env ya existe');
}

if (!fs.existsSync(envExamplePath)) {
  fs.writeFileSync(envExamplePath, defaultEnv, 'utf8');
  console.log('✅ Archivo .env.example creado');
}

console.log('\n📋 Contenido del .env:');
console.log(fs.readFileSync(envPath, 'utf8'));


