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

// Configuración desde variables de entorno
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pjud_scraping',
  charset: 'utf8',
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
    // No forzar estado desde el scraper; dejar que la BD use su valor por defecto
    null,
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
      raw_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      raw_data = VALUES(raw_data),
      updated_at = CURRENT_TIMESTAMP
  `;

  const fechaParsed = parseFecha(movimiento.fecha);

  const params = [
    causaId,
    movimiento.rit,
    movimiento.indice,
    movimiento.etapa || movimiento.tipo_movimiento || null,
    movimiento.etapa_codigo || null,
    movimiento.tramite || null,
    movimiento.descripcion || movimiento.desc_tramite || null,
    movimiento.fecha || movimiento.fec_tramite || null,
    fechaParsed,
    movimiento.foja || null,
    movimiento.folio || null,
    movimiento.tiene_pdf ? 1 : 0,
    movimiento.pdf_principal || null,
    movimiento.pdf_anexo || null,
    movimiento.pdf_descargado ? 1 : 0,
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
 * Registra un PDF descargado
 */
async function registrarPdf(causaId, movimientoId, rit, datos) {
  const sql = `
    INSERT INTO pdfs (
      causa_id, movimiento_id, rit,
      tipo, nombre_archivo, ruta_relativa, tamano_bytes, contenido_base64, hash_md5,
      descargado, fecha_descarga, error_descarga
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      ruta_relativa = VALUES(ruta_relativa),
      tamano_bytes = VALUES(tamano_bytes),
      contenido_base64 = VALUES(contenido_base64),
      hash_md5 = VALUES(hash_md5),
      descargado = VALUES(descargado),
      fecha_descarga = VALUES(fecha_descarga),
      error_descarga = VALUES(error_descarga)
  `;

  return await query(sql, [
    causaId,
    movimientoId,
    rit,
    datos.tipo || 'PRINCIPAL',
    datos.nombre_archivo,
    datos.ruta_relativa || null,
    datos.tamano_bytes || null,
    datos.contenido_base64 || null,
    datos.hash_md5 || null,
    datos.descargado ? 1 : 0,
    datos.fecha_descarga ? new Date(datos.fecha_descarga) : null,
    datos.error_descarga || null
  ]);
}

/**
 * Registra un eBook descargado
 */
async function registrarEbook(causaId, rit, datos) {
  const sql = `
    INSERT INTO ebooks (causa_id, rit, nombre_archivo, ruta_relativa, tamano_bytes, descargado, fecha_descarga, error_descarga)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      nombre_archivo = VALUES(nombre_archivo),
      ruta_relativa = VALUES(ruta_relativa),
      tamano_bytes = VALUES(tamano_bytes),
      descargado = VALUES(descargado),
      fecha_descarga = VALUES(fecha_descarga),
      error_descarga = VALUES(error_descarga)
  `;

  return await query(sql, [
    causaId,
    rit,
    datos.nombre_archivo,
    datos.ruta_relativa || null,
    datos.tamano_bytes || null,
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
  
  // Utilidades
  getEstadisticas
};
