/**
 * Sistema de checkpoints para guardar y reanudar el progreso del scraping
 */

const fs = require('fs');
const path = require('path');

const CHECKPOINT_DIR = path.resolve(__dirname, '../logs/checkpoints');
const CHECKPOINT_FILE = path.join(CHECKPOINT_DIR, 'last_checkpoint.json');

/**
 * Inicializa el directorio de checkpoints
 */
function initCheckpointDir() {
  if (!fs.existsSync(CHECKPOINT_DIR)) {
    fs.mkdirSync(CHECKPOINT_DIR, { recursive: true });
  }
}

/**
 * Guarda un checkpoint con el progreso actual
 * IMPORTANTE: Solo guarda causas exitosas, las fallidas se reintentarán
 */
function saveCheckpoint(data) {
  initCheckpointDir();
  
  // Filtrar solo resultados exitosos para el checkpoint
  const resultadosExitosos = (data.resultados || []).filter(r => r.success === true);
  
  // Filtrar causas exitosas basándose en los resultados exitosos
  const causasExitosas = [];
  const resultados = data.resultados || [];
  const processedCausas = data.processedCausas || [];
  
  resultados.forEach((resultado, idx) => {
    if (resultado.success === true && processedCausas[idx]) {
      causasExitosas.push(processedCausas[idx]);
    }
  });
  
  // Calcular el índice del último procesado exitosamente
  // Si hay resultados exitosos, encontrar el índice del último exitoso
  let lastSuccessfulIndex = -1;
  if (resultados.length > 0) {
    // Buscar el último índice con resultado exitoso
    for (let i = resultados.length - 1; i >= 0; i--) {
      if (resultados[i].success === true) {
        // Calcular el índice global basado en startIndex + i
        // Necesitamos el índice original, no el relativo
        lastSuccessfulIndex = data.lastProcessedIndex - (resultados.length - 1 - i);
        break;
      }
    }
  }
  
  // Si no hay exitosos, mantener el índice anterior o empezar desde -1
  if (lastSuccessfulIndex === -1 && resultadosExitosos.length === 0) {
    lastSuccessfulIndex = data.lastProcessedIndex - resultados.length;
  }
  
  const checkpoint = {
    timestamp: new Date().toISOString(),
    lastProcessedIndex: lastSuccessfulIndex,
    totalCausas: data.totalCausas,
    processedCausas: causasExitosas, // Solo causas exitosas
    resultados: resultadosExitosos, // Solo resultados exitosos
    causasAProcesar: data.causasAProcesar || [],
    startTime: data.startTime,
    stats: {
      exitosas: resultadosExitosos.length,
      fallidas: (data.resultados || []).filter(r => !r.success).length,
      total: resultadosExitosos.length,
      reintentar: (data.resultados || []).filter(r => !r.success).length // Causas que se reintentarán
    }
  };
  
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
  console.log(`💾 Checkpoint guardado: ${resultadosExitosos.length} exitosas, ${checkpoint.stats.reintentar} se reintentarán`);
}

/**
 * Carga el último checkpoint si existe
 */
function loadCheckpoint() {
  if (!fs.existsSync(CHECKPOINT_FILE)) {
    return null;
  }
  
  try {
    const checkpointData = fs.readFileSync(CHECKPOINT_FILE, 'utf8');
    const checkpoint = JSON.parse(checkpointData);
    
    console.log(`\n📂 Checkpoint encontrado:`);
    console.log(`   Fecha: ${checkpoint.timestamp}`);
    console.log(`   Progreso: ${checkpoint.lastProcessedIndex + 1}/${checkpoint.totalCausas} causas procesadas`);
    console.log(`   ✅ Exitosas guardadas: ${checkpoint.stats.exitosas}`);
    if (checkpoint.stats.reintentar) {
      console.log(`   🔄 Se reintentarán: ${checkpoint.stats.reintentar} causas que fallaron`);
    }
    
    return checkpoint;
  } catch (error) {
    console.warn('⚠️ Error al cargar checkpoint:', error.message);
    return null;
  }
}

/**
 * Elimina el checkpoint (cuando se completa todo)
 */
function clearCheckpoint() {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    fs.unlinkSync(CHECKPOINT_FILE);
    console.log('🗑️  Checkpoint eliminado (proceso completado)');
  }
}

/**
 * Obtiene las causas ya procesadas desde el checkpoint
 */
function getProcessedCausaIds(checkpoint) {
  if (!checkpoint || !checkpoint.processedCausas) {
    return new Set();
  }
  
  return new Set(checkpoint.processedCausas.map(c => c.causa_id || c.rit));
}

/**
 * Verifica si una causa ya fue procesada
 */
function isCausaProcessed(checkpoint, causaId, rit) {
  if (!checkpoint) return false;
  
  const processedIds = getProcessedCausaIds(checkpoint);
  return processedIds.has(causaId) || processedIds.has(rit);
}

/**
 * Guarda un backup del checkpoint con timestamp
 */
function backupCheckpoint() {
  if (!fs.existsSync(CHECKPOINT_FILE)) {
    return;
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(CHECKPOINT_DIR, `checkpoint_backup_${timestamp}.json`);
  
  try {
    fs.copyFileSync(CHECKPOINT_FILE, backupFile);
    console.log(`📦 Backup del checkpoint guardado: ${backupFile}`);
  } catch (error) {
    console.warn('⚠️ Error al crear backup del checkpoint:', error.message);
  }
}

module.exports = {
  saveCheckpoint,
  loadCheckpoint,
  clearCheckpoint,
  getProcessedCausaIds,
  isCausaProcessed,
  backupCheckpoint,
  CHECKPOINT_FILE
};

