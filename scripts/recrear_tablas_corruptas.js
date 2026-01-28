/**
 * Script para recrear tablas corruptas en la base de datos
 *
 * IMPORTANTE: Este script eliminará TODOS los datos existentes en las tablas
 * causas, movimientos, pdfs, etapas_juicio, ebooks, scraping_log, errores_scraping
 * y sus vistas asociadas.
 *
 * Solo ejecutar si se confirma que las tablas están corruptas y no hay datos importantes.
 */

const fs = require('fs');
const path = require('path');
const { query, closeConnection } = require('../src/database/db-mariadb');

async function recrearTablas() {
  console.log('⚠️  ADVERTENCIA: Este script eliminará todos los datos existentes');
  console.log('   en las tablas principales (causas, movimientos, pdfs, etc.)\n');

  const schemaPath = path.join(__dirname, '../database/schema_mariadb_5.5.sql');

  if (!fs.existsSync(schemaPath)) {
    console.error('❌ No se encontró el archivo schema_mariadb_5.5.sql');
    process.exit(1);
  }

  console.log('📄 Leyendo schema desde:', schemaPath);
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Dividir el schema en statements individuales
  // Eliminar comentarios de una línea
  let cleanSchema = schema
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');

  // Separar por delimitadores
  const parts = cleanSchema.split('DELIMITER //');
  const beforeDelimiter = parts[0];
  const afterDelimiter = parts[1] ? parts[1].split('DELIMITER ;')[0] : '';
  const afterEnd = parts[1] ? parts[1].split('DELIMITER ;')[1] : '';

  // Statements regulares (antes de DELIMITER //)
  const regularStatements = beforeDelimiter
    .split(';')
    .map(s => s.trim())
    .filter(s => s && s !== 'SET NAMES utf8' && s !== 'SET FOREIGN_KEY_CHECKS = 0' && s !== 'SET FOREIGN_KEY_CHECKS = 1');

  // Procedimientos almacenados (entre DELIMITER // y DELIMITER ;)
  const procedureStatements = afterDelimiter
    .split('//')
    .map(s => s.trim())
    .filter(s => s && s.startsWith('CREATE PROCEDURE') || s.startsWith('CREATE OR REPLACE PROCEDURE'));

  // Statements después de DELIMITER ;
  const finalStatements = afterEnd
    .split(';')
    .map(s => s.trim())
    .filter(s => s && s !== 'SET FOREIGN_KEY_CHECKS = 1');

  console.log(`\n📊 Estadísticas del schema:`);
  console.log(`   - Statements regulares: ${regularStatements.length}`);
  console.log(`   - Procedimientos almacenados: ${procedureStatements.length}`);
  console.log(`   - Statements finales: ${finalStatements.length}`);
  console.log('');

  try {
    // Desactivar foreign key checks
    console.log('🔓 Desactivando verificación de foreign keys...');
    await query('SET FOREIGN_KEY_CHECKS = 0');

    // Ejecutar statements regulares
    console.log('\n🔨 Ejecutando statements regulares...');
    let executed = 0;
    for (const statement of regularStatements) {
      try {
        // Mostrar solo los DROP y CREATE TABLE
        if (statement.toUpperCase().startsWith('DROP TABLE')) {
          const tableName = statement.match(/DROP TABLE IF EXISTS `?(\w+)`?/i)?.[1];
          console.log(`   ↪ Eliminando tabla: ${tableName}`);
        } else if (statement.toUpperCase().startsWith('CREATE TABLE')) {
          const tableName = statement.match(/CREATE TABLE `?(\w+)`?/i)?.[1];
          console.log(`   ↪ Creando tabla: ${tableName}`);
        } else if (statement.toUpperCase().startsWith('CREATE OR REPLACE VIEW')) {
          const viewName = statement.match(/CREATE OR REPLACE VIEW `?(\w+)`?/i)?.[1];
          console.log(`   ↪ Creando vista: ${viewName}`);
        } else if (statement.toUpperCase().startsWith('INSERT INTO')) {
          const tableName = statement.match(/INSERT INTO `?(\w+)`?/i)?.[1];
          console.log(`   ↪ Insertando datos en: ${tableName}`);
        }

        await query(statement);
        executed++;
      } catch (error) {
        console.error(`   ❌ Error ejecutando statement: ${error.message}`);
        console.error(`   Statement: ${statement.substring(0, 100)}...`);
      }
    }
    console.log(`   ✅ Ejecutados ${executed}/${regularStatements.length} statements regulares`);

    // Ejecutar procedimientos almacenados
    if (procedureStatements.length > 0) {
      console.log('\n📝 Ejecutando procedimientos almacenados...');
      for (const procedure of procedureStatements) {
        try {
          const procName = procedure.match(/CREATE PROCEDURE `?(\w+)`?/i)?.[1];
          console.log(`   ↪ Creando procedimiento: ${procName}`);
          await query(procedure);
        } catch (error) {
          console.error(`   ❌ Error creando procedimiento: ${error.message}`);
        }
      }
    }

    // Ejecutar statements finales
    if (finalStatements.length > 0) {
      console.log('\n🔧 Ejecutando statements finales...');
      for (const statement of finalStatements) {
        try {
          await query(statement);
        } catch (error) {
          console.error(`   ❌ Error: ${error.message}`);
        }
      }
    }

    // Reactivar foreign key checks
    console.log('\n🔒 Reactivando verificación de foreign keys...');
    await query('SET FOREIGN_KEY_CHECKS = 1');

    // Verificar creación exitosa
    console.log('\n✅ Verificando tablas recreadas...');
    const tables = await query('SHOW TABLES');
    console.log(`   - Tablas encontradas: ${tables.length}`);

    // Verificar que las tablas críticas existen
    const criticalTables = ['causas', 'movimientos', 'pdfs'];
    for (const table of criticalTables) {
      try {
        await query(`SELECT 1 FROM ${table} LIMIT 1`);
        console.log(`   ✅ ${table}: Accesible`);
      } catch (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      }
    }

    // Mostrar conteo de datos de prueba
    console.log('\n📊 Datos de prueba insertados:');
    const [countCausas] = await query('SELECT COUNT(*) as total FROM causas');
    console.log(`   - Causas: ${countCausas.total}`);
    const [countEtapas] = await query('SELECT COUNT(*) as total FROM etapas_juicio');
    console.log(`   - Etapas de juicio: ${countEtapas.total}`);

    console.log('\n✅ SCHEMA RECREADO EXITOSAMENTE');
    console.log('   Las tablas están ahora listas para recibir datos del scraping.\n');

  } catch (error) {
    console.error('\n❌ Error general:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

recrearTablas();
