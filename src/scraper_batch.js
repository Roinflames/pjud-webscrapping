require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { startBrowser } = require('./browser');
const { loadConfig } = require('./config');
const { downloadEbook } = require('./ebook');
const { fillForm, openDetalle } = require('./form');
const { closeModalIfExists, goToConsultaCausas } = require('./navigation');
const { extractTable } = require('./table');
const { saveErrorEvidence } = require('./utils');

/**
 * Obtiene el último RIT procesado revisando los archivos de output
 */
function getLastProcessedRIT(outputDir) {
  if (!fs.existsSync(outputDir)) {
    return null;
  }

  const files = fs.readdirSync(outputDir);
  const resultFiles = files
    .filter(file => file.startsWith('resultado_') && file.endsWith('.json'))
    .map(file => {
      // resultado_C_6028_2020.json -> C-6028-2020
      const ritMatch = file.match(/resultado_(.+)\.json/);
      if (ritMatch) {
        const rit = ritMatch[1].replace(/_/g, '-');
        const filePath = path.join(outputDir, file);
        const stats = fs.statSync(filePath);
        return {
          rit,
          mtime: stats.mtime
        };
      }
      return null;
    })
    .filter(item => item !== null)
    .sort((a, b) => b.mtime - a.mtime); // Ordenar por fecha de modificación descendente

  return resultFiles.length > 0 ? resultFiles[0].rit : null;
}

/**
 * Lee el archivo CSV y parsea las causas
 */
function readCausesCSV(csvPath) {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

  const causes = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;

    const cause = {};
    headers.forEach((header, index) => {
      cause[header] = values[index] ? values[index].replace(/"/g, '').trim() : '';
    });

    // Validar que tenga RIT válido
    if (cause.rit) {
      // Limpiar RIT: eliminar puntos y espacios, normalizar guiones
      let rit = cause.rit.replace(/\./g, '').trim().toUpperCase();
      
      // Normalizar formato RIT: C-XXXX-YYYY
      const ritParts = rit.split('-');
      if (ritParts.length === 3) {
        // Validar formato correcto
        const tipo = ritParts[0];
        const rol = ritParts[1];
        const year = ritParts[2];
        
        if (tipo.match(/^[CLR]$/) && rol && year && year.length === 4) {
          cause.rit = `${tipo}-${rol}-${year}`;
          causes.push(cause);
        } else {
          console.warn(`⚠️  RIT con formato inválido ignorado: ${cause.rit}`);
        }
      } else if (ritParts.length === 2 && ritParts[0].match(/^[CLR]$/)) {
        // Formato C-XXXXYYYY -> C-XXXX-YYYY
        const numPart = ritParts[1];
        if (numPart.length >= 8) {
          const year = numPart.slice(-4);
          const rol = numPart.slice(0, -4);
          if (/^\d+$/.test(year) && /^\d+$/.test(rol)) {
            cause.rit = `${ritParts[0]}-${rol}-${year}`;
            causes.push(cause);
          }
        }
      } else {
        console.warn(`⚠️  RIT con formato desconocido ignorado: ${cause.rit}`);
      }
    }
  }

  return causes;
}

/**
 * Parsea una línea CSV manejando comillas correctamente
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Manejar comillas dobles escapadas
      if (i + 1 < line.length && line[i + 1] === '"' && inQuotes) {
        current += '"';
        i++; // Saltar la siguiente comilla
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  
  return values;
}

/**
 * Actualiza el archivo de configuración con los datos de una causa
 */
function updateConfig(cause, configPath, defaultCorte = '90') {
  // Extraer tipo de causa del RIT (C, L, R, etc.)
  const tipoCausa = cause.rit ? cause.rit.split('-')[0] : 'C';
  
  const config = {
    rit: cause.rit,
    competencia: cause.competencia || '1',
    corte: defaultCorte, // Valor por defecto, puede necesitar ajuste
    tribunal: cause.tribunal || '',
    tipoCausa: tipoCausa,
    cliente: cause.cliente || '',
    rut: cause.rut || '',
    caratulado: cause.caratulado || '',
    abogado: cause.abogado_id || '',
    juzgado: cause.juzgado || '',
    folio: cause.folio || ''
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  return config;
}

/**
 * Guarda el progreso del procesamiento
 */
function saveProgress(lastRIT, progressPath) {
  const progress = {
    lastRIT,
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2), 'utf-8');
}

/**
 * Carga el progreso guardado
 */
function loadProgress(progressPath) {
  if (fs.existsSync(progressPath)) {
    try {
      return JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
    } catch (err) {
      return null;
    }
  }
  return null;
}

/**
 * Procesa un RIT individual
 */
async function processRIT(cause, configPath, outputDir) {
  const logDir = path.resolve(__dirname, 'logs');
  const screenshotPath = path.join(logDir, `pjud_error_${Date.now()}.png`);
  const htmlPath = path.join(logDir, `pjud_error_${Date.now()}.html`);

  // Actualizar configuración con los datos de la causa
  const CONFIG = updateConfig(cause, configPath);

  console.log(`\n🔍 Procesando RIT: ${CONFIG.rit}`);
  console.log(`   Competencia: ${CONFIG.competencia}, Tribunal: ${CONFIG.tribunal}, Tipo: ${CONFIG.tipoCausa}`);

  const { browser, context, page } = await startBrowser(process.env.OJV_URL);

  try {
    console.log('🌐 Página cargada:', page.url());

    await closeModalIfExists(page);
    await goToConsultaCausas(page);
    await fillForm(page, CONFIG);
    await openDetalle(page);

    const rows = await extractTable(page);
    console.log(`✅ Extraídas ${rows.length} filas`);

    // Exportar resultados
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const { exportToJSON, exportToCSV } = require('./exporter');
    exportToJSON(rows, outputDir, CONFIG.rit);
    exportToCSV(rows, outputDir, CONFIG.rit);

    // Descargar PDFs de la tabla
    const { downloadPDFsFromTable } = require('./pdfDownloader');
    const pdfMapping = await downloadPDFsFromTable(
      page,
      context,
      outputDir,
      CONFIG.rit,
      rows
    );

    // Descargar eBook (opcional, comentado por defecto)
    // await downloadEbook(page, context, CONFIG, path.resolve(__dirname, 'assets/ebook'));

    console.log(`✅ RIT ${CONFIG.rit} procesado exitosamente\n`);
    return { success: true, rit: CONFIG.rit };

  } catch (err) {
    console.error(`❌ Error procesando RIT ${CONFIG.rit}:`, err.message);
    await saveErrorEvidence(page, screenshotPath, htmlPath);
    return { success: false, rit: CONFIG.rit, error: err.message };
  } finally {
    await browser.close();
  }
}

/**
 * Función principal
 */
(async () => {
  const logDir = path.resolve(__dirname, 'logs');
  const outputDir = path.resolve(__dirname, 'outputs');
  const configPath = path.resolve(__dirname, 'config/pjud_config.json');
  const csvPath = path.resolve(__dirname, '../causa.csv');
  const progressPath = path.resolve(__dirname, 'progress.json');

  // Crear directorios necesarios
  [logDir, outputDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  // Verificar que exista el CSV
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ No se encontró el archivo CSV: ${csvPath}`);
    process.exit(1);
  }

  // Leer causas del CSV
  console.log('📖 Leyendo causas del CSV...');
  const causes = readCausesCSV(csvPath);
  console.log(`✅ Se encontraron ${causes.length} causas en el CSV\n`);

  // Determinar desde dónde continuar
  let startIndex = 0;
  let lastRIT = null;

  // Intentar cargar progreso guardado
  const savedProgress = loadProgress(progressPath);
  if (savedProgress && savedProgress.lastRIT) {
    lastRIT = savedProgress.lastRIT;
    console.log(`📋 Progreso guardado encontrado. Último RIT: ${lastRIT}`);
  } else {
    // Buscar último RIT procesado en los outputs
    lastRIT = getLastProcessedRIT(outputDir);
    if (lastRIT) {
      console.log(`📋 Último RIT procesado encontrado en outputs: ${lastRIT}`);
    } else {
      console.log('📋 No se encontró ningún RIT procesado anteriormente. Iniciando desde el principio.');
    }
  }

  // Encontrar el índice de inicio
  if (lastRIT) {
    startIndex = causes.findIndex(c => c.rit === lastRIT);
    if (startIndex !== -1) {
      startIndex += 1; // Continuar desde el siguiente
      console.log(`▶️  Continuando desde el índice ${startIndex} (después de ${lastRIT})\n`);
    } else {
      console.log(`⚠️  El RIT ${lastRIT} no se encontró en el CSV. Iniciando desde el principio.\n`);
      startIndex = 0;
    }
  }

  // Procesar causas restantes
  const remainingCauses = causes.slice(startIndex);
  console.log(`🚀 Iniciando procesamiento de ${remainingCauses.length} causas restantes...\n`);

  let processed = 0;
  let successful = 0;
  let failed = 0;
  const failedRITs = [];

  for (let i = 0; i < remainingCauses.length; i++) {
    const cause = remainingCauses[i];
    
    console.log(`[${i + 1}/${remainingCauses.length}] Procesando causa...`);
    
    const result = await processRIT(cause, configPath, outputDir);
    processed++;

    if (result.success) {
      successful++;
      // Guardar progreso después de cada procesamiento exitoso
      saveProgress(result.rit, progressPath);
    } else {
      failed++;
      failedRITs.push(result.rit);
      // También guardar progreso para continuar desde el siguiente
      if (i + 1 < remainingCauses.length) {
        saveProgress(cause.rit, progressPath);
      }
    }

    // Esperar un poco entre procesamientos para no sobrecargar el servidor
    if (i < remainingCauses.length - 1) {
      console.log('⏳ Esperando 2 segundos antes del siguiente procesamiento...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DEL PROCESAMIENTO');
  console.log('='.repeat(60));
  console.log(`Total procesado: ${processed}`);
  console.log(`✅ Exitosos: ${successful}`);
  console.log(`❌ Fallidos: ${failed}`);
  
  if (failedRITs.length > 0) {
    console.log(`\n⚠️  RITs que fallaron:`);
    failedRITs.forEach(rit => console.log(`   - ${rit}`));
  }

  console.log('\n🧭 Proceso completado.');
  
  // Eliminar archivo de progreso si se completó todo
  if (startIndex + processed >= causes.length && failed === 0) {
    if (fs.existsSync(progressPath)) {
      fs.unlinkSync(progressPath);
      console.log('✅ Archivo de progreso eliminado (procesamiento completado)');
    }
  }
})();

