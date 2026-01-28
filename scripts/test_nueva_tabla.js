/**
 * Script para probar si MariaDB funciona correctamente con tablas nuevas
 * Esto ayuda a determinar si el problema es solo con las tablas corruptas
 * o con toda la base de datos
 */

const { query } = require('../src/database/db-mariadb');

async function testNuevaTabla() {
  console.log('🧪 Probando creación de tabla nueva en MariaDB...\n');

  try {
    // Test 1: Crear tabla de prueba
    console.log('📝 Test 1: Creando tabla de prueba...');
    await query(`
      CREATE TABLE IF NOT EXISTS test_reparacion (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100),
        valor INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8
    `);
    console.log('   ✅ Tabla test_reparacion creada exitosamente');

    // Test 2: Insertar datos
    console.log('\n📝 Test 2: Insertando datos...');
    await query(`INSERT INTO test_reparacion (nombre, valor) VALUES ('Prueba 1', 100)`);
    await query(`INSERT INTO test_reparacion (nombre, valor) VALUES ('Prueba 2', 200)`);
    await query(`INSERT INTO test_reparacion (nombre, valor) VALUES ('Prueba 3', 300)`);
    console.log('   ✅ 3 registros insertados');

    // Test 3: Leer datos
    console.log('\n📝 Test 3: Leyendo datos...');
    const rows = await query(`SELECT * FROM test_reparacion`);
    console.log('   ✅ Datos leídos correctamente:');
    console.table(rows);

    // Test 4: Actualizar datos
    console.log('📝 Test 4: Actualizando datos...');
    await query(`UPDATE test_reparacion SET valor = 999 WHERE nombre = 'Prueba 1'`);
    const [updated] = await query(`SELECT * FROM test_reparacion WHERE nombre = 'Prueba 1'`);
    console.log(`   ✅ Datos actualizados: ${updated.nombre} = ${updated.valor}`);

    // Test 5: Verificar estructura
    console.log('\n📝 Test 5: Verificando estructura de tabla...');
    const structure = await query(`DESCRIBE test_reparacion`);
    console.log('   ✅ Estructura de tabla:');
    console.table(structure);

    // Test 6: Verificar en SHOW TABLES
    console.log('📝 Test 6: Verificando que aparece en SHOW TABLES...');
    const tables = await query(`SHOW TABLES LIKE 'test_reparacion'`);
    if (tables.length > 0) {
      console.log('   ✅ Tabla aparece correctamente en catálogo');
    } else {
      console.log('   ❌ Tabla NO aparece en catálogo (problema)');
    }

    // Test 7: Eliminar y verificar
    console.log('\n📝 Test 7: Eliminando tabla...');
    await query(`DROP TABLE test_reparacion`);
    console.log('   ✅ Tabla eliminada');

    const tablesAfterDrop = await query(`SHOW TABLES LIKE 'test_reparacion'`);
    if (tablesAfterDrop.length === 0) {
      console.log('   ✅ Tabla eliminada correctamente del catálogo');
    } else {
      console.log('   ❌ Tabla TODAVÍA aparece en catálogo (problema grave)');
    }

    // Conclusión
    console.log('\n' + '='.repeat(60));
    console.log('🎉 CONCLUSIÓN: MariaDB funciona correctamente');
    console.log('='.repeat(60));
    console.log('\nEsto significa que el problema es SOLO con las tablas corruptas');
    console.log('existentes, NO con el motor de base de datos.\n');
    console.log('✅ SOLUCIÓN: Eliminar manualmente los archivos .frm de las tablas');
    console.log('   corruptas del datadir de MariaDB.\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack:', error.stack);

    console.log('\n' + '='.repeat(60));
    console.log('❌ CONCLUSIÓN: Problema más grave con MariaDB');
    console.log('='.repeat(60));
    console.log('\nEl motor de base de datos tiene problemas incluso con tablas nuevas.');
    console.log('Posibles causas:');
    console.log('  - Permisos insuficientes en el datadir');
    console.log('  - Filesystem lleno o corrupto');
    console.log('  - MariaDB configurado en modo read-only');
    console.log('  - Problema con el tablespace InnoDB\n');

    process.exit(1);
  }
}

testNuevaTabla();
