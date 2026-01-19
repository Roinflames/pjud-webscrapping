/**
 * Gestor de Causas - Maneja lectura, validación y normalización de causas
 * Soporta CSV y preparación para BD
 */

const fs = require('fs');
const path = require('path');
const { readCausaCSV, mapCsvToDB } = require('../read-csv');

const CAUSAS_CACHE_FILE = path.resolve(__dirname, '../../src/outputs/causas_cache.json');

/**
 * Normaliza y valida una causa para scraping
 */
function normalizarCausa(causa) {
  // Extraer tipoCausa del RIT si no existe
  if (causa.rit && !causa.tipoCausa) {
    const partesRit = causa.rit.split('-');
    if (partesRit.length >= 3) {
      causa.tipoCausa = partesRit[0]; // "C" de "C-13786-2018"
    } else if (partesRit.length === 2) {
      // Formato "16707-2019" sin letra
      causa.tipoCausa = 'C'; // Default para civil
    }
  }

  // Validar campos requeridos
  const validacion = {
    valida: true,
    errores: []
  };

  if (!causa.rit || causa.rit.trim() === '') {
    validacion.valida = false;
    validacion.errores.push('RIT faltante');
  }

  if (!causa.competencia || causa.competencia.trim() === '') {
    validacion.valida = false;
    validacion.errores.push('Competencia faltante');
  }

  if (!causa.tribunal || causa.tribunal.trim() === '') {
    validacion.valida = false;
    validacion.errores.push('Tribunal faltante');
  }

  if (!causa.tipoCausa) {
    causa.tipoCausa = 'C'; // Default
  }

  // Corte por defecto (se puede mejorar con mapeo)
  if (!causa.corte) {
    causa.corte = '90'; // Default para Santiago
  }

  return {
    causa: causa,
    validacion: validacion
  };
}

/**
 * Carga todas las causas desde CSV
 */
function cargarCausasDesdeCSV(csvPath = null) {
  try {
    if (!csvPath) {
      csvPath = path.resolve(__dirname, '../../causa.csv');
    }

    if (!fs.existsSync(csvPath)) {
      throw new Error(`Archivo CSV no encontrado: ${csvPath}`);
    }

    const causasRaw = readCausaCSV();
    const causas = [];

    for (const causaRaw of causasRaw) {
      const causaMapeada = mapCsvToDB(causaRaw);
      const { causa, validacion } = normalizarCausa(causaMapeada);

      causas.push({
        ...causa,
        validacion: validacion,
        fuente: 'csv',
        fecha_carga: new Date().toISOString()
      });
    }

    // Guardar en cache
    fs.writeFileSync(CAUSAS_CACHE_FILE, JSON.stringify(causas, null, 2));

    return causas;
  } catch (error) {
    console.error('Error cargando causas desde CSV:', error);
    throw error;
  }
}

/**
 * Obtiene causas desde cache si existe, sino carga desde CSV
 */
function obtenerCausas(forceReload = false) {
  if (!forceReload && fs.existsSync(CAUSAS_CACHE_FILE)) {
    try {
      const cache = JSON.parse(fs.readFileSync(CAUSAS_CACHE_FILE, 'utf-8'));
      console.log(`✅ Causas cargadas desde cache: ${cache.length}`);
      return cache;
    } catch (error) {
      console.warn('⚠️ Error leyendo cache, recargando desde CSV...');
    }
  }

  return cargarCausasDesdeCSV();
}

/**
 * Obtiene solo causas válidas para scraping
 */
function obtenerCausasValidas(causas = null) {
  if (!causas) {
    causas = obtenerCausas();
  }

  return causas.filter(c => c.validacion && c.validacion.valida);
}

/**
 * Obtiene estadísticas de causas
 */
function obtenerEstadisticasCausas(causas = null) {
  if (!causas) {
    causas = obtenerCausas();
  }

  const total = causas.length;
  const validas = causas.filter(c => c.validacion && c.validacion.valida).length;
  const invalidas = total - validas;

  const porCompetencia = {};
  const porTribunal = {};
  const porTipoCausa = {};

  causas.forEach(c => {
    // Por competencia
    const comp = c.competencia || 'sin_competencia';
    porCompetencia[comp] = (porCompetencia[comp] || 0) + 1;

    // Por tribunal
    const trib = c.tribunal || 'sin_tribunal';
    porTribunal[trib] = (porTribunal[trib] || 0) + 1;

    // Por tipo
    const tipo = c.tipoCausa || 'sin_tipo';
    porTipoCausa[tipo] = (porTipoCausa[tipo] || 0) + 1;
  });

  return {
    total,
    validas,
    invalidas,
    porcentaje_validas: total > 0 ? ((validas / total) * 100).toFixed(2) : 0,
    por_competencia: porCompetencia,
    por_tribunal: porTribunal,
    por_tipo_causa: porTipoCausa
  };
}

/**
 * Busca una causa por RIT
 */
function buscarCausaPorRIT(rit, causas = null) {
  if (!causas) {
    causas = obtenerCausas();
  }

  return causas.find(c => c.rit === rit || c.id_causa === rit);
}

/**
 * Prepara configuración para scraping de una causa
 */
function prepararConfigScraping(causa) {
  if (!causa || !causa.validacion || !causa.validacion.valida) {
    throw new Error('Causa inválida para scraping');
  }

  return {
    rit: causa.rit || causa.id_causa,
    competencia: causa.competencia || causa.materia_estrategia_id,
    corte: causa.corte || '90',
    tribunal: causa.tribunal || causa.juzgado_cuenta_id,
    tipoCausa: causa.tipoCausa || 'C',
    // Metadatos adicionales
    causa_id: causa.causa_id || causa.id,
    caratulado: causa.caratulado || causa.causa_nombre,
    agenda_id: causa.agenda_id,
    cliente: causa.cliente,
    rut: causa.rut
  };
}

module.exports = {
  cargarCausasDesdeCSV,
  obtenerCausas,
  obtenerCausasValidas,
  obtenerEstadisticasCausas,
  buscarCausaPorRIT,
  prepararConfigScraping,
  normalizarCausa
};
