/**
 * Script para forzar limpieza completa de metadata corrupta
 *
 * Este script elimina todas las referencias a las tablas corruptas
 * del catálogo de MariaDB antes de recrearlas.
 */

const { query, closeConnection } = require('../src/database/db-mariadb');
const fs = require('fs');
const path = require('path');

async function limpiarYRecrear() {
  console.log('🧹 LIMPIEZA FORZADA DE TABLAS CORRUPTAS\n');

  const tablasCorruptas = [
    'v_movimientos_por_etapa',  // Vistas primero
    'v_causas_resumen',
    'errores_scraping',
    'scraping_log',
    'ebooks',
    'pdfs',
    'movimientos',
    'etapas_juicio',
    'causas'
  ];

  try {
    console.log('🔓 Desactivando foreign keys...');
    await query('SET FOREIGN_KEY_CHECKS = 0');

    // PASO 1: Intentar DROP IF EXISTS de cada tabla
    console.log('\n🗑️  PASO 1: Intentando DROP de tablas...');
    for (const tabla of tablasCorruptas) {
      try {
        // Determinar si es vista o tabla
        const isView = tabla.startsWith('v_');
        const command = isView ? 'DROP VIEW IF EXISTS' : 'DROP TABLE IF EXISTS';
        await query(`${command} \`${tabla}\``);
        console.log(`   ✅ ${tabla}: Eliminada del catálogo`);
      } catch (error) {
        console.log(`   ⚠️  ${tabla}: ${error.message}`);
        // Continuar de todos modos
      }
    }

    // PASO 2: Limpiar metadata de information_schema manualmente
    console.log('\n🔧 PASO 2: Limpiando metadata residual...');
    try {
      // No podemos eliminar directamente de information_schema, pero podemos
      // usar FLUSH TABLES para forzar recarga de metadata
      await query('FLUSH TABLES');
      console.log('   ✅ FLUSH TABLES ejecutado');
    } catch (error) {
      console.log(`   ⚠️  Error en FLUSH: ${error.message}`);
    }

    // PASO 3: Verificar que las tablas ya no existen
    console.log('\n🔍 PASO 3: Verificando limpieza...');
    const tablas = await query('SHOW TABLES');
    const tablasExistentes = tablas.map(t => Object.values(t)[0]);
    console.log(`   - Tablas actuales: ${tablasExistentes.length}`);
    console.log(`   - Tablas: ${tablasExistentes.join(', ')}`);

    for (const tabla of tablasCorruptas.filter(t => !t.startsWith('v_'))) {
      if (tablasExistentes.includes(tabla)) {
        console.log(`   ❌ ${tabla}: AÚN EXISTE en catálogo`);
      } else {
        console.log(`   ✅ ${tabla}: Limpiada correctamente`);
      }
    }

    // PASO 4: Recrear tablas desde schema
    console.log('\n🔨 PASO 4: Recreando tablas desde schema...');

    const schemaPath = path.join(__dirname, '../database/schema_mariadb_5.5.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Extraer solo los CREATE TABLE statements
    const createTableRegex = /CREATE TABLE `(\w+)`[^;]+;/gs;
    const creates = schema.match(createTableRegex);

    if (!creates) {
      throw new Error('No se encontraron CREATE TABLE en el schema');
    }

    console.log(`   Encontrados ${creates.length} CREATE TABLE statements\n`);

    for (const createStatement of creates) {
      const tableName = createStatement.match(/CREATE TABLE `(\w+)`/)?.[1];
      try {
        console.log(`   → Creando tabla: ${tableName}...`);
        await query(createStatement);
        console.log(`   ✅ ${tableName}: Creada exitosamente`);
      } catch (error) {
        console.log(`   ❌ ${tableName}: ${error.message}`);

        // Si falla, puede ser que la tabla todavía tenga metadata residual
        // Intentar eliminar de forma más agresiva y reintentar
        if (error.message.includes('.frm')) {
          console.log(`   ↪ Intentando limpieza agresiva de ${tableName}...`);
          try {
            // Intentar eliminar forzadamente
            await query(`DROP TABLE IF EXISTS \`${tableName}\``);
            await query('FLUSH TABLES');

            // Reintentar CREATE
            await query(createStatement);
            console.log(`   ✅ ${tableName}: Creada exitosamente (2do intento)`);
          } catch (error2) {
            console.log(`   ❌ ${tableName}: Fallo definitivo - ${error2.message}`);
          }
        }
      }
    }

    // PASO 5: Insertar datos iniciales
    console.log('\n📊 PASO 5: Insertando datos iniciales...');

    // Etapas de juicio
    try {
      const insertEtapas = schema.match(/INSERT INTO `etapas_juicio`[^;]+;/s)?.[0];
      if (insertEtapas) {
        await query(insertEtapas);
        const [count] = await query('SELECT COUNT(*) as total FROM etapas_juicio');
        console.log(`   ✅ Etapas de juicio: ${count.total} registros insertados`);
      }
    } catch (error) {
      console.log(`   ⚠️  Etapas: ${error.message}`);
    }

    // Causas de prueba
    try {
      const insertCausas = schema.match(/INSERT INTO `causas`[^;]+;/s)?.[0];
      if (insertCausas) {
        await query(insertCausas);
        const [count] = await query('SELECT COUNT(*) as total FROM causas');
        console.log(`   ✅ Causas de prueba: ${count.total} registros insertados`);
      }
    } catch (error) {
      console.log(`   ⚠️  Causas: ${error.message}`);
    }

    // PASO 6: Crear vistas
    console.log('\n👁️  PASO 6: Creando vistas...');
    const createViewRegex = /CREATE OR REPLACE VIEW `(\w+)`[^;]+;/gs;
    const views = schema.match(createViewRegex);

    if (views) {
      for (const viewStatement of views) {
        const viewName = viewStatement.match(/CREATE OR REPLACE VIEW `(\w+)`/)?.[1];
        try {
          await query(viewStatement);
          console.log(`   ✅ Vista ${viewName}: Creada`);
        } catch (error) {
          console.log(`   ❌ Vista ${viewName}: ${error.message}`);
        }
      }
    }

    // PASO 7: Verificación final
    console.log('\n✅ PASO 7: Verificación final...');
    await query('SET FOREIGN_KEY_CHECKS = 1');

    const tablasFinales = await query('SHOW TABLES');
    console.log(`   - Total tablas/vistas: ${tablasFinales.length}`);

    // Probar acceso a tablas críticas
    const critical = ['causas', 'movimientos', 'pdfs'];
    for (const tabla of critical) {
      try {
        await query(`SELECT 1 FROM ${tabla} LIMIT 1`);
        const [count] = await query(`SELECT COUNT(*) as total FROM ${tabla}`);
        console.log(`   ✅ ${tabla}: Accesible (${count.total} registros)`);
      } catch (error) {
        console.log(`   ❌ ${tabla}: ${error.message}`);
      }
    }

    console.log('\n🎉 PROCESO COMPLETADO\n');

  } catch (error) {
    console.error('\n❌ Error crítico:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

limpiarYRecrear();
