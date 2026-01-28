/**
 * Script para verificar la estructura de la base de datos
 */

const { query } = require('../src/database/db-mariadb');

async function verificarEstructura() {
  console.log('🔍 Verificando estructura de base de datos...\n');

  try {
    // 1. Verificar tablas existentes
    console.log('📋 Tablas en la base de datos:');
    const tables = await query('SHOW TABLES');
    console.log(tables);
    console.log('');

    // 2. Estructura de tabla causas
    console.log('📊 Estructura tabla CAUSAS:');
    try {
      const causasStructure = await query('DESCRIBE causas');
      console.log(causasStructure);
      console.log('');
    } catch (error) {
      console.error('❌ Error al obtener estructura de causas:', error.message);
      console.log('');
    }

    // 3. Estructura de tabla movimientos
    console.log('📊 Estructura tabla MOVIMIENTOS:');
    try {
      const movimientosStructure = await query('DESCRIBE movimientos');
      console.log(movimientosStructure);
      console.log('');
    } catch (error) {
      console.error('❌ Error al obtener estructura de movimientos:', error.message);
      console.log('');
    }

    // 4. Estructura de tabla pdfs
    console.log('📊 Estructura tabla PDFS:');
    try {
      const pdfsStructure = await query('DESCRIBE pdfs');
      console.log(pdfsStructure);
      console.log('');
    } catch (error) {
      console.error('❌ Error al obtener estructura de pdfs:', error.message);
      console.log('');
    }

    // 5. Contar registros en cada tabla
    console.log('📈 Conteo de registros:');
    try {
      const [countCausas] = await query('SELECT COUNT(*) as total FROM causas');
      console.log(`   - Causas: ${countCausas.total}`);
    } catch (error) {
      console.error(`   - Causas: ERROR (${error.message})`);
    }

    try {
      const [countMovimientos] = await query('SELECT COUNT(*) as total FROM movimientos');
      console.log(`   - Movimientos: ${countMovimientos.total}`);
    } catch (error) {
      console.error(`   - Movimientos: ERROR (${error.message})`);
    }

    try {
      const [countPdfs] = await query('SELECT COUNT(*) as total FROM pdfs');
      console.log(`   - PDFs: ${countPdfs.total}`);
    } catch (error) {
      console.error(`   - PDFs: ERROR (${error.message})`);
    }
    console.log('');

    // 6. Muestra de últimos 5 registros de causas
    console.log('📄 Últimas 5 causas guardadas:');
    try {
      const ultimasCausas = await query(`
        SELECT causa_id, rit, caratulado, tribunal_nombre, estado
        FROM causas
        ORDER BY causa_id DESC
        LIMIT 5
      `);
      console.table(ultimasCausas);
    } catch (error) {
      console.error('❌ Error al obtener causas:', error.message);
    }

    console.log('✅ Verificación completada');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error general:', error);
    process.exit(1);
  }
}

verificarEstructura();
