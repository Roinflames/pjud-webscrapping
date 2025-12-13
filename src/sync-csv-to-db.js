// Script para sincronizar datos del CSV con la base de datos
// Este script lee el CSV y actualiza/inserta datos en la tabla causa

const fs = require('fs');
const path = require('path');
const { readCausaCSV, mapCsvToDB } = require('./read-csv');

// Configuración de BD (ajustar según tu entorno)
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'codi_ejamtest'
};

// Función para escapar strings SQL
function escapeSQL(str) {
  if (!str || str === 'NULL') return 'NULL';
  return `'${String(str).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

// Función para generar SQL de INSERT/UPDATE
function generateSQL(csvCausa) {
  const mapped = mapCsvToDB(csvCausa);
  
  // Validar que tenga datos mínimos
  if (!mapped.causa_id || !mapped.id_causa || mapped.id_causa === 'NULL') {
    return null; // Saltar si no tiene datos mínimos
  }
  
  // SQL para UPDATE (asumiendo que el id ya existe)
  // Si no existe, se puede hacer INSERT, pero mejor UPDATE para no duplicar
  const sql = `
UPDATE causa SET
  agenda_id = ${mapped.agenda_id ? mapped.agenda_id : 'NULL'},
  materia_estrategia_id = ${mapped.materia_estrategia_id ? mapped.materia_estrategia_id : 'NULL'},
  juzgado_cuenta_id = ${mapped.juzgado_cuenta_id && mapped.juzgado_cuenta_id !== 'NULL' ? mapped.juzgado_cuenta_id : 'NULL'},
  id_causa = ${escapeSQL(mapped.id_causa)},
  causa_nombre = ${escapeSQL(mapped.causa_nombre)},
  estado = 1
WHERE id = ${mapped.causa_id};
`.trim();
  
  return sql;
}

// Generar archivo SQL con todas las actualizaciones
function generateSQLFile(outputPath = 'sync_causas.sql') {
  console.log('📂 Leyendo CSV...');
  const causas = readCausaCSV();
  
  console.log(`📊 Procesando ${causas.length} causas...`);
  
  const sqlStatements = [
    '-- Script generado automáticamente para sincronizar CSV con BD',
    `-- Fecha: ${new Date().toISOString()}`,
    `-- Total causas: ${causas.length}`,
    '',
    'USE codi_ejamtest;',
    '',
    '-- Desactivar verificaciones temporales para mejor rendimiento',
    'SET FOREIGN_KEY_CHECKS = 0;',
    'SET UNIQUE_CHECKS = 0;',
    '',
  ];
  
  let processed = 0;
  let withRit = 0;
  let withCaratulado = 0;
  
  causas.forEach((csvCausa, index) => {
    // Solo procesar causas con RIT (id_causa)
    if (csvCausa.rit && csvCausa.rit !== 'NULL' && csvCausa.rit.trim() !== '') {
      const sql = generateSQL(csvCausa);
      
      if (sql) {
        sqlStatements.push(`-- Causa ID: ${csvCausa.causa_id}, RIT: ${csvCausa.rit}`);
        sqlStatements.push(sql);
        sqlStatements.push('');
        
        withRit++;
        if (csvCausa.caratulado && csvCausa.caratulado !== 'NULL' && csvCausa.caratulado.trim() !== '') {
          withCaratulado++;
        }
      }
    }
    processed++;
    
    if ((index + 1) % 1000 === 0) {
      console.log(`   Procesadas ${index + 1}/${causas.length} causas...`);
    }
  });
  
  sqlStatements.push('-- Reactivar verificaciones');
  sqlStatements.push('SET FOREIGN_KEY_CHECKS = 1;');
  sqlStatements.push('SET UNIQUE_CHECKS = 1;');
  
  const fullSQL = sqlStatements.join('\n');
  
  fs.writeFileSync(outputPath, fullSQL, 'utf-8');
  
  console.log(`\n✅ Archivo SQL generado: ${outputPath}`);
  console.log(`   Total causas procesadas: ${processed}`);
  console.log(`   Con RIT y caratulado: ${withRit}`);
  console.log(`   Con caratulado: ${withCaratulado}`);
  console.log(`\n💡 Para ejecutar:`);
  console.log(`   mysql -u root -p codi_ejamtest < ${outputPath}`);
  
  return outputPath;
}

// Analizar diferencias entre CSV y BD
function analyzeDifferences() {
  console.log('📊 Analizando estructura de datos...\n');
  
  const causas = readCausaCSV();
  
  // Estadísticas del CSV
  const stats = {
    total: causas.length,
    conRit: 0,
    conCaratulado: 0,
    conCompetencia: 0,
    conTribunal: 0,
    conAgendaId: 0,
    completas: 0 // Con RIT, caratulado, competencia y tribunal
  };
  
  causas.forEach(c => {
    if (c.rit && c.rit !== 'NULL') stats.conRit++;
    if (c.caratulado && c.caratulado !== 'NULL') stats.conCaratulado++;
    if (c.competencia && c.competencia !== 'NULL') stats.conCompetencia++;
    if (c.tribunal && c.tribunal !== 'NULL') stats.conTribunal++;
    if (c.agenda_id && c.agenda_id !== 'NULL') stats.conAgendaId++;
    
    if (c.rit && c.rit !== 'NULL' &&
        c.caratulado && c.caratulado !== 'NULL' &&
        c.competencia && c.competencia !== 'NULL' &&
        c.tribunal && c.tribunal !== 'NULL') {
      stats.completas++;
    }
  });
  
  console.log('📈 Estadísticas del CSV:');
  console.log(`   Total causas: ${stats.total}`);
  console.log(`   Con RIT: ${stats.conRit} (${(stats.conRit/stats.total*100).toFixed(1)}%)`);
  console.log(`   Con Caratulado: ${stats.conCaratulado} (${(stats.conCaratulado/stats.total*100).toFixed(1)}%)`);
  console.log(`   Con Competencia: ${stats.conCompetencia} (${(stats.conCompetencia/stats.total*100).toFixed(1)}%)`);
  console.log(`   Con Tribunal: ${stats.conTribunal} (${(stats.conTribunal/stats.total*100).toFixed(1)}%)`);
  console.log(`   Con Agenda ID: ${stats.conAgendaId} (${(stats.conAgendaId/stats.total*100).toFixed(1)}%)`);
  console.log(`   Completas (RIT + Caratulado + Competencia + Tribunal): ${stats.completas} (${(stats.completas/stats.total*100).toFixed(1)}%)`);
  
  // Mapeo de campos
  console.log('\n🔄 Mapeo CSV → BD (tabla causa):');
  console.log('   CSV.causa_id          → BD.id');
  console.log('   CSV.agenda_id         → BD.agenda_id');
  console.log('   CSV.rit               → BD.id_causa');
  console.log('   CSV.caratulado        → BD.causa_nombre');
  console.log('   CSV.competencia       → BD.materia_estrategia_id');
  console.log('   CSV.tribunal          → BD.juzgado_cuenta_id');
  console.log('   BD.estado            → 1 (default)');
  console.log('   BD.anexo_id          → NULL');
  console.log('   BD.fecha_ultimo_ingreso → NULL');
  
  return stats;
}

if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'sql') {
    const outputPath = process.argv[3] || 'sync_causas.sql';
    generateSQLFile(outputPath);
  } else if (command === 'analyze') {
    analyzeDifferences();
  } else {
    console.log('📋 Uso:');
    console.log('   node src/sync-csv-to-db.js analyze  - Analizar diferencias');
    console.log('   node src/sync-csv-to-db.js sql      - Generar archivo SQL');
    console.log('   node src/sync-csv-to-db.js sql output.sql - Generar SQL en archivo específico');
  }
}

module.exports = { generateSQLFile, analyzeDifferences, generateSQL };

