/**
 * SERVICIO DE BASE DE DATOS MARIADB
 * Compatible con MariaDB 5.5.68 / CentOS 7.9
 * 
 * Proporciona funciones para:
 * - Gestión de causas
 * - Gestión de movimientos
 * - Registro de errores
 * - Logs de scraping
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

// Configuración desde variables de entorno
// Para XAMPP en Mac, usar socket en lugar de TCP si está disponible
const XAMPP_SOCKET = '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock';
const useSocket = fs.existsSync(XAMPP_SOCKET) && !process.env.DB_HOST;

const DB_CONFIG = {
  ...(useSocket ? { socketPath: XAMPP_SOCKET } : {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306')
  }),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pjud_scraping',
  charset: 'utf8mb4',
  connectTimeout: 10000,
  // Pool configuration
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;

/**
 * Obtiene el pool de conexiones (singleton)
 */
function getPool() {
  if (!pool) {
    pool = mysql.createPool(DB_CONFIG);
  }
  return pool;
}

/**
 * Ejecuta una query con manejo de errores
 */
async function query(sql, params = []) {
  const connection = await getPool().getConnection();
  try {
    const [results] = await connection.execute(sql, params);
    return results;
  } finally {
    connection.release();
  }
}

/**
 * Ejecuta múltiples queries en una transacción
 */
async function transaction(queries) {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const { sql, params } of queries) {
      const [result] = await connection.execute(sql, params || []);
      results.push(result);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// ============================================
// GESTIÓN DE CAUSAS
// ============================================

/**
 * Inserta o actualiza una causa
 */
async function upsertCausa(causa) {
  const sql = `
    INSERT INTO causas (
      rit, tipo_causa, rol, anio,
      competencia_id, competencia_nombre,
      corte_id, corte_nombre,
      tribunal_id, tribunal_nombre,
      caratulado, fecha_ingreso,
      estado, etapa, estado_descripcion,
      total_movimientos, total_pdfs,
      fecha_ultimo_scraping, scraping_exitoso, error_scraping
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      competencia_id = VALUES(competencia_id),
      competencia_nombre = VALUES(competencia_nombre),
      corte_id = VALUES(corte_id),
      corte_nombre = VALUES(corte_nombre),
      tribunal_id = VALUES(tribunal_id),
      tribunal_nombre = VALUES(tribunal_nombre),
      caratulado = VALUES(caratulado),
      fecha_ingreso = VALUES(fecha_ingreso),
      estado = VALUES(estado),
      etapa = VALUES(etapa),
      estado_descripcion = VALUES(estado_descripcion),
      total_movimientos = VALUES(total_movimientos),
      total_pdfs = VALUES(total_pdfs),
      fecha_ultimo_scraping = VALUES(fecha_ultimo_scraping),
      scraping_exitoso = VALUES(scraping_exitoso),
      error_scraping = VALUES(error_scraping),
      updated_at = CURRENT_TIMESTAMP
  `;

  // Parsear RIT
  const ritParts = causa.rit.split('-');
  const tipoCausa = ritParts[0] || 'C';
  const rol = ritParts[1] || '';
  const anio = parseInt(ritParts[2]) || new Date().getFullYear();

  const params = [
    causa.rit,
    tipoCausa,
    rol,
    anio,
    causa.competencia_id || null,
    causa.competencia_nombre || null,
    causa.corte_id || null,
    causa.corte_nombre || null,
    causa.tribunal_id || null,
    causa.tribunal_nombre || null,
    causa.caratulado || null,
    causa.fecha_ingreso || null,
    causa.estado || 'SIN_INFORMACION',
    causa.etapa || null,
    causa.estado_descripcion || null,
    causa.total_movimientos || 0,
    causa.total_pdfs || 0,
    causa.fecha_ultimo_scraping ? new Date(causa.fecha_ultimo_scraping) : null,
    causa.scraping_exitoso ? 1 : 0,
    causa.error_scraping || null
  ];

  const result = await query(sql, params);
  
  // Obtener el ID (insertId o buscar por RIT)
  if (result.insertId) {
    return result.insertId;
  }
  
  const [rows] = await query('SELECT id FROM causas WHERE rit = ?', [causa.rit]);
  return rows?.id || null;
}

/**
 * Obtiene una causa por RIT
 */
async function getCausaByRit(rit) {
  const rows = await query('SELECT * FROM causas WHERE rit = ?', [rit]);
  return rows[0] || null;
}

/**
 * Obtiene todas las causas
 */
async function getAllCausas(options = {}) {
  let sql = 'SELECT * FROM causas WHERE 1=1';
  const params = [];

  if (options.estado) {
    sql += ' AND estado = ?';
    params.push(options.estado);
  }

  if (options.pendientes) {
    sql += ' AND (scraping_exitoso = 0 OR fecha_ultimo_scraping IS NULL)';
  }

  sql += ' ORDER BY created_at DESC';

  if (options.limit) {
    sql += ' LIMIT ?';
    params.push(options.limit);
  }

  return await query(sql, params);
}

// ============================================
// GESTIÓN DE MOVIMIENTOS
// ============================================

/**
 * Parsea una fecha en formato DD/MM/YYYY a Date
 */
function parseFecha(fechaStr) {
  if (!fechaStr) return null;
  
  const match = fechaStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    const [, dia, mes, anio] = match;
    return new Date(`${anio}-${mes}-${dia}`);
  }
  return null;
}

/**
 * Inserta o actualiza un movimiento
 */
async function upsertMovimiento(movimiento, causaId) {
  const sql = `
    INSERT INTO movimientos (
      causa_id, rit, indice,
      etapa, etapa_codigo,
      tramite, descripcion, fecha, fecha_parsed, foja, folio,
      tiene_pdf, pdf_principal, pdf_anexo, pdf_descargado,
      id_cuaderno, cuaderno_nombre, id_pagina,
      raw_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      etapa = VALUES(etapa),
      etapa_codigo = VALUES(etapa_codigo),
      tramite = VALUES(tramite),
      descripcion = VALUES(descripcion),
      fecha = VALUES(fecha),
      fecha_parsed = VALUES(fecha_parsed),
      foja = VALUES(foja),
      folio = VALUES(folio),
      tiene_pdf = VALUES(tiene_pdf),
      pdf_principal = VALUES(pdf_principal),
      pdf_anexo = VALUES(pdf_anexo),
      pdf_descargado = VALUES(pdf_descargado),
      id_cuaderno = VALUES(id_cuaderno),
      cuaderno_nombre = VALUES(cuaderno_nombre),
      id_pagina = VALUES(id_pagina),
      raw_data = VALUES(raw_data),
      updated_at = CURRENT_TIMESTAMP
  `;

  // Obtener la fecha y asegurar que no exceda el límite de la columna
  let fechaStr = movimiento.fecha || movimiento.fec_tramite || null;
  if (fechaStr && fechaStr.length > 20) {
    // Truncar a los primeros 20 caracteres (DD/MM/YYYY tiene 10)
    fechaStr = fechaStr.substring(0, 20);
  }
  
  const fechaParsed = parseFecha(fechaStr);

  const params = [
    causaId,
    movimiento.rit,
    movimiento.indice,
    movimiento.etapa || movimiento.tipo_movimiento || null,
    movimiento.etapa_codigo || null,
    (movimiento.tramite || '').substring(0, 255) || null,
    (movimiento.descripcion || movimiento.desc_tramite || '').substring(0, 500) || null,
    fechaStr,
    fechaParsed,
    movimiento.foja || null,
    movimiento.folio || null,
    movimiento.tiene_pdf ? 1 : 0,
    movimiento.pdf_principal || null,
    movimiento.pdf_anexo || null,
    movimiento.pdf_descargado ? 1 : 0,
    movimiento.id_cuaderno || '1',
    movimiento.cuaderno_nombre || 'Principal',
    movimiento.id_pagina || null,
    JSON.stringify(movimiento.raw_data || movimiento)
  ];

  return await query(sql, params);
}

/**
 * Inserta múltiples movimientos en lote
 */
async function insertMovimientosBatch(movimientos, causaId, rit) {
  if (!movimientos || movimientos.length === 0) return { insertados: 0, actualizados: 0 };

  let insertados = 0;
  let actualizados = 0;

  for (const mov of movimientos) {
    mov.rit = mov.rit || rit;
    const result = await upsertMovimiento(mov, causaId);
    if (result.affectedRows === 1) {
      insertados++;
    } else if (result.affectedRows === 2) {
      actualizados++;
    }
  }

  return { insertados, actualizados };
}

/**
 * Obtiene movimientos de una causa
 */
async function getMovimientosByCausa(causaId, options = {}) {
  let sql = 'SELECT * FROM movimientos WHERE causa_id = ?';
  const params = [causaId];

  if (options.etapa_codigo) {
    sql += ' AND etapa_codigo = ?';
    params.push(options.etapa_codigo);
  }

  if (options.tiene_pdf !== undefined) {
    sql += ' AND tiene_pdf = ?';
    params.push(options.tiene_pdf ? 1 : 0);
  }

  sql += ' ORDER BY indice DESC';

  return await query(sql, params);
}

/**
 * Obtiene movimientos agrupados por etapa
 */
async function getMovimientosPorEtapa(causaId) {
  const sql = `
    SELECT 
      COALESCE(m.etapa_codigo, 'SIN_ETAPA') as etapa_codigo,
      COALESCE(e.nombre, m.etapa) as etapa_nombre,
      COUNT(*) as total,
      SUM(m.tiene_pdf) as con_pdf,
      SUM(m.pdf_descargado) as descargados
    FROM movimientos m
    LEFT JOIN etapas_juicio e ON e.codigo = m.etapa_codigo
    WHERE m.causa_id = ?
    GROUP BY m.etapa_codigo, e.nombre, m.etapa
    ORDER BY e.orden, m.etapa_codigo
  `;

  return await query(sql, [causaId]);
}

// ============================================
// REGISTRO DE ERRORES
// ============================================

/**
 * Registra un error de scraping
 */
async function registrarError(rit, tipoError, mensaje, stackTrace = null) {
  // Obtener causa_id si existe
  const causa = await getCausaByRit(rit);
  const causaId = causa?.id || null;

  // Verificar si ya existe un error similar no resuelto
  const erroresExistentes = await query(
    'SELECT id, intentos FROM errores_scraping WHERE rit = ? AND tipo_error = ? AND resuelto = 0',
    [rit, tipoError]
  );

  if (erroresExistentes.length > 0) {
    // Actualizar error existente
    const error = erroresExistentes[0];
    await query(
      `UPDATE errores_scraping 
       SET intentos = intentos + 1, 
           ultimo_intento = NOW(),
           mensaje_error = ?,
           stack_trace = ?
       WHERE id = ?`,
      [mensaje, stackTrace, error.id]
    );
    return { id: error.id, intentos: error.intentos + 1, nuevo: false };
  } else {
    // Insertar nuevo error
    const result = await query(
      `INSERT INTO errores_scraping 
       (causa_id, rit, tipo_error, mensaje_error, stack_trace, ultimo_intento)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [causaId, rit, tipoError, mensaje, stackTrace]
    );
    return { id: result.insertId, intentos: 1, nuevo: true };
  }
}

/**
 * Verifica si debe reintentar el scraping
 */
async function debeReintentar(rit, maxIntentos = 3) {
  const rows = await query(
    'SELECT MAX(intentos) as max_intentos FROM errores_scraping WHERE rit = ? AND resuelto = 0',
    [rit]
  );
  
  const maxIntentosActual = rows[0]?.max_intentos || 0;
  return maxIntentosActual < maxIntentos;
}

/**
 * Marca errores como resueltos
 */
async function marcarErroresResueltos(rit, nota = null) {
  return await query(
    `UPDATE errores_scraping 
     SET resuelto = 1, 
         fecha_resolucion = NOW(),
         notas_resolucion = ?
     WHERE rit = ? AND resuelto = 0`,
    [nota || 'Resuelto automáticamente', rit]
  );
}

/**
 * Obtiene errores pendientes
 */
async function getErroresPendientes(options = {}) {
  let sql = 'SELECT * FROM errores_scraping WHERE resuelto = 0';
  const params = [];

  if (options.tipo_error) {
    sql += ' AND tipo_error = ?';
    params.push(options.tipo_error);
  }

  if (options.max_intentos) {
    sql += ' AND intentos < ?';
    params.push(options.max_intentos);
  }

  sql += ' ORDER BY ultimo_intento DESC';

  return await query(sql, params);
}

// ============================================
// LOGS DE SCRAPING
// ============================================

/**
 * Registra un log de scraping
 */
async function log(rit, tipo, mensaje, detalle = null, duracionMs = null) {
  const causa = await getCausaByRit(rit);
  
  return await query(
    `INSERT INTO scraping_log (causa_id, rit, tipo, mensaje, detalle, duracion_ms)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      causa?.id || null,
      rit,
      tipo,
      mensaje,
      detalle ? JSON.stringify(detalle) : null,
      duracionMs
    ]
  );
}

/**
 * Marca una causa como procesada exitosamente
 */
async function marcarExito(rit, totalMovimientos, totalPdfs) {
  // Actualizar causa
  await query(
    `UPDATE causas 
     SET fecha_ultimo_scraping = NOW(),
         scraping_exitoso = 1,
         total_movimientos = ?,
         total_pdfs = ?,
         error_scraping = NULL
     WHERE rit = ?`,
    [totalMovimientos, totalPdfs, rit]
  );

  // Marcar errores como resueltos
  await marcarErroresResueltos(rit, 'Scraping completado exitosamente');

  // Log de éxito
  await log(rit, 'SUCCESS', `Scraping completado: ${totalMovimientos} movimientos, ${totalPdfs} PDFs`);
}

// ============================================
// GESTIÓN DE PDFs
// ============================================

/**
 * Registra un PDF descargado con contenido base64
 */
async function registrarPdf(causaId, movimientoId, rit, datos) {
  const sql = `
    INSERT INTO pdfs (
      causa_id, movimiento_id, rit,
      tipo, nombre_archivo, ruta_relativa, tamano_bytes, hash_md5,
      base64_content, tamano_base64_bytes,
      descargado, fecha_descarga, error_descarga
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      ruta_relativa = VALUES(ruta_relativa),
      tamano_bytes = VALUES(tamano_bytes),
      hash_md5 = VALUES(hash_md5),
      base64_content = VALUES(base64_content),
      tamano_base64_bytes = VALUES(tamano_base64_bytes),
      descargado = VALUES(descargado),
      fecha_descarga = VALUES(fecha_descarga),
      error_descarga = VALUES(error_descarga)
  `;

  const base64Content = datos.base64 || datos.base64_content || null;
  const tamanoBase64 = base64Content ? Buffer.byteLength(base64Content, 'utf8') : null;

  return await query(sql, [
    causaId,
    movimientoId,
    rit,
    datos.tipo || 'PRINCIPAL',
    datos.nombre_archivo,
    datos.ruta_relativa || null,
    datos.tamano_bytes || null,
    datos.hash_md5 || null,
    base64Content,
    tamanoBase64,
    datos.descargado ? 1 : 0,
    datos.fecha_descarga ? new Date(datos.fecha_descarga) : null,
    datos.error_descarga || null
  ]);
}

/**
 * Registra un eBook descargado con contenido base64 (pdf_ebook)
 */
async function registrarEbook(causaId, rit, datos) {
  const sql = `
    INSERT INTO ebooks (
      causa_id, rit, nombre_archivo, ruta_relativa, tamano_bytes,
      base64_content, tamano_base64_bytes,
      descargado, fecha_descarga, error_descarga
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      nombre_archivo = VALUES(nombre_archivo),
      ruta_relativa = VALUES(ruta_relativa),
      tamano_bytes = VALUES(tamano_bytes),
      base64_content = VALUES(base64_content),
      tamano_base64_bytes = VALUES(tamano_base64_bytes),
      descargado = VALUES(descargado),
      fecha_descarga = VALUES(fecha_descarga),
      error_descarga = VALUES(error_descarga)
  `;

  const base64Content = datos.base64 || datos.base64_content || null;
  const tamanoBase64 = base64Content ? Buffer.byteLength(base64Content, 'utf8') : null;

  return await query(sql, [
    causaId,
    rit,
    datos.nombre_archivo,
    datos.ruta_relativa || null,
    datos.tamano_bytes || null,
    base64Content,
    tamanoBase64,
    datos.descargado ? 1 : 0,
    datos.fecha_descarga ? new Date(datos.fecha_descarga) : null,
    datos.error_descarga || null
  ]);
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Cierra el pool de conexiones
 */
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Verifica la conexión a la base de datos
 */
async function testConnection() {
  try {
    const connection = await getPool().getConnection();
    await connection.ping();
    connection.release();
    return { success: true, message: 'Conexión exitosa' };
  } catch (error) {
    return { success: false, message: error.message, code: error.code };
  }
}

/**
 * Obtiene PDFs de un movimiento
 */
async function getPdfsByMovimiento(movimientoId) {
  return await query(
    'SELECT * FROM pdfs WHERE movimiento_id = ? ORDER BY tipo, fecha_descarga',
    [movimientoId]
  );
}

/**
 * Obtiene PDFs de una causa
 */
async function getPdfsByCausa(causaId) {
  return await query(
    'SELECT * FROM pdfs WHERE causa_id = ? ORDER BY movimiento_id, tipo, fecha_descarga',
    [causaId]
  );
}

/**
 * Obtiene eBook de una causa
 */
async function getEbookByCausa(causaId) {
  const rows = await query(
    'SELECT * FROM ebooks WHERE causa_id = ? ORDER BY fecha_descarga DESC LIMIT 1',
    [causaId]
  );
  return rows[0] || null;
}

/**
 * Obtiene causa completa con movimientos y PDFs desde la BD
 */
async function getCausaCompleta(rit) {
  const causa = await getCausaByRit(rit);
  if (!causa) return null;

  // Obtener movimientos
  const movimientos = await getMovimientosByCausa(causa.id);
  
  // Obtener PDFs de la causa
  const pdfsCausa = await getPdfsByCausa(causa.id);
  
  // Obtener eBook
  const ebook = await getEbookByCausa(causa.id);

  // Asociar PDFs a movimientos
  const movimientosConPdfs = movimientos.map(mov => {
    const pdfsMov = pdfsCausa.filter(p => p.movimiento_id === mov.id);
    
    // Separar PDFs por tipo (PRINCIPAL = azul, ANEXO = rojo)
    const pdfAzul = pdfsMov.find(p => p.tipo === 'PRINCIPAL');
    const pdfRojo = pdfsMov.find(p => p.tipo === 'ANEXO');
    
    return {
      ...mov,
      id_pagina: mov.id_pagina || `p-${mov.id_cuaderno || 1}-${mov.indice}`,
      id_cuaderno: mov.id_cuaderno || '1',
      cuaderno_nombre: mov.cuaderno_nombre || 'Principal',
      pdf_azul: pdfAzul ? {
        nombre: pdfAzul.nombre_archivo,
        base64: pdfAzul.base64_content,
        tipo: 'application/pdf',
        tamaño_kb: pdfAzul.tamano_base64_bytes ? Math.round(pdfAzul.tamano_base64_bytes / 1024) : null
      } : null,
      pdf_rojo: pdfRojo ? {
        nombre: pdfRojo.nombre_archivo,
        base64: pdfRojo.base64_content,
        tipo: 'application/pdf',
        tamaño_kb: pdfRojo.tamano_base64_bytes ? Math.round(pdfRojo.tamano_base64_bytes / 1024) : null
      } : null,
      tiene_pdf_azul: !!pdfAzul,
      tiene_pdf_rojo: !!pdfRojo
    };
  });

  // Agrupar movimientos por cuaderno
  const cuadernosMap = {};
  movimientosConPdfs.forEach(mov => {
    const idCuaderno = mov.id_cuaderno || '1';
    if (!cuadernosMap[idCuaderno]) {
      cuadernosMap[idCuaderno] = {
        id_cuaderno: idCuaderno,
        nombre: mov.cuaderno_nombre || 'Principal',
        movimientos: []
      };
    }
    cuadernosMap[idCuaderno].movimientos.push(mov);
  });
  const cuadernos = Object.values(cuadernosMap);

  // Helper para convertir fecha de forma segura
  const formatearFecha = (fecha) => {
    if (!fecha) return null;
    try {
      const d = new Date(fecha);
      return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
    } catch (e) {
      return null;
    }
  };

  const formatearFechaCompleta = (fecha) => {
    if (!fecha) return null;
    try {
      const d = new Date(fecha);
      return isNaN(d.getTime()) ? null : d.toISOString();
    } catch (e) {
      return null;
    }
  };

  return {
    rit: causa.rit,
    cabecera: {
      rit: causa.rit,
      caratulado: causa.caratulado,
      juzgado: causa.tribunal_nombre,
      fecha_ingreso: formatearFecha(causa.fecha_ingreso)
    },
    estado_actual: {
      estado: causa.estado,
      etapa: causa.etapa,
      descripcion: causa.estado_descripcion
    },
    movimientos: movimientosConPdfs,
    cuadernos: cuadernos,
    total_movimientos: movimientosConPdfs.length,
    total_cuadernos: cuadernos.length,
    total_pdfs: pdfsCausa.length,
    ebook: ebook ? {
      nombre: ebook.nombre_archivo,
      base64: ebook.base64_content,
      tipo: 'application/pdf',
      tamaño_kb: ebook.tamano_base64_bytes ? Math.round(ebook.tamano_base64_bytes / 1024) : null
    } : null,
    pdf_ebook: ebook ? {
      rit: causa.rit,
      nombre: ebook.nombre_archivo,
      base64: ebook.base64_content,
      tipo: 'application/pdf',
      tamaño_kb: ebook.tamano_base64_bytes ? Math.round(ebook.tamano_base64_bytes / 1024) : null
    } : null,
    fecha_scraping: formatearFechaCompleta(causa.fecha_ultimo_scraping)
  };
}

/**
 * Lista todas las causas con información básica
 */
async function listarCausas() {
  const causas = await getAllCausas({ limit: 1000 });
  return causas.map(c => ({
    rit: c.rit,
    caratulado: c.caratulado,
    tribunal: c.tribunal_nombre,
    fecha_ingreso: c.fecha_ingreso,
    estado: c.estado,
    total_movimientos: c.total_movimientos || 0,
    total_pdfs: c.total_pdfs || 0,
    fecha_scraping: c.fecha_ultimo_scraping ? new Date(c.fecha_ultimo_scraping).toISOString() : null
  }));
}

/**
 * Obtiene estadísticas generales
 */
async function getEstadisticas() {
  const [causas] = await query('SELECT COUNT(*) as total, SUM(scraping_exitoso) as exitosos FROM causas');
  const [movimientos] = await query('SELECT COUNT(*) as total, SUM(tiene_pdf) as con_pdf, SUM(pdf_descargado) as descargados FROM movimientos');
  const [errores] = await query('SELECT COUNT(*) as total, SUM(IF(resuelto=0,1,0)) as pendientes FROM errores_scraping');

  return {
    causas: causas[0] || { total: 0, exitosos: 0 },
    movimientos: movimientos[0] || { total: 0, con_pdf: 0, descargados: 0 },
    errores: errores[0] || { total: 0, pendientes: 0 }
  };
}

/**
 * Obtiene estadísticas relevantes para abogados
 */
async function getEstadisticasAbogados() {
  const stats = {
    total_causas: 0,
    causas_en_tramite: 0,
    causas_terminadas: 0,
    total_movimientos: 0,
    movimientos_ultimos_7_dias: 0,
    movimientos_ultimos_30_dias: 0,
    causas_con_movimientos_nuevos: 0,
    total_pdfs: 0,
    pdfs_pendientes_descarga: 0,
    causas_sin_scraping: 0,
    ultimo_scraping: null
  };

  try {
    // Total causas
    const totalCausas = await query('SELECT COUNT(*) as total FROM causas');
    stats.total_causas = totalCausas[0]?.total || 0;

    // Causas en trámite vs terminadas
    const estados = await query(`
      SELECT estado, COUNT(*) as total 
      FROM causas 
      GROUP BY estado
    `);
    estados.forEach(e => {
      if (e.estado === 'EN_TRAMITE') stats.causas_en_tramite = e.total;
      if (e.estado === 'TERMINADA') stats.causas_terminadas = e.total;
    });

    // Total movimientos
    const totalMovs = await query('SELECT COUNT(*) as total FROM movimientos');
    stats.total_movimientos = totalMovs[0]?.total || 0;

    // Movimientos últimos 7 días (solo si fecha_parsed no es NULL)
    const movs7d = await query(`
      SELECT COUNT(*) as total 
      FROM movimientos 
      WHERE fecha_parsed IS NOT NULL 
      AND fecha_parsed >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    stats.movimientos_ultimos_7_dias = movs7d[0]?.total || 0;

    // Movimientos últimos 30 días (solo si fecha_parsed no es NULL)
    const movs30d = await query(`
      SELECT COUNT(*) as total 
      FROM movimientos 
      WHERE fecha_parsed IS NOT NULL 
      AND fecha_parsed >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    stats.movimientos_ultimos_30_dias = movs30d[0]?.total || 0;

    // Causas con movimientos nuevos (últimos 7 días)
    const causasNuevas = await query(`
      SELECT COUNT(DISTINCT m.causa_id) as total
      FROM movimientos m
      INNER JOIN causas c ON m.causa_id = c.id
      WHERE m.fecha_parsed IS NOT NULL
      AND m.fecha_parsed >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      AND (c.fecha_ultimo_scraping IS NULL OR m.fecha_parsed > c.fecha_ultimo_scraping)
    `);
    stats.causas_con_movimientos_nuevos = causasNuevas[0]?.total || 0;

    // Total PDFs
    const totalPdfs = await query('SELECT COUNT(*) as total FROM pdfs');
    stats.total_pdfs = totalPdfs[0]?.total || 0;

    // PDFs pendientes de descarga
    const pdfsPendientes = await query(`
      SELECT COUNT(*) as total 
      FROM movimientos 
      WHERE tiene_pdf = 1 AND pdf_descargado = 0
    `);
    stats.pdfs_pendientes_descarga = pdfsPendientes[0]?.total || 0;

    // Causas sin scraping
    const sinScraping = await query(`
      SELECT COUNT(*) as total 
      FROM causas 
      WHERE fecha_ultimo_scraping IS NULL OR scraping_exitoso = 0
    `);
    stats.causas_sin_scraping = sinScraping[0]?.total || 0;

    // Último scraping
    const ultimoScraping = await query(`
      SELECT MAX(fecha_ultimo_scraping) as ultimo 
      FROM causas 
      WHERE fecha_ultimo_scraping IS NOT NULL
    `);
    stats.ultimo_scraping = ultimoScraping[0]?.ultimo || null;

    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas de abogados:', error);
    // Retornar stats con valores por defecto en caso de error
    return stats;
  }
}

/**
 * Detecta movimientos nuevos en una causa (desde el último scraping)
 */
async function detectarMovimientosNuevos(rit) {
  try {
    const causa = await getCausaByRit(rit);
    if (!causa) return { tieneNuevos: false, movimientos: [], error: 'Causa no encontrada' };

    // Obtener todos los movimientos de la causa
    const movimientos = await getMovimientosByCausa(causa.id);
    
    // Si no hay fecha de último scraping, considerar todos como nuevos
    if (!causa.fecha_ultimo_scraping) {
      return { tieneNuevos: movimientos.length > 0, movimientos, totalMovimientos: movimientos.length };
    }

    // Filtrar movimientos más recientes que el último scraping
    const fechaUltimoScraping = new Date(causa.fecha_ultimo_scraping);
    const movimientosNuevos = movimientos.filter(mov => {
      if (!mov.fecha_parsed) return false;
      try {
        const fechaMov = new Date(mov.fecha_parsed);
        return !isNaN(fechaMov.getTime()) && fechaMov > fechaUltimoScraping;
      } catch (e) {
        return false;
      }
    });

    return {
      tieneNuevos: movimientosNuevos.length > 0,
      movimientos: movimientosNuevos,
      totalMovimientos: movimientos.length,
      fechaUltimoScraping: causa.fecha_ultimo_scraping
    };
  } catch (error) {
    console.error(`Error detectando movimientos nuevos para ${rit}:`, error);
    return { tieneNuevos: false, movimientos: [], error: error.message };
  }
}

/**
 * Obtiene todas las causas con movimientos nuevos
 */
async function getCausasConMovimientosNuevos() {
  try {
    const causas = await query(`
      SELECT DISTINCT c.*
      FROM causas c
      INNER JOIN movimientos m ON c.id = m.causa_id
      WHERE m.fecha_parsed IS NOT NULL
      AND (c.fecha_ultimo_scraping IS NULL OR m.fecha_parsed > c.fecha_ultimo_scraping)
      AND m.fecha_parsed >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ORDER BY m.fecha_parsed DESC
    `);

    const causasConDetalle = [];
    for (const causa of causas) {
      try {
        const deteccion = await detectarMovimientosNuevos(causa.rit);
        if (deteccion.tieneNuevos && !deteccion.error) {
          causasConDetalle.push({
            causa: {
              rit: causa.rit,
              caratulado: causa.caratulado,
              tribunal_nombre: causa.tribunal_nombre,
              estado: causa.estado,
              etapa: causa.etapa
            },
            movimientosNuevos: deteccion.movimientos,
            totalNuevos: deteccion.movimientos.length
          });
        }
      } catch (error) {
        console.error(`Error procesando causa ${causa.rit}:`, error);
        // Continuar con la siguiente causa
      }
    }

    return causasConDetalle;
  } catch (error) {
    console.error('Error obteniendo causas con movimientos nuevos:', error);
    return [];
  }
}

module.exports = {
  // Conexión
  getPool,
  query,
  transaction,
  closePool,
  testConnection,
  
  // Causas
  upsertCausa,
  getCausaByRit,
  getAllCausas,
  
  // Movimientos
  upsertMovimiento,
  insertMovimientosBatch,
  getMovimientosByCausa,
  getMovimientosPorEtapa,
  
  // Errores
  registrarError,
  debeReintentar,
  marcarErroresResueltos,
  getErroresPendientes,
  
  // Logs
  log,
  marcarExito,
  
  // PDFs
  registrarPdf,
  registrarEbook,
  getPdfsByMovimiento,
  getPdfsByCausa,
  getEbookByCausa,
  
  // Funciones completas
  getCausaCompleta,
  listarCausas,
  
  // Utilidades
  getEstadisticas,
  getEstadisticasAbogados,
  detectarMovimientosNuevos,
  getCausasConMovimientosNuevos
};
