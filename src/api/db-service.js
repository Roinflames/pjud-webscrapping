/**
 * Servicio de Base de Datos - Gestiona conexión y operaciones con MySQL
 */

const mysql = require('mysql2/promise');

// Configuración de conexión
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'codi_ejamtest',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;

/**
 * Obtener pool de conexiones
 */
async function getPool() {
  if (!pool) {
    try {
      pool = mysql.createPool(dbConfig);
      console.log('[DB] Pool de conexiones creado');
    } catch (error) {
      console.error('[DB] Error creando pool:', error.message);
      throw error;
    }
  }
  return pool;
}

/**
 * Guardar movimientos de una causa en la base de datos
 * @param {string} rit - RIT de la causa
 * @param {Array} movimientos - Array de movimientos
 * @param {Object} cabecera - Datos de cabecera (caratulado, juzgado)
 * @param {Object} pdfsBase64 - Objeto con PDFs en base64 { nombreArchivo: contenidoBase64 }
 */
async function guardarMovimientos(rit, movimientos, cabecera = {}, pdfsBase64 = {}) {
  const db = await getPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Eliminar movimientos anteriores de este RIT (para actualización)
    await connection.execute('DELETE FROM movimientos WHERE rit = ?', [rit]);
    await connection.execute('DELETE FROM pdfs WHERE rit = ?', [rit]);

    console.log(`[DB] Guardando ${movimientos.length} movimientos para RIT: ${rit}`);

    for (const mov of movimientos) {
      // Insertar movimiento
      const [result] = await connection.execute(`
        INSERT INTO movimientos (
          rit, indice, fecha, tipo_movimiento, subtipo_movimiento,
          descripcion, folio, tiene_pdf, caratulado, juzgado, raw_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        rit,
        mov.indice || 0,
        mov.fecha || '',
        mov.tipo_movimiento || '',
        mov.subtipo_movimiento || '',
        mov.descripcion || '',
        mov.folio || '',
        mov.tiene_pdf ? 1 : 0,
        cabecera.caratulado || '',
        cabecera.juzgado || '',
        JSON.stringify(mov)
      ]);

      const movimientoId = result.insertId;

      // Buscar PDFs asociados a este movimiento
      const ritClean = rit.replace(/[^a-zA-Z0-9]/g, '_');
      const indice = mov.indice || mov.folio;

      // Buscar PDF principal (azul)
      const pdfPrincipalKeys = Object.keys(pdfsBase64).filter(k =>
        (k.includes(`_mov_${indice}_azul`) || k.includes(`_mov_${indice}_P`) || k.includes(`_doc_${indice}`)) &&
        k.endsWith('.pdf')
      );

      if (pdfPrincipalKeys.length > 0) {
        const pdfKey = pdfPrincipalKeys[0];
        // Obtener causa_id
        const [causaRows] = await connection.execute('SELECT id FROM causas WHERE rit = ? LIMIT 1', [rit]);
        const causaId = causaRows.length > 0 ? causaRows[0].id : null;
        
        if (causaId) {
          await connection.execute(`
            INSERT INTO pdfs (causa_id, movimiento_id, rit, tipo, nombre_archivo, contenido_base64, tamano_bytes, descargado)
            VALUES (?, ?, ?, 'PRINCIPAL', ?, ?, ?, 1)
            ON DUPLICATE KEY UPDATE
              contenido_base64 = VALUES(contenido_base64),
              tamano_bytes = VALUES(tamano_bytes),
              descargado = 1
          `, [
            causaId,
            movimientoId,
            rit,
            pdfKey,
            pdfsBase64[pdfKey],
            Buffer.from(pdfsBase64[pdfKey], 'base64').length
          ]);
        }
      }

      // Buscar PDF anexo (rojo)
      const pdfAnexoKeys = Object.keys(pdfsBase64).filter(k =>
        k.includes(`_mov_${indice}_rojo`) && k.endsWith('.pdf')
      );

      if (pdfAnexoKeys.length > 0) {
        const pdfKey = pdfAnexoKeys[0];
        // Obtener causa_id
        const [causaRows] = await connection.execute('SELECT id FROM causas WHERE rit = ? LIMIT 1', [rit]);
        const causaId = causaRows.length > 0 ? causaRows[0].id : null;
        
        if (causaId) {
          await connection.execute(`
            INSERT INTO pdfs (causa_id, movimiento_id, rit, tipo, nombre_archivo, contenido_base64, tamano_bytes, descargado)
            VALUES (?, ?, ?, 'ANEXO', ?, ?, ?, 1)
            ON DUPLICATE KEY UPDATE
              contenido_base64 = VALUES(contenido_base64),
              tamano_bytes = VALUES(tamano_bytes),
              descargado = 1
          `, [
            causaId,
            movimientoId,
            rit,
            pdfKey,
            pdfsBase64[pdfKey],
            Buffer.from(pdfsBase64[pdfKey], 'base64').length
          ]);
        }
      }
    }

    await connection.commit();
    console.log(`[DB] ✅ Guardados ${movimientos.length} movimientos para RIT: ${rit}`);
    return true;

  } catch (error) {
    await connection.rollback();
    console.error(`[DB] ❌ Error guardando movimientos para ${rit}:`, error.message);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Obtener movimientos de una causa desde la base de datos
 * @param {string} rit - RIT de la causa
 * @param {boolean} includePdfs - Si incluir los PDFs en base64 (default: false para rendimiento)
 */
async function obtenerMovimientos(rit, includePdfs = false) {
  const db = await getPool();

  try {
    let query;
    if (includePdfs) {
      query = `
        SELECT
          m.*,
          pp.contenido_base64 AS pdf_principal_base64,
          pp.nombre_archivo AS pdf_principal_nombre,
          pa.contenido_base64 AS pdf_anexo_base64,
          pa.nombre_archivo AS pdf_anexo_nombre
        FROM movimientos m
        LEFT JOIN pdfs pp ON m.id = pp.movimiento_id AND pp.tipo = 'PRINCIPAL'
        LEFT JOIN pdfs pa ON m.id = pa.movimiento_id AND pa.tipo = 'ANEXO'
        WHERE m.rit = ?
        ORDER BY m.indice DESC
      `;
    } else {
      query = `
        SELECT
          m.*,
          pp.nombre_archivo AS pdf_principal_nombre,
          pa.nombre_archivo AS pdf_anexo_nombre,
          CASE WHEN pp.id IS NOT NULL THEN 1 ELSE 0 END AS tiene_pdf_principal,
          CASE WHEN pa.id IS NOT NULL THEN 1 ELSE 0 END AS tiene_pdf_anexo
        FROM movimientos m
        LEFT JOIN pdfs pp ON m.id = pp.movimiento_id AND pp.tipo = 'PRINCIPAL'
        LEFT JOIN pdfs pa ON m.id = pa.movimiento_id AND pa.tipo = 'ANEXO'
        WHERE m.rit = ?
        ORDER BY m.indice DESC
      `;
    }

    const [rows] = await db.execute(query, [rit]);

    if (rows.length === 0) {
      return null;
    }

    // Estructurar respuesta
    const cabecera = {
      rit: rows[0].rit,
      caratulado: rows[0].caratulado,
      juzgado: rows[0].juzgado
    };

    const movimientos = rows.map(row => ({
      indice: row.indice,
      fecha: row.fecha,
      tipo_movimiento: row.tipo_movimiento,
      subtipo_movimiento: row.subtipo_movimiento,
      descripcion: row.descripcion,
      folio: row.folio,
      tiene_pdf: row.tiene_pdf === 1,
      pdf_principal_nombre: row.pdf_principal_nombre,
      pdf_anexo_nombre: row.pdf_anexo_nombre,
      ...(includePdfs && {
        pdf_principal_base64: row.pdf_principal_base64,
        pdf_anexo_base64: row.pdf_anexo_base64
      })
    }));

    return {
      rit,
      cabecera,
      movimientos,
      total_movimientos: movimientos.length
    };

  } catch (error) {
    console.error(`[DB] Error obteniendo movimientos para ${rit}:`, error.message);
    throw error;
  }
}

/**
 * Obtener un PDF específico por RIT e índice
 * @param {string} rit - RIT de la causa
 * @param {number} indice - Índice del movimiento
 * @param {string} tipo - 'principal' o 'anexo'
 */
async function obtenerPDF(rit, indice, tipo = 'principal') {
  const db = await getPool();

  try {
    const tipoEnum = tipo === 'principal' ? 'PRINCIPAL' : 'ANEXO';
    const [rows] = await db.execute(`
      SELECT p.nombre_archivo, p.contenido_base64, p.tamano_bytes
      FROM pdfs p
      JOIN movimientos m ON p.movimiento_id = m.id
      WHERE m.rit = ? AND m.indice = ? AND p.tipo = ?
    `, [rit, indice, tipoEnum]);

    if (rows.length === 0) {
      return null;
    }

    return rows[0];

  } catch (error) {
    console.error(`[DB] Error obteniendo PDF para ${rit}/${indice}/${tipo}:`, error.message);
    throw error;
  }
}

/**
 * Verificar si una causa tiene movimientos en la base de datos
 * @param {string} rit - RIT de la causa
 */
async function tieneMovimientosEnDB(rit) {
  const db = await getPool();

  try {
    const [rows] = await db.execute(
      'SELECT COUNT(*) as count FROM movimientos WHERE rit = ?',
      [rit]
    );
    return rows[0].count > 0;

  } catch (error) {
    console.error(`[DB] Error verificando movimientos para ${rit}:`, error.message);
    return false;
  }
}

/**
 * Listar todos los RITs procesados en la base de datos
 */
async function listarRITsProcesados() {
  const db = await getPool();

  try {
    const [rows] = await db.execute(`
      SELECT
        rit,
        COUNT(*) as total_movimientos,
        MAX(created_at) as fecha_procesamiento,
        SUM(tiene_pdf) as movimientos_con_pdf
      FROM movimientos
      GROUP BY rit
      ORDER BY fecha_procesamiento DESC
    `);

    return rows;

  } catch (error) {
    console.error('[DB] Error listando RITs:', error.message);
    return [];
  }
}

/**
 * Cerrar pool de conexiones
 */
async function cerrarConexion() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[DB] Pool de conexiones cerrado');
  }
}

module.exports = {
  getPool,
  guardarMovimientos,
  obtenerMovimientos,
  obtenerPDF,
  tieneMovimientosEnDB,
  listarRITsProcesados,
  cerrarConexion
};
