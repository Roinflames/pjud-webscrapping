/**
 * Estrategia alternativa: Usar schema existente pero SOLO ejecutar CREATE TABLE
 * sin intentar DROP DATABASE (que causa errno 30)
 */

const { query } = require('../src/database/db-mariadb');
const fs = require('fs');
const path = require('path');

async function crearTablasDirectamente() {
  console.log('🔧 ESTRATEGIA ALTERNATIVA: Crear tablas directamente\n');
  console.log('   (Sin DROP DATABASE para evitar errno 30)\n');

  try {
    // PASO 1: Desactivar foreign keys
    console.log('🔓 Desactivando foreign keys...');
    await query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('   ✅ Desactivadas\n');

    // PASO 2: Intentar usar database diferente (test)
    console.log('🧪 Probando con base de datos temporal...');
    try {
      await query('CREATE DATABASE IF NOT EXISTS pjud_scraping_clean');
      console.log('   ✅ Base de datos temporal creada');
      await query('USE pjud_scraping_clean');
      console.log('   ✅ Usando base de datos temporal\n');
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log('   ↪ Continuando con codi_ejamtest...\n');
      await query('USE codi_ejamtest');
    }

    // PASO 3: Leer schema
    console.log('📄 Leyendo schema...');
    const schemaPath = path.join(__dirname, '../database/schema_mariadb_5.5.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // PASO 4: Extraer solo CREATE TABLE statements
    console.log('🔍 Extrayendo CREATE TABLE statements...');
    const createTableRegex = /CREATE TABLE `(\w+)`[^;]+;/gs;
    const creates = schema.match(createTableRegex);

    if (!creates) {
      throw new Error('No se encontraron CREATE TABLE statements');
    }

    console.log(`   ✅ Encontrados ${creates.length} CREATE TABLE\n`);

    // PASO 5: Ejecutar cada CREATE TABLE
    console.log('🔨 Creando tablas...\n');
    const created = [];
    const failed = [];

    for (const createStatement of creates) {
      const tableName = createStatement.match(/CREATE TABLE `(\w+)`/)?.[1];

      try {
        console.log(`   → ${tableName}...`);
        await query(createStatement);
        console.log(`   ✅ ${tableName}: Creada`);
        created.push(tableName);
      } catch (error) {
        console.log(`   ❌ ${tableName}: ${error.message}`);
        failed.push({ table: tableName, error: error.message });
      }
    }

    console.log(`\n📊 RESULTADO:`);
    console.log(`   - Creadas: ${created.length}`);
    console.log(`   - Fallidas: ${failed.length}\n`);

    if (created.length === 0) {
      throw new Error('No se pudo crear ninguna tabla');
    }

    // PASO 6: Insertar datos iniciales en etapas_juicio
    if (created.includes('etapas_juicio')) {
      console.log('📥 Insertando datos iniciales en etapas_juicio...');
      const insertEtapas = schema.match(/INSERT INTO `etapas_juicio`[^;]+;/s)?.[0];
      if (insertEtapas) {
        try {
          await query(insertEtapas);
          const [count] = await query('SELECT COUNT(*) as total FROM etapas_juicio');
          console.log(`   ✅ ${count.total} etapas insertadas\n`);
        } catch (error) {
          console.log(`   ⚠️  ${error.message}\n`);
        }
      }
    }

    // PASO 7: Probar INSERT de prueba
    if (created.includes('causas')) {
      console.log('🧪 Probando INSERT en causas...');
      try {
        await query(`
          INSERT INTO causas (rit, tipo_causa, rol, anio, caratulado)
          VALUES ('C-TEST-2026', 'C', 'TEST', 2026, 'PRUEBA DE FUNCIONAMIENTO')
        `);
        console.log('   ✅ INSERT exitoso');

        const [[test]] = await query(`SELECT * FROM causas WHERE rit = 'C-TEST-2026'`);
        console.log(`   ✅ SELECT exitoso: ${test.caratulado}`);

        await query(`DELETE FROM causas WHERE rit = 'C-TEST-2026'`);
        console.log('   ✅ DELETE exitoso\n');
      } catch (error) {
        console.log(`   ❌ ${error.message}\n`);
      }
    }

    // PASO 8: Activar foreign keys
    console.log('🔒 Activando foreign keys...');
    await query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('   ✅ Activadas\n');

    // RESUMEN
    console.log('═'.repeat(60));
    if (failed.length === 0) {
      console.log('🎉 ÉXITO: Todas las tablas creadas correctamente');
    } else {
      console.log('⚠️  PARCIAL: Algunas tablas no se pudieron crear');
      console.log('\n   Tablas fallidas:');
      failed.forEach(f => console.log(`   - ${f.table}: ${f.error}`));
    }
    console.log('═'.repeat(60));

    if (created.includes('causas') && created.includes('movimientos') && created.includes('pdfs')) {
      console.log('\n✅ Las tablas críticas están disponibles');
      console.log('📝 Próximo paso: Ejecutar scraping de prueba\n');
    } else {
      console.log('\n❌ Faltan tablas críticas para el scraping\n');
    }

    process.exit(failed.length === 0 ? 0 : 1);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

crearTablasDirectamente();
