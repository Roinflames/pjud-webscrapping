/**
 * Script para verificar permisos y configuración de MySQL/MariaDB
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function verificarPermisos() {
  console.log('🔍 VERIFICACIÓN DE PERMISOS Y CONFIGURACIÓN MYSQL\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3307'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || 'root'
  });

  try {
    // 1. Verificar modo read_only
    console.log('📋 VARIABLES DEL SISTEMA:\n');
    const [[readOnly]] = await connection.query(`SHOW VARIABLES LIKE 'read_only'`);
    console.log(`   read_only: ${readOnly.Value} ${readOnly.Value === 'ON' ? '❌ PROBLEMA' : '✅'}`);

    const [[superReadOnly]] = await connection.query(`SHOW VARIABLES LIKE 'super_read_only'`);
    if (superReadOnly) {
      console.log(`   super_read_only: ${superReadOnly.Value} ${superReadOnly.Value === 'ON' ? '❌ PROBLEMA' : '✅'}`);
    }

    // 2. Verificar datadir
    const [[datadir]] = await connection.query(`SHOW VARIABLES LIKE 'datadir'`);
    console.log(`   datadir: ${datadir.Value}`);

    // 3. Verificar tmpdir
    const [[tmpdir]] = await connection.query(`SHOW VARIABLES LIKE 'tmpdir'`);
    console.log(`   tmpdir: ${tmpdir.Value}`);

    // 4. Verificar usuario actual
    const [[user]] = await connection.query(`SELECT USER(), CURRENT_USER()`);
    console.log(`   usuario: ${user['USER()']}`);
    console.log(`   usuario_efectivo: ${user['CURRENT_USER()']}`);

    // 5. Verificar privilegios
    console.log('\n🔐 PRIVILEGIOS DEL USUARIO:\n');
    const [grants] = await connection.query(`SHOW GRANTS FOR CURRENT_USER()`);
    grants.forEach(grant => {
      console.log(`   ${Object.values(grant)[0]}`);
    });

    // 6. Verificar versión
    console.log('\n📦 VERSIÓN DE MYSQL/MARIADB:\n');
    const [[version]] = await connection.query(`SELECT VERSION()`);
    console.log(`   ${version['VERSION()']}`);

    // 7. Intentar crear base de datos temporal
    console.log('\n🧪 PRUEBA DE PERMISOS:\n');
    try {
      await connection.query('CREATE DATABASE IF NOT EXISTS test_permisos_temp');
      console.log('   ✅ CREATE DATABASE: Permitido');

      await connection.query('USE test_permisos_temp');
      console.log('   ✅ USE DATABASE: Permitido');

      await connection.query('CREATE TABLE test_tabla (id INT)');
      console.log('   ✅ CREATE TABLE: Permitido');

      await connection.query('DROP TABLE test_tabla');
      console.log('   ✅ DROP TABLE: Permitido');

      await connection.query('DROP DATABASE test_permisos_temp');
      console.log('   ✅ DROP DATABASE: Permitido');

      console.log('\n✅ CONCLUSIÓN: Usuario tiene permisos completos');
      console.log('\n⚠️  PROBLEMA: Específico con database "codi_ejamtest"');
      console.log('   El datadir puede tener archivos corruptos que impiden eliminación.\n');

    } catch (error) {
      console.log(`\n❌ PROBLEMA DE PERMISOS: ${error.message}\n`);

      if (readOnly.Value === 'ON') {
        console.log('🔧 SOLUCIÓN: Desactivar modo read_only');
        console.log('   Ejecutar como usuario con SUPER privilege:');
        console.log('   SET GLOBAL read_only = 0;\n');
      } else {
        console.log('🔧 POSIBLES CAUSAS:');
        console.log('   - Usuario no tiene privilegios suficientes');
        console.log('   - Filesystem del datadir tiene problemas');
        console.log('   - Disco lleno (aunque df -h muestra espacio)');
        console.log('   - SELinux/AppArmor bloqueando acceso\n');
      }
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    await connection.end();
  }
}

verificarPermisos();
