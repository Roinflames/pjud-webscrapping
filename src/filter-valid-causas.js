// Script para filtrar y eliminar causas inválidas del CSV
const fs = require('fs');
const path = require('path');
const { readCausaCSV } = require('./read-csv');

// Validar si una causa es válida para scraping
function isValidForScraping(csvCausa, requireTribunal = true) {
  // Debe tener RIT válido (formato: TIPO-ROL-AÑO)
  if (!csvCausa.rit || csvCausa.rit === 'NULL' || csvCausa.rit.trim() === '') {
    return { valid: false, reason: 'RIT faltante o vacío' };
  }
  
  // Validar formato RIT (debe tener al menos 2 guiones: TIPO-ROL-AÑO)
  const parts = csvCausa.rit.split('-');
  if (parts.length < 3) {
    return { valid: false, reason: `RIT formato inválido: "${csvCausa.rit}" (debe ser TIPO-ROL-AÑO)` };
  }
  
  // Validar que el RIT no sea texto inválido
  const ritUpper = csvCausa.rit.toUpperCase();
  if (ritUpper.includes('SIN ROL') || 
      ritUpper.includes('SIN RIT') || 
      ritUpper.trim().length < 5) {
    return { valid: false, reason: `RIT inválido: "${csvCausa.rit}"` };
  }
  
  // Debe tener competencia
  if (!csvCausa.competencia || csvCausa.competencia === 'NULL' || csvCausa.competencia.trim() === '') {
    return { valid: false, reason: 'Competencia faltante' };
  }
  
  // Tribunal es opcional pero recomendado
  if (requireTribunal) {
    if (!csvCausa.tribunal || csvCausa.tribunal === 'NULL' || csvCausa.tribunal.trim() === '') {
      return { valid: false, reason: 'Tribunal faltante' };
    }
  }
  
  return { valid: true };
}

// Filtrar CSV y generar archivos limpios
function filterValidCausas(requireTribunal = true) {
  console.log('🔍 Filtrando causas válidas...\n');
  
  const causas = readCausaCSV();
  console.log(`📊 Total causas en CSV: ${causas.length}\n`);
  
  const validas = [];
  const invalidas = [];
  
  causas.forEach((causa, index) => {
    const validation = isValidForScraping(causa, requireTribunal);
    
    if (validation.valid) {
      validas.push(causa);
    } else {
      invalidas.push({
        ...causa,
        motivo: validation.reason
      });
    }
    
    if ((index + 1) % 1000 === 0) {
      console.log(`   Procesadas ${index + 1}/${causas.length} causas...`);
    }
  });
  
  console.log(`\n✅ Causas válidas: ${validas.length} (${(validas.length/causas.length*100).toFixed(1)}%)`);
  console.log(`❌ Causas inválidas: ${invalidas.length} (${(invalidas.length/causas.length*100).toFixed(1)}%)\n`);
  
  // Generar CSV de causas válidas
  const csvPath = path.resolve(__dirname, '../causa.csv');
  const validCsvPath = path.resolve(__dirname, '../causa_validas.csv');
  const invalidCsvPath = path.resolve(__dirname, '../causa_invalidas.csv');
  
  // Escribir CSV válido
  const header = Object.keys(validas[0] || {}).filter(k => k !== 'motivo').join(',');
  const validLines = [header];
  
  validas.forEach(causa => {
    const line = [
      causa.causa_id || '',
      causa.agenda_id || '',
      causa.rit || '',
      causa.caratulado || '',
      causa.competencia || '',
      causa.tribunal || '',
      causa.cliente || '',
      causa.rut || '',
      causa.abogado_id || '',
      causa.cuenta_id || ''
    ].map(v => {
      // Escapar comillas y envolver en comillas si contiene comas
      const str = String(v).replace(/"/g, '""');
      return `"${str}"`;
    }).join(',');
    validLines.push(line);
  });
  
  fs.writeFileSync(validCsvPath, validLines.join('\n'), 'utf-8');
  console.log(`✅ CSV válido guardado: ${validCsvPath}`);
  
  // Escribir CSV de inválidas (para revisión)
  if (invalidas.length > 0) {
    const invalidHeader = Object.keys(invalidas[0]).join(',');
    const invalidLines = [invalidHeader];
    
    invalidas.forEach(causa => {
      const line = [
        causa.causa_id || '',
        causa.agenda_id || '',
        causa.rit || '',
        causa.caratulado || '',
        causa.competencia || '',
        causa.tribunal || '',
        causa.cliente || '',
        causa.rut || '',
        causa.abogado_id || '',
        causa.cuenta_id || '',
        causa.motivo || ''
      ].map(v => {
        const str = String(v).replace(/"/g, '""');
        return `"${str}"`;
      }).join(',');
      invalidLines.push(line);
    });
    
    fs.writeFileSync(invalidCsvPath, invalidLines.join('\n'), 'utf-8');
    console.log(`📋 CSV inválidas guardado: ${invalidCsvPath} (para revisión)\n`);
  }
  
  // Opción: Reemplazar el CSV original (BACKUP primero)
  const backupPath = path.resolve(__dirname, `../causa_backup_${Date.now()}.csv`);
  fs.copyFileSync(csvPath, backupPath);
  console.log(`💾 Backup del CSV original: ${backupPath}`);
  
  // Reemplazar CSV original con el filtrado
  fs.copyFileSync(validCsvPath, csvPath);
  console.log(`✅ CSV original reemplazado con causas válidas\n`);
  
  // Mostrar estadísticas de motivos de rechazo
  if (invalidas.length > 0) {
    console.log('📊 Motivos de rechazo:\n');
    const motivos = {};
    invalidas.forEach(c => {
      const motivo = c.motivo || 'Desconocido';
      motivos[motivo] = (motivos[motivo] || 0) + 1;
    });
    
    Object.entries(motivos)
      .sort((a, b) => b[1] - a[1])
      .forEach(([motivo, count]) => {
        console.log(`   ${motivo}: ${count} causas`);
      });
  }
  
  console.log(`\n✅ Proceso completado!`);
  console.log(`   ✅ Causas válidas: ${validas.length}`);
  console.log(`   ❌ Causas eliminadas: ${invalidas.length}`);
  console.log(`   💾 Backup guardado: ${backupPath}`);
  
  return {
    validas: validas.length,
    invalidas: invalidas.length,
    backupPath
  };
}

if (require.main === module) {
  const requireTribunal = process.argv[2] !== '--no-tribunal';
  
  if (requireTribunal) {
    console.log('🔍 Filtrando causas válidas (requiere tribunal)...\n');
  } else {
    console.log('🔍 Filtrando causas válidas (tribunal opcional)...\n');
  }
  
  filterValidCausas(requireTribunal);
}

module.exports = { filterValidCausas, isValidForScraping };

