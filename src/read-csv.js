// Script para leer y entender el CSV de causas
const fs = require('fs');
const path = require('path');

function readCausaCSV(csvPath = null) {
  if (!csvPath) {
    csvPath = path.resolve(__dirname, '../causa.csv');
  } else if (!path.isAbsolute(csvPath)) {
    csvPath = path.resolve(__dirname, '..', csvPath);
  }
  
  if (!fs.existsSync(csvPath)) {
    throw new Error(`No se encontró el archivo: ${csvPath}`);
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Parsear header
  const header = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  console.log('📋 Columnas del CSV:', header);
  
  // Parsear datos (eliminar duplicados por causa_id)
  const causas = new Map();
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Parsear CSV (manejar comas dentro de comillas)
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    
    if (values.length !== header.length) continue;
    
    const causa = {};
    header.forEach((key, index) => {
      const value = values[index];
      causa[key] = value === 'NULL' || value === '' ? null : value;
    });
    
    // Usar causa_id como clave para eliminar duplicados
    if (causa.causa_id && !causas.has(causa.causa_id)) {
      causas.set(causa.causa_id, causa);
    }
  }
  
  return Array.from(causas.values());
}

function analyzeCausaData(causas) {
  console.log('\n📊 Análisis de Datos:');
  console.log(`   Total causas únicas: ${causas.length}`);
  
  // Estadísticas
  const conRit = causas.filter(c => c.rit && c.rit !== 'NULL').length;
  const conCaratulado = causas.filter(c => c.caratulado && c.caratulado !== 'NULL').length;
  const conCompetencia = causas.filter(c => c.competencia && c.competencia !== 'NULL').length;
  const conTribunal = causas.filter(c => c.tribunal && c.tribunal !== 'NULL').length;
  
  console.log(`   Con RIT: ${conRit}`);
  console.log(`   Con Caratulado: ${conCaratulado}`);
  console.log(`   Con Competencia: ${conCompetencia}`);
  console.log(`   Con Tribunal: ${conTribunal}`);
  
  // Ver algunos ejemplos
  console.log('\n📝 Ejemplos de causas:');
  causas.slice(0, 5).forEach((c, i) => {
    console.log(`\n   ${i + 1}. Causa ID: ${c.causa_id}`);
    console.log(`      RIT: ${c.rit || 'NULL'}`);
    console.log(`      Caratulado: ${c.caratulado || 'NULL'}`);
    console.log(`      Competencia: ${c.competencia || 'NULL'}`);
    console.log(`      Tribunal: ${c.tribunal || 'NULL'}`);
    console.log(`      Agenda ID: ${c.agenda_id || 'NULL'}`);
  });
  
  // Ver formatos de RIT
  console.log('\n🔍 Formatos de RIT encontrados:');
  const rits = new Set();
  causas.forEach(c => {
    if (c.rit && c.rit !== 'NULL') {
      rits.add(c.rit.substring(0, 2)); // Primeros 2 caracteres (tipo)
    }
  });
  console.log('   Tipos:', Array.from(rits).join(', '));
  
  return causas;
}

// Mapeo de campos CSV a BD
function mapCsvToDB(csvCausa) {
  return {
    // Tabla CAUSA
    causa_id: csvCausa.causa_id,
    agenda_id: csvCausa.agenda_id,
    id_causa: csvCausa.rit, // RIT va en id_causa
    causa_nombre: csvCausa.caratulado,
    materia_estrategia_id: csvCausa.competencia,
    juzgado_cuenta_id: csvCausa.tribunal,
    
    // Para scraping (pjud_config.json)
    rit: csvCausa.rit,
    competencia: csvCausa.competencia,
    tribunal: csvCausa.tribunal,
    tipoCausa: csvCausa.rit ? csvCausa.rit.split('-')[0] : null, // Extraer tipo del RIT
    caratulado: csvCausa.caratulado,
    
    // Datos de AGENDA (si existen)
    cliente: csvCausa.cliente,
    rut: csvCausa.rut,
    abogado_id: csvCausa.abogado_id,
    cuenta_id: csvCausa.cuenta_id
  };
}

if (require.main === module) {
  try {
    const causas = readCausaCSV();
    analyzeCausaData(causas);
    
    // Ejemplo de mapeo
    console.log('\n🔄 Ejemplo de mapeo CSV → BD:');
    if (causas.length > 0) {
      const ejemplo = mapCsvToDB(causas[0]);
      console.log(JSON.stringify(ejemplo, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

module.exports = { readCausaCSV, mapCsvToDB, analyzeCausaData };


