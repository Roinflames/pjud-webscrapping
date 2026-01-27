/**
 * ⚠️ STANDARD COMPLIANCE: This file now delegates to processCausa engine.
 * See docs/scraping-standard.md for the single-engine rule.
 * 
 * This is a COMPATIBILITY SHIM that:
 * - Maintains the old processRit() function signature
 * - Internally calls processCausa (the engine)
 * - Maps old config format to ScrapingConfig
 */

const fs = require('fs');
const path = require('path');

const { processCausa } = require('./process-causas');
const { saveErrorEvidence } = require('./utils');

/**
 * Procesa un RIT individual completo
 * 
 * ⚠️ COMPATIBILITY SHIM: This function maintains the old signature but delegates to processCausa.
 * 
 * @param {Object} page - Playwright Page
 * @param {Object} context - Playwright Context
 * @param {Object} ritConfig - Configuración del RIT (formato antiguo)
 * @param {string} outputDir - Directorio de salida
 * @param {string} logDir - Directorio de logs
 * @returns {boolean} true si fue exitoso, false si hubo error
 */
async function processRit(page, context, ritConfig, outputDir, logDir) {
  try {
    console.log(`   📋 RIT: ${ritConfig.rit}`);
    console.warn('   ⚠️  DEPRECATION: processRit() is a compatibility shim. Consider using processCausa() directly.');
    
    // Convertir ritConfig al formato ScrapingConfig que espera processCausa
    const ritParts = ritConfig.rit ? ritConfig.rit.split('-') : [];
    const scrapingConfig = {
      rit: ritConfig.rit,
      competencia: ritConfig.competencia || '3',
      corte: ritConfig.corte || '90',
      tribunal: ritConfig.tribunal || ritConfig.juzgado || null,
      tipoCausa: ritConfig.tipoCausa || (ritParts[0] || 'C'),
      rol: ritConfig.rol || (ritParts[1] || null),
      año: ritConfig.año || (ritParts[2] || null),
      caratulado: ritConfig.caratulado || null,
      cliente: ritConfig.cliente || null,
      rut: ritConfig.rut || null,
      abogado_id: ritConfig.abogado_id || null,
      cuenta_id: ritConfig.cuenta_id || null,
      causa_id: ritConfig.causa_id || null,
      agenda_id: ritConfig.agenda_id || null
    };

    // ✅ DELEGATE TO ENGINE: Use processCausa for all scraping
    const resultado = await processCausa(page, context, scrapingConfig, outputDir);
    
    if (resultado.success) {
      console.log(`   ✅ RIT procesado exitosamente`);
      return true;
    } else {
      console.error(`   ❌ Error: ${resultado.error}`);
      return false;
    }
  } catch (error) {
    console.error(`   ❌ Error procesando RIT ${ritConfig.rit}:`, error.message);
    
    // Guardar evidencia
    const screenshotPath = path.join(logDir, `error_${ritConfig.rit.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`);
    const htmlPath = path.join(logDir, `error_${ritConfig.rit.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.html`);
    await saveErrorEvidence(page, screenshotPath, htmlPath);
    
    return false;
  }
}

module.exports = { processRit };
