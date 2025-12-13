// Script para validar si el CSV tiene todos los datos necesarios para scraping
const { readCausaCSV, mapCsvToDB } = require('./read-csv');

// Campos requeridos para scraping (según fillForm)
const REQUIRED_FIELDS = {
  rit: true,           // Crítico - se divide en rol y año
  competencia: true,   // Crítico - se usa en formulario
  tribunal: false,     // Importante pero puede tener default
  corte: false,        // No está en CSV, siempre usa default "90"
  tipoCausa: false,    // Se extrae del RIT
  caratulado: false    // No se usa en formulario, solo informativo
};

function extractTipoCausa(rit) {
  if (!rit || rit === 'NULL') return null;
  const match = rit.match(/^([A-Za-z0-9]+)-/);
  return match ? match[1] : null;
}

function extractRolAnio(rit) {
  if (!rit || rit === 'NULL') return { rol: null, año: null };
  const parts = rit.split('-');
  if (parts.length >= 3) {
    return { rol: parts[1], año: parts[2] };
  }
  return { rol: null, año: null };
}

function validateCausaForScraping(csvCausa) {
  const issues = [];
  const warnings = [];
  
  // Validar RIT (crítico)
  if (!csvCausa.rit || csvCausa.rit === 'NULL' || csvCausa.rit.trim() === '') {
    issues.push('RIT faltante o vacío');
  } else {
    const { rol, año } = extractRolAnio(csvCausa.rit);
    if (!rol || !año) {
      issues.push(`RIT con formato inválido: "${csvCausa.rit}" (no se puede extraer rol/año)`);
    }
    
    // Validar tipoCausa
    const tipoCausa = extractTipoCausa(csvCausa.rit);
    if (!tipoCausa) {
      warnings.push(`No se puede extraer tipoCausa del RIT: "${csvCausa.rit}"`);
    }
  }
  
  // Validar competencia (crítico)
  if (!csvCausa.competencia || csvCausa.competencia === 'NULL' || csvCausa.competencia.trim() === '') {
    issues.push('Competencia faltante');
  }
  
  // Validar tribunal (importante pero no crítico)
  if (!csvCausa.tribunal || csvCausa.tribunal === 'NULL' || csvCausa.tribunal.trim() === '') {
    warnings.push('Tribunal faltante (se puede usar default o saltar)');
  }
  
  // Validar caratulado (informativo)
  if (!csvCausa.caratulado || csvCausa.caratulado === 'NULL' || csvCausa.caratulado.trim() === '') {
    warnings.push('Caratulado faltante (solo informativo, no afecta scraping)');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    warnings,
    canScrape: issues.length === 0
  };
}

function analyzeCSVForScraping() {
  console.log('🔍 Analizando CSV para scraping...\n');
  
  const causas = readCausaCSV();
  console.log(`📊 Total causas: ${causas.length}\n`);
  
  const stats = {
    total: causas.length,
    valid: 0,
    invalid: 0,
    withWarnings: 0,
    missingRit: 0,
    missingCompetencia: 0,
    missingTribunal: 0,
    invalidRitFormat: 0,
    missingTipoCausa: 0
  };
  
  const invalidCausas = [];
  const warningCausas = [];
  
  causas.forEach((causa, index) => {
    const validation = validateCausaForScraping(causa);
    
    if (validation.valid) {
      stats.valid++;
      if (validation.warnings.length > 0) {
        stats.withWarnings++;
        warningCausas.push({ causa_id: causa.causa_id, rit: causa.rit, warnings: validation.warnings });
      }
    } else {
      stats.invalid++;
      invalidCausas.push({ causa_id: causa.causa_id, rit: causa.rit, issues: validation.issues });
    }
    
    // Contar problemas específicos
    if (!causa.rit || causa.rit === 'NULL') stats.missingRit++;
    if (!causa.competencia || causa.competencia === 'NULL') stats.missingCompetencia++;
    if (!causa.tribunal || causa.tribunal === 'NULL') stats.missingTribunal++;
    
    const { rol, año } = extractRolAnio(causa.rit);
    if (causa.rit && causa.rit !== 'NULL' && (!rol || !año)) {
      stats.invalidRitFormat++;
    }
    
    const tipoCausa = extractTipoCausa(causa.rit);
    if (causa.rit && causa.rit !== 'NULL' && !tipoCausa) {
      stats.missingTipoCausa++;
    }
  });
  
  // Mostrar estadísticas
  console.log('📈 Estadísticas de Validación:\n');
  console.log(`   ✅ Válidas para scraping: ${stats.valid} (${(stats.valid/stats.total*100).toFixed(1)}%)`);
  console.log(`   ❌ Inválidas: ${stats.invalid} (${(stats.invalid/stats.total*100).toFixed(1)}%)`);
  console.log(`   ⚠️  Con advertencias: ${stats.withWarnings} (${(stats.withWarnings/stats.total*100).toFixed(1)}%)`);
  
  console.log('\n📋 Problemas Encontrados:\n');
  console.log(`   RIT faltante: ${stats.missingRit}`);
  console.log(`   Competencia faltante: ${stats.missingCompetencia}`);
  console.log(`   Tribunal faltante: ${stats.missingTribunal}`);
  console.log(`   RIT con formato inválido: ${stats.invalidRitFormat}`);
  console.log(`   No se puede extraer tipoCausa: ${stats.missingTipoCausa}`);
  
  // Mostrar ejemplos de problemas
  if (invalidCausas.length > 0) {
    console.log('\n❌ Ejemplos de causas inválidas:');
    invalidCausas.slice(0, 5).forEach(c => {
      console.log(`   Causa ID ${c.causa_id}, RIT: ${c.rit || 'NULL'}`);
      console.log(`      Problemas: ${c.issues.join(', ')}`);
    });
  }
  
  if (warningCausas.length > 0) {
    console.log('\n⚠️  Ejemplos de causas con advertencias:');
    warningCausas.slice(0, 5).forEach(c => {
      console.log(`   Causa ID ${c.causa_id}, RIT: ${c.rit || 'NULL'}`);
      console.log(`      Advertencias: ${c.warnings.join(', ')}`);
    });
  }
  
  // Resumen final
  console.log('\n📊 Resumen:\n');
  const canScrape = stats.valid;
  const cannotScrape = stats.invalid;
  const scrapeWithWarnings = stats.withWarnings;
  
  console.log(`   ✅ Listas para scraping: ${canScrape} (${(canScrape/stats.total*100).toFixed(1)}%)`);
  console.log(`   ⚠️  Scraping con advertencias: ${scrapeWithWarnings} (${(scrapeWithWarnings/stats.total*100).toFixed(1)}%)`);
  console.log(`   ❌ No se pueden scrapear: ${cannotScrape} (${(cannotScrape/stats.total*100).toFixed(1)}%)`);
  
  // Campos faltantes en CSV
  console.log('\n📝 Campos Faltantes en CSV (pero manejables):\n');
  console.log('   ❌ corte - No está en CSV');
  console.log('      → Solución: Usar default "90" (ya implementado)');
  console.log('   ❌ tipoCausa - No está en CSV');
  console.log('      → Solución: Extraer del RIT (ya implementado)');
  console.log('   ⚠️  tribunal - Puede ser NULL');
  console.log('      → Solución: Filtrar causas sin tribunal o usar default');
  
  // Recomendaciones
  console.log('\n💡 Recomendaciones:\n');
  if (stats.valid === stats.total) {
    console.log('   ✅ ¡Excelente! Todas las causas son válidas para scraping.');
  } else if (stats.valid >= stats.total * 0.8) {
    console.log('   ✅ La mayoría de causas son válidas. Puedes proceder con scraping.');
    console.log(`   ⚠️  Considera filtrar las ${stats.invalid} causas inválidas.`);
  } else {
    console.log('   ⚠️  Muchas causas tienen problemas. Revisa los datos antes de scrapear.');
  }
  
  if (stats.missingTribunal > 0) {
    console.log(`\n   ⚠️  ${stats.missingTribunal} causas no tienen tribunal.`);
    console.log('      Opciones:');
    console.log('      1. Filtrar causas sin tribunal');
    console.log('      2. Intentar scraping sin tribunal (puede fallar)');
    console.log('      3. Buscar tribunal en BD por agenda_id');
  }
  
  return {
    stats,
    valid: stats.valid,
    invalid: stats.invalid,
    canScrape: stats.valid
  };
}

if (require.main === module) {
  analyzeCSVForScraping();
}

module.exports = { validateCausaForScraping, analyzeCSVForScraping };

