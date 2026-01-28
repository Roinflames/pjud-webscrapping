/**
 * Script para verificar motores de almacenamiento y recrear tablas si es necesario
 */

const { query } = require('../src/database/db-mariadb');

async function verificarYRecrear() {
  console.log('🔍 Verificando estado de tablas...\n');

  try {
    // 1. Intentar obtener información de las tablas desde information_schema
    console.log('📋 Información de tablas desde information_schema:');
    try {
      const tablesInfo = await query(`
        SELECT
          TABLE_NAME,
          ENGINE,
          TABLE_ROWS,
          CREATE_TIME,
          UPDATE_TIME
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = 'codi_ejamtest'
        AND TABLE_NAME IN ('causas', 'movimientos', 'pdfs')
      `);
      console.table(tablesInfo);
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
    console.log('');

    // 2. Verificar si podemos hacer SELECT simple
    console.log('🔍 Intentando SELECT simple en cada tabla:\n');

    const tables = ['causas', 'movimientos', 'pdfs'];
    for (const table of tables) {
      try {
        await query(`SELECT 1 FROM ${table} LIMIT 1`);
        console.log(`   ✅ ${table}: Accesible`);
      } catch (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      }
    }
    console.log('');

    // 3. Proponer recreación de tablas
    console.log('💡 DIAGNÓSTICO:');
    console.log('   Las tablas existen en el catálogo pero los archivos .frm están corruptos/faltantes.');
    console.log('   Esto ocurre en MariaDB 5.5.68 cuando hay problemas con el sistema de archivos.');
    console.log('');
    console.log('📝 SOLUCIONES:');
    console.log('   1. DROP y CREATE las tablas (perderás datos existentes)');
    console.log('   2. Restaurar desde backup');
    console.log('   3. Reparar tablas con mysqlcheck');
    console.log('');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error general:', error);
    process.exit(1);
  }
}

verificarYRecrear();
