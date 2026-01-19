// Procesador de datos para estructurar y ordenar información extraída de la tabla
// Convierte arrays sin estructura en objetos descriptivos y ordenados

/**
 * Procesa las filas extraídas de la tabla y las estructura en un objeto descriptivo
 * @param {Array<Array>} rows - Filas extraídas de la tabla
 * @param {string} rit - RIT de la causa (ej: "C-3030-2017")
 * @param {Object} pdfMapping - Mapeo de índices de movimiento a nombres de PDF (opcional)
 * @returns {Object} Objeto estructurado con los datos procesados
 */
function processTableData(rows, rit, pdfMapping = {}) {
  if (!rows || rows.length === 0) {
    return {
      rit: rit,
      metadata: {
        fecha_procesamiento: new Date().toISOString(),
        total_movimientos: 0,
        total_partes: 0
      },
      cabecera: null,
      movimientos: [],
      partes: []
    };
  }

  // Separar filas por tipo
  const cabecera = extractCabecera(rows);
  let movimientos = extractMovimientos(rows);
  const partes = extractPartes(rows);

  // Asociar PDFs con movimientos usando el mapeo
  movimientos = movimientos.map(mov => {
    if (mov.tiene_pdf && pdfMapping[mov.indice]) {
      const mapping = pdfMapping[mov.indice];
      // Para retrocompatibilidad, pdf_path será el azul si existe, o el rojo
      mov.pdf_path = mapping.azul || mapping.rojo;
      mov.pdf_ruta_completa = mov.pdf_path ? `outputs/${mov.pdf_path}` : null;
      mov.pdf_principal_nombre = mapping.azul;
      mov.pdf_anexo_nombre = mapping.rojo;
    } else if (mov.tiene_pdf) {
      mov.pdf_path = null;
      mov.pdf_ruta_completa = null;
      mov.pdf_principal_nombre = null;
      mov.pdf_anexo_nombre = null;
    }
    return mov;
  });

  // Determinar estado actual de la causa
  const estadoActual = determinarEstadoActual(movimientos);

  return {
    rit: rit,
    metadata: {
      fecha_procesamiento: new Date().toISOString(),
      total_movimientos: movimientos.length,
      total_partes: partes.length,
      tiene_documentos_pdf: movimientos.some(m => m.tiene_pdf),
      pdfs_asociados: Object.keys(pdfMapping).length
    },
    cabecera: cabecera,
    estado_actual: estadoActual,
    movimientos: movimientos.sort((a, b) => parseInt(b.indice) - parseInt(a.indice)), // Más recientes primero
    partes: partes
  };
}

/**
 * Determina el estado actual de la causa basándose en los movimientos
 * @param {Array} movimientos - Array de movimientos ordenados
 * @returns {Object} Objeto con el estado actual de la causa
 */
function determinarEstadoActual(movimientos) {
  if (!movimientos || movimientos.length === 0) {
    return {
      estado: 'SIN_INFORMACION',
      etapa: null,
      descripcion: 'No hay movimientos disponibles',
      ultimo_movimiento: null,
      fecha_ultimo_movimiento: null
    };
  }

  // Ordenar movimientos por índice descendente (más reciente primero)
  const movimientosOrdenados = [...movimientos].sort((a, b) => parseInt(b.indice) - parseInt(a.indice));
  const ultimoMovimiento = movimientosOrdenados[0];

  // Palabras clave que indican causa terminada
  const indicadoresTerminada = [
    'terminada',
    'archivo del expediente',
    'archivada',
    'cerrada',
    'finalizada',
    'concluida',
    'archivamiento'
  ];

  // Palabras clave que indican causa suspendida
  const indicadoresSuspendida = [
    'suspendida',
    'suspension',
    'sobreseimiento'
  ];

  // Palabras clave para diferentes etapas
  const etapasProcesales = {
    'Ingreso': 'INGRESO',
    'Inicio de la Tramitación': 'INICIO_TRAMITACION',
    'Notificación demanda y su proveído': 'NOTIFICACION',
    'Excepciones': 'EXCEPCIONES',
    'Contestación Excepciones': 'CONTESTACION_EXCEPCIONES',
    'Terminada': 'TERMINADA',
    'Probatorio': 'PROBATORIO',
    'Audiencia': 'AUDIENCIA',
    'Discusión': 'DISCUSION',
    'Sentencia': 'SENTENCIA'
  };

  // Analizar último movimiento y descripción
  const tipoMovimiento = ultimoMovimiento.tipo_movimiento || '';
  const descripcion = (ultimoMovimiento.descripcion || '').toLowerCase();
  const tipoLower = tipoMovimiento.toLowerCase();

  let estado = 'EN_TRAMITE';
  let etapa = etapasProcesales[tipoMovimiento] || 'TRAMITACION';
  let descripcionEstado = `En trámite - ${tipoMovimiento || 'En proceso'}`;

  // Verificar si está terminada
  if (tipoLower.includes('terminada') || 
      descripcion.includes('archivo del expediente') ||
      descripcion.includes('archivada') ||
      descripcion.includes('finalizada')) {
    estado = 'TERMINADA';
    etapa = 'TERMINADA';
    descripcionEstado = tipoMovimiento === 'Terminada' 
      ? ultimoMovimiento.descripcion || 'Causa terminada'
      : 'Causa terminada - ' + (ultimoMovimiento.descripcion || tipoMovimiento);
  }
  // Verificar si está suspendida
  else if (tipoLower.includes('suspendida') || descripcion.includes('suspension')) {
    estado = 'SUSPENDIDA';
    etapa = 'SUSPENDIDA';
    descripcionEstado = 'Causa suspendida';
  }
  // Determinar etapa basada en tipo de movimiento
  else if (etapasProcesales[tipoMovimiento]) {
    etapa = etapasProcesales[tipoMovimiento];
    descripcionEstado = `En ${tipoMovimiento.toLowerCase()}`;
  }

  return {
    estado: estado,
    etapa: etapa,
    descripcion: descripcionEstado,
    ultimo_movimiento: {
      indice: ultimoMovimiento.indice,
      tipo: ultimoMovimiento.tipo_movimiento,
      descripcion: ultimoMovimiento.descripcion,
      fecha: ultimoMovimiento.fecha,
      folio: ultimoMovimiento.folio
    },
    fecha_ultimo_movimiento: ultimoMovimiento.fecha,
    indice_ultimo_movimiento: ultimoMovimiento.indice
  };
}

/**
 * Extrae la información de cabecera de la causa
 */
function extractCabecera(rows) {
  // Buscar fila con RIT (formato: ["", "C-3030-2017", fecha, caratulado, juzgado])
  for (const row of rows) {
    const texto = row.texto || [];
    if (texto.length >= 4 && texto[1] && texto[1].includes('-') && (texto[1].includes('C-') || texto[1].includes('V-'))) {
      return {
        rit: texto[1] || null,
        fecha_ingreso: texto[2] || null,
        caratulado: texto[3] || null,
        juzgado: texto[4] || null
      };
    }
  }
  return null;
}

/**
 * Extrae los movimientos de la causa
 */
function extractMovimientos(rows) {
  const movimientos = [];

  for (const row of rows) {
    // Manejar tanto formato estructurado (row.texto) como arrays simples
    let texto, pdfs, limpios;
    
    if (Array.isArray(row)) {
      // Formato simple: array directo
      texto = row;
      pdfs = [];
      limpios = {};
    } else {
      // Formato estructurado: objeto con propiedades
      texto = row.texto || [];
      pdfs = row.pdfs || [];
      limpios = row.datos_limpios || {};
    }
    
    // Detectar si es una fila de movimiento (tiene índice numérico en primera posición)
    if (texto.length >= 7 && /^\d+$/.test(String(texto[0]))) {
      // Si es formato simple, extraer datos del array directamente
      if (Array.isArray(row)) {
        limpios = {
          indice: texto[0],
          etapa: texto[3] || texto[4] || '',
          tramite: texto[4] || texto[5] || '',
          desc_tramite: texto[5] || texto[6] || '',
          fec_tramite: texto[6] || texto[7] || '',
          foja: texto[7] || texto[8] || '',
          folio: texto[0]
        };
      }
      
      const tienePDF = texto[1] && (texto[1].includes('Descargar') || texto[1].includes('Documento'));
      
      const movimiento = {
        indice: parseInt(texto[0]) || null,
        anexo: limpios.anexo,
        etapa: limpios.etapa || texto[3] || texto[4] || '',
        tramite: limpios.tramite || texto[4] || texto[5] || '',
        desc_tramite: limpios.desc_tramite || texto[5] || texto[6] || '',
        fec_tramite: limpios.fec_tramite || texto[6] || texto[7] || '',
        foja: limpios.foja || texto[7] || texto[8] || '',
        georref: limpios.georref,
        tipo_movimiento: limpios.etapa || texto[4] || texto[5] || '', 
        descripcion: limpios.desc_tramite || texto[5] || texto[6] || '',
        fecha: limpios.fec_tramite || texto[6] || texto[7] || '',
        folio: limpios.folio || texto[0],
        tiene_pdf: tienePDF || pdfs.length > 0,
        pdfs: pdfs
      };

      // Validar que tenga datos mínimos (al menos índice y alguna descripción)
      if (movimiento.indice && (movimiento.desc_tramite || movimiento.descripcion)) {
        movimientos.push(movimiento);
      }
    }
  }

  return movimientos;
}

/**
 * Extrae las partes de la causa
 */
function extractPartes(rows) {
  const partes = [];
  const rolesConocidos = ['DDO.', 'DTE.', 'AB.DTE', 'AB.DDO', 'ACTOR', 'DEMANDADO', 'DEMANDANTE'];

  for (const row of rows) {
    const texto = row.texto || [];
    // Detectar si es una fila de parte (tiene un rol conocido en primera posición)
    if (texto.length >= 4 && rolesConocidos.some(rol => texto[0] && texto[0].includes(rol))) {
      const parte = {
        rol: texto[0] || null,
        rut: texto[1] || null,
        tipo_persona: texto[2] || null, // NATURAL o JURIDICA
        nombre: texto[3] || null,
        descripcion: texto.length > 4 ? texto.slice(3).join(' ') : null
      };

      if (parte.rol && parte.nombre) {
        partes.push(parte);
      }
    }
  }

  return partes;
}

/**
 * Crea un objeto estructurado para movimientos (compatible con base de datos)
 * @param {Object} datosProcesados - Objeto procesado por processTableData
 * @returns {Object} Objeto listo para insertar en BD
 */
function prepareMovimientosForDB(datosProcesados) {
  if (!datosProcesados.movimientos || datosProcesados.movimientos.length === 0) {
    return [];
  }

  return datosProcesados.movimientos.map(mov => ({
    rit: datosProcesados.rit,
    indice: mov.indice,
    fecha: mov.fecha,
    caratulado: datosProcesados.cabecera?.caratulado || null,
    juzgado: datosProcesados.cabecera?.juzgado || null,
    folio: mov.folio || null,
    tipo_movimiento: mov.tipo_movimiento,
    subtipo_movimiento: mov.subtipo_movimiento,
    descripcion: mov.descripcion,
    tiene_pdf: mov.tiene_pdf,
    pdf_path: mov.pdf_path || null,
    pdf_ruta_completa: mov.pdf_ruta_completa || null,
    observaciones: mov.observaciones,
    raw_data: {
      indice: mov.indice,
      tipo: mov.tipo_movimiento,
      subtipo: mov.subtipo_movimiento,
      descripcion: mov.descripcion,
      fecha: mov.fecha,
      folio: mov.folio,
      pdf_path: mov.pdf_path || null
    }
  }));
}

/**
 * Exporta datos estructurados a JSON
 */
function exportStructuredJSON(datosProcesados, outputDir, rit) {
  const fs = require('fs');
  const path = require('path');

  const filename = `movimientos_${rit.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
  const filepath = path.join(outputDir, filename);

  // Crear estructura final
  const output = {
    causa: {
      rit: datosProcesados.rit,
      fecha_ingreso: datosProcesados.cabecera?.fecha_ingreso || null,
      caratulado: datosProcesados.cabecera?.caratulado || null,
      juzgado: datosProcesados.cabecera?.juzgado || null
    },
    metadata: datosProcesados.metadata,
    estado_actual: datosProcesados.estado_actual,
    movimientos: datosProcesados.movimientos,
    partes: datosProcesados.partes
  };

  fs.writeFileSync(filepath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`🟢 JSON estructurado exportado: ${filename}`);
  
  return filepath;
}

module.exports = {
  processTableData,
  prepareMovimientosForDB,
  exportStructuredJSON,
  extractCabecera,
  extractMovimientos,
  extractPartes
};

