/**
 * Sistema de Cola para Scraping Masivo
 * Gestiona ejecución ordenada, pausas, reintentos y límites
 */

const fs = require('fs');
const path = require('path');
const { obtenerCausasValidas, prepararConfigScraping } = require('./causa-manager');
const { executeScraping } = require('../api/scraper-service');
const { saveResult } = require('../api/storage');

const COLA_FILE = path.resolve(__dirname, '../../src/outputs/cola_scraping.json');
const PROGRESS_FILE = path.resolve(__dirname, '../../src/outputs/scraping_progress.json');
const DAILY_COUNT_FILE = path.resolve(__dirname, '../../src/outputs/daily_scraping_count.json');

// Configuración por defecto
const DEFAULT_CONFIG = {
  limiteDiario: 150,
  pausaEntreCausas: 3000, // 3 segundos
  maxReintentos: 3,
  pausaEntreReintentos: 5000, // 5 segundos
  tiempoMaximoPorCausa: 300000 // 5 minutos
};

/**
 * Cargar configuración de cola
 */
function cargarConfigCola() {
  const configFile = path.resolve(__dirname, '../../src/outputs/cola_config.json');
  if (fs.existsSync(configFile)) {
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(configFile, 'utf-8')) };
    } catch (error) {
      console.warn('⚠️ Error cargando config de cola, usando defaults');
    }
  }
  return DEFAULT_CONFIG;
}

/**
 * Inicializar cola desde causas
 */
function inicializarCola(causas = null, filtros = {}) {
  if (!causas) {
    causas = obtenerCausasValidas();
  }

  // Aplicar filtros
  let causasFiltradas = causas;
  
  if (filtros.competencia) {
    causasFiltradas = causasFiltradas.filter(c => c.competencia === filtros.competencia);
  }
  
  if (filtros.tribunal) {
    causasFiltradas = causasFiltradas.filter(c => c.tribunal === filtros.tribunal);
  }

  if (filtros.tipoCausa) {
    causasFiltradas = causasFiltradas.filter(c => c.tipoCausa === filtros.tipoCausa);
  }

  if (filtros.limite) {
    causasFiltradas = causasFiltradas.slice(0, filtros.limite);
  }

  const cola = {
    pendientes: causasFiltradas.map(c => ({
      causa: c,
      config: prepararConfigScraping(c),
      estado: 'pendiente',
      reintentos: 0,
      fecha_agregada: new Date().toISOString()
    })),
    procesando: [],
    completadas: [],
    fallidas: [],
    fecha_inicio: new Date().toISOString(),
    fecha_ultima_actualizacion: new Date().toISOString()
  };

  guardarCola(cola);
  return cola;
}

/**
 * Guardar estado de cola
 */
function guardarCola(cola) {
  cola.fecha_ultima_actualizacion = new Date().toISOString();
  fs.writeFileSync(COLA_FILE, JSON.stringify(cola, null, 2));
}

/**
 * Cargar estado de cola
 */
function cargarCola() {
  if (fs.existsSync(COLA_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(COLA_FILE, 'utf-8'));
    } catch (error) {
      console.warn('⚠️ Error cargando cola, inicializando nueva');
    }
  }
  return null;
}

/**
 * Actualizar contador diario
 */
function actualizarContadorDiario() {
  const hoy = new Date().toISOString().split('T')[0];
  let contadores = {};

  if (fs.existsSync(DAILY_COUNT_FILE)) {
    try {
      contadores = JSON.parse(fs.readFileSync(DAILY_COUNT_FILE, 'utf-8'));
    } catch (error) {
      contadores = {};
    }
  }

  if (!contadores[hoy]) {
    contadores[hoy] = 0;
  }

  contadores[hoy]++;
  fs.writeFileSync(DAILY_COUNT_FILE, JSON.stringify(contadores, null, 2));

  return contadores[hoy];
}

/**
 * Verificar límite diario
 */
function verificarLimiteDiario(config = null) {
  if (!config) {
    config = cargarConfigCola();
  }

  const hoy = new Date().toISOString().split('T')[0];
  let contadores = {};

  if (fs.existsSync(DAILY_COUNT_FILE)) {
    try {
      contadores = JSON.parse(fs.readFileSync(DAILY_COUNT_FILE, 'utf-8'));
    } catch (error) {
      return { permitido: true, actual: 0, limite: config.limiteDiario };
    }
  }

  const actual = contadores[hoy] || 0;
  const permitido = actual < config.limiteDiario;

  return {
    permitido,
    actual,
    limite: config.limiteDiario,
    restante: Math.max(0, config.limiteDiario - actual)
  };
}

/**
 * Guardar progreso individual
 */
function guardarProgreso(rit, estado, resultado = null, error = null) {
  let progreso = {};

  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      progreso = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    } catch (error) {
      progreso = {};
    }
  }

  progreso[rit] = {
    estado,
    fecha: new Date().toISOString(),
    resultado: resultado ? { 
      movimientos: resultado.movimientos?.length || 0,
      pdfs: resultado.pdfs?.length || 0 
    } : null,
    error: error ? error.message : null
  };

  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progreso, null, 2));
}

/**
 * Procesar siguiente item de la cola
 */
async function procesarSiguiente(configCola = null) {
  if (!configCola) {
    configCola = cargarConfigCola();
  }

  let cola = cargarCola();
  if (!cola || cola.pendientes.length === 0) {
    return { terminado: true, mensaje: 'No hay más items en la cola' };
  }

  // Verificar límite diario
  const limite = verificarLimiteDiario(configCola);
  if (!limite.permitido) {
    return { 
      terminado: false, 
      pausado: true, 
      mensaje: `Límite diario alcanzado: ${limite.actual}/${limite.limite}` 
    };
  }

  // Tomar siguiente item
  const item = cola.pendientes.shift();
  item.estado = 'procesando';
  item.fecha_inicio = new Date().toISOString();
  cola.procesando.push(item);
  guardarCola(cola);

  try {
    console.log(`🔄 Procesando: ${item.config.rit}`);

    // Ejecutar scraping con timeout
    const scrapingPromise = executeScraping(item.config);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout excedido')), configCola.tiempoMaximoPorCausa)
    );

    const resultado = await Promise.race([scrapingPromise, timeoutPromise]);

    // Guardar resultado
    if (resultado && resultado.movimientos) {
      saveResult(item.config.rit, resultado);
      guardarProgreso(item.config.rit, 'completado', resultado);
    }

    // Mover a completadas
    item.estado = 'completada';
    item.fecha_fin = new Date().toISOString();
    item.resultado = { movimientos: resultado.movimientos?.length || 0 };
    
    cola.procesando = cola.procesando.filter(i => i.config.rit !== item.config.rit);
    cola.completadas.push(item);
    guardarCola(cola);

    // Actualizar contador diario
    actualizarContadorDiario();

    // Pausa entre causas
    await new Promise(resolve => setTimeout(resolve, configCola.pausaEntreCausas));

    return {
      terminado: false,
      item: item.config.rit,
      estado: 'completado',
      resultado: resultado
    };

  } catch (error) {
    console.error(`❌ Error procesando ${item.config.rit}:`, error.message);

    item.reintentos++;
    item.ultimo_error = error.message;

    if (item.reintentos < configCola.maxReintentos) {
      // Reintentar
      item.estado = 'pendiente';
      item.fecha_inicio = null;
      cola.procesando = cola.procesando.filter(i => i.config.rit !== item.config.rit);
      cola.pendientes.unshift(item); // Volver al inicio
      guardarCola(cola);

      await new Promise(resolve => setTimeout(resolve, configCola.pausaEntreReintentos));

      return {
        terminado: false,
        item: item.config.rit,
        estado: 'reintentando',
        reintento: item.reintentos
      };
    } else {
      // Máximo de reintentos alcanzado
      item.estado = 'fallida';
      item.fecha_fin = new Date().toISOString();
      
      cola.procesando = cola.procesando.filter(i => i.config.rit !== item.config.rit);
      cola.fallidas.push(item);
      guardarCola(cola);

      guardarProgreso(item.config.rit, 'fallida', null, error);

      return {
        terminado: false,
        item: item.config.rit,
        estado: 'fallida',
        error: error.message
      };
    }
  }
}

/**
 * Obtener estadísticas de la cola
 */
function obtenerEstadisticasCola() {
  const cola = cargarCola();
  if (!cola) {
    return null;
  }

  const limite = verificarLimiteDiario();

  return {
    total: cola.pendientes.length + cola.procesando.length + cola.completadas.length + cola.fallidas.length,
    pendientes: cola.pendientes.length,
    procesando: cola.procesando.length,
    completadas: cola.completadas.length,
    fallidas: cola.fallidas.length,
    fecha_inicio: cola.fecha_inicio,
    fecha_ultima_actualizacion: cola.fecha_ultima_actualizacion,
    limite_diario: limite
  };
}

module.exports = {
  inicializarCola,
  cargarCola,
  guardarCola,
  procesarSiguiente,
  obtenerEstadisticasCola,
  verificarLimiteDiario,
  cargarConfigCola
};
