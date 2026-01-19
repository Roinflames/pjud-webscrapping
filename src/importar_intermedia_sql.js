const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Configuración de la base de datos local
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'codi_ejamtest',
  port: process.env.DB_PORT || 3306
};

/**
 * Crea la tabla intermedia si no existe
 */
async function crearTablaIntermedia(connection) {
  const sql = `
    CREATE TABLE IF NOT EXISTS pjud_movimientos_intermedia (
      id INT AUTO_INCREMENT PRIMARY KEY,
      rit VARCHAR(50),
      competencia_id INT,
      corte_id INT,
      tribunal_id INT,
      folio VARCHAR(20),
      doc_principal_nombre VARCHAR(255),
      doc_anexo_nombre VARCHAR(255),
      anexo_texto TEXT,
      etapa VARCHAR(100),
      tramite VARCHAR(100),
      desc_tramite TEXT,
      fec_tramite DATE,
      foja VARCHAR(20),
      georref VARCHAR(100),
      pdf_demanda_nombre VARCHAR(255),
      pdf_ebook_nombre VARCHAR(255),
      fecha_consulta_actual DATETIME,
      fecha_consulta_anterior DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await connection.query(sql);
  console.log('✅ Tabla pjud_movimientos_intermedia verificada/creada.');
}

/**
 * Escapar valores para SQL seguro
 */
function escapeSQLValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return value;
  // Escapar comillas simples para strings
  const escaped = String(value).replace(/'/g, "''");
  return `'${escaped}'`;
}

/**
 * Generar archivo SQL con los INSERT statements
 */
function guardarSQLEnArchivo(rit, sqlStatements) {
  const sqlDir = path.resolve(__dirname, '..', 'docs', 'sql', 'generados');
  if (!fs.existsSync(sqlDir)) {
    fs.mkdirSync(sqlDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const ritClean = rit.replace(/[^a-zA-Z0-9]/g, '_');
  const sqlFile = path.join(sqlDir, `movimientos_${ritClean}_${timestamp}.sql`);
  
  const sqlContent = [
    `-- ============================================`,
    `-- SQL Generado para RIT: ${rit}`,
    `-- Fecha: ${new Date().toISOString()}`,
    `-- Cantidad de movimientos: ${sqlStatements.length}`,
    `-- ============================================\n`,
    `-- Crear tabla si no existe`,
    `CREATE TABLE IF NOT EXISTS pjud_movimientos_intermedia (`,
    `  id INT AUTO_INCREMENT PRIMARY KEY,`,
    `  rit VARCHAR(50),`,
    `  competencia_id INT,`,
    `  corte_id INT,`,
    `  tribunal_id INT,`,
    `  folio VARCHAR(20),`,
    `  doc_principal_nombre VARCHAR(255),`,
    `  doc_anexo_nombre VARCHAR(255),`,
    `  anexo_texto TEXT,`,
    `  etapa VARCHAR(100),`,
    `  tramite VARCHAR(100),`,
    `  desc_tramite TEXT,`,
    `  fec_tramite DATE,`,
    `  foja VARCHAR(20),`,
    `  georref VARCHAR(100),`,
    `  pdf_demanda_nombre VARCHAR(255),`,
    `  pdf_ebook_nombre VARCHAR(255),`,
    `  fecha_consulta_actual DATETIME,`,
    `  fecha_consulta_anterior DATETIME,`,
    `  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
    `);\n`,
    `-- Insertar movimientos`,
    ...sqlStatements,
    `\n-- ============================================`,
    `-- Fin del archivo SQL`,
    `-- ============================================`
  ].join('\n');
  
  fs.writeFileSync(sqlFile, sqlContent, 'utf-8');
  console.log(`   💾 SQL guardado en: ${path.relative(process.cwd(), sqlFile)}`);
  
  return sqlFile;
}

/**
 * Callbacks registrados que se ejecutarán después de insertar datos
 * Formato: { afterInsert: (movimiento, connection) => Promise<void> }
 */
const callbacks = {
  afterInsert: null,      // Se ejecuta después de cada INSERT individual
  afterBatch: null,       // Se ejecuta después de insertar todos los movimientos de un RIT
  onError: null           // Se ejecuta si hay un error
};

/**
 * Registrar un callback que se ejecutará después de insertar datos
 * @param {string} tipo - Tipo de callback: 'afterInsert', 'afterBatch', 'onError'
 * @param {Function} callback - Función a ejecutar
 */
function registrarCallback(tipo, callback) {
  if (['afterInsert', 'afterBatch', 'onError'].includes(tipo)) {
    callbacks[tipo] = callback;
  } else {
    throw new Error(`Tipo de callback inválido: ${tipo}. Debe ser: afterInsert, afterBatch, onError`);
  }
}

/**
 * Importa los movimientos a la tabla intermedia
 * @param {string} rit - RIT de la causa
 * @param {Object} datosProcesados - Datos procesados de los movimientos
 * @param {Object} configPjud - Configuración del PJUD
 * @param {Object} pdfMapping - Mapeo de PDFs descargados
 * @param {boolean} guardarSQL - Si es true, guarda los INSERT en un archivo .sql
 * @param {string} pdfDemandaNombre - Nombre del archivo PDF de demanda (opcional)
 * @param {string} pdfEbookNombre - Nombre del archivo PDF de ebook (opcional)
 */
async function importarAMovimientosIntermedia(rit, datosProcesados, configPjud, pdfMapping, guardarSQL = false, pdfDemandaNombre = null, pdfEbookNombre = null) {
  let connection;
  const sqlStatements = []; // Array para guardar los SQL generados
  
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    await crearTablaIntermedia(connection);

    const fechaActual = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // Buscar la fecha de la última consulta para este RIT
    const [lastQueryRows] = await connection.query(
      'SELECT fecha_consulta_actual FROM pjud_movimientos_intermedia WHERE rit = ? ORDER BY fecha_consulta_actual DESC LIMIT 1', 
      [rit]
    );
    const fechaAnterior = lastQueryRows.length > 0 ? lastQueryRows[0].fecha_consulta_actual : null;

    // Si no se pasaron los nombres, intentar construirlos desde el RIT
    const ritClean = rit.replace(/[^a-zA-Z0-9]/g, '_');
    const demandaNombre = pdfDemandaNombre || `${ritClean}_demanda.pdf`;
    const ebookNombre = pdfEbookNombre || `${ritClean}_ebook.pdf`;

    console.log(`📥 Importando movimientos para RIT ${rit} a SQL...`);

    for (const mov of datosProcesados.movimientos) {
      // Mapear PDFs del movimiento
      const pdfsMov = pdfMapping[mov.indice] || { azul: null, rojo: null };
      
      // Asegurar que los IDs sean números o NULL para MySQL
      const compId = configPjud.competencia && !isNaN(configPjud.competencia) ? parseInt(configPjud.competencia) : null;
      const corteId = configPjud.corte && !isNaN(configPjud.corte) ? parseInt(configPjud.corte) : null;
      const tribId = configPjud.tribunal && !isNaN(configPjud.tribunal) ? parseInt(configPjud.tribunal) : null;

      // Obtener fecha limpia del objeto de datos procesados
      const fecTramite = mov.fec_tramite || mov.fecha;
      let fechaMySQL = null;
      if (fecTramite && fecTramite.includes('/')) {
        const parts = fecTramite.split('/');
        if (parts.length === 3) {
          fechaMySQL = `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
        }
      }

      const values = [
        rit,
        compId,
        corteId,
        tribId,
        mov.folio || null,
        pdfsMov.azul,
        pdfsMov.rojo,
        mov.anexo || null,
        mov.etapa || null,
        mov.tramite || null,
        mov.desc_tramite || null,
        fechaMySQL,
        mov.foja || null,
        mov.georref || null,
        demandaNombre,
        ebookNombre,
        fechaActual,
        fechaAnterior
      ];

      // Ejecutar SQL contra la base de datos
      const [result] = await connection.query(`
        INSERT INTO pjud_movimientos_intermedia 
        (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, values);
      
      // Ejecutar callback después de insertar cada movimiento
      if (callbacks.afterInsert) {
        try {
          const movimientoInsertado = {
            id: result.insertId,
            rit: values[0],
            competencia_id: values[1],
            corte_id: values[2],
            tribunal_id: values[3],
            folio: values[4],
            doc_principal_nombre: values[5],
            doc_anexo_nombre: values[6],
            anexo_texto: values[7],
            etapa: values[8],
            tramite: values[9],
            desc_tramite: values[10],
            fec_tramite: values[11],
            foja: values[12],
            georref: values[13],
            pdf_demanda_nombre: values[14],
            pdf_ebook_nombre: values[15],
            fecha_consulta_actual: values[16],
            fecha_consulta_anterior: values[17]
          };
          await callbacks.afterInsert(movimientoInsertado, connection);
        } catch (callbackError) {
          console.warn(`⚠️ Error en callback afterInsert: ${callbackError.message}`);
        }
      }
      
      // Si se solicita guardar SQL, construir el statement para el archivo
      if (guardarSQL) {
        const sqlInsert = `INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  ${escapeSQLValue(values[0])},  -- rit
  ${escapeSQLValue(values[1])},  -- competencia_id
  ${escapeSQLValue(values[2])},  -- corte_id
  ${escapeSQLValue(values[3])},  -- tribunal_id
  ${escapeSQLValue(values[4])},  -- folio
  ${escapeSQLValue(values[5])},  -- doc_principal_nombre
  ${escapeSQLValue(values[6])},  -- doc_anexo_nombre
  ${escapeSQLValue(values[7])},  -- anexo_texto
  ${escapeSQLValue(values[8])},  -- etapa
  ${escapeSQLValue(values[9])},  -- tramite
  ${escapeSQLValue(values[10])}, -- desc_tramite
  ${escapeSQLValue(values[11])}, -- fec_tramite
  ${escapeSQLValue(values[12])}, -- foja
  ${escapeSQLValue(values[13])}, -- georref
  ${escapeSQLValue(values[14])}, -- pdf_demanda_nombre
  ${escapeSQLValue(values[15])}, -- pdf_ebook_nombre
  ${escapeSQLValue(values[16])}, -- fecha_consulta_actual
  ${escapeSQLValue(values[17])}  -- fecha_consulta_anterior
);`;
        sqlStatements.push(sqlInsert);
      }
    }
    
    // Guardar SQL en archivo si se solicitó
    if (guardarSQL && sqlStatements.length > 0) {
      guardarSQLEnArchivo(rit, sqlStatements);
    }

    // Ejecutar callback después de insertar todos los movimientos del RIT
    if (callbacks.afterBatch) {
      try {
        await callbacks.afterBatch({
          rit,
          totalMovimientos: datosProcesados.movimientos.length,
          configPjud,
          pdfMapping,
          pdfDemandaNombre,
          pdfEbookNombre
        }, connection);
      } catch (callbackError) {
        console.warn(`⚠️ Error en callback afterBatch: ${callbackError.message}`);
      }
    }

    console.log(`✅ ¡Éxito! ${datosProcesados.movimientos.length} movimientos importados a la tabla intermedia.`);
    
    return true;
  } catch (error) {
    console.error('❌ Error en importación SQL Intermedia:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   💡 Asegúrate de que MySQL/XAMPP esté corriendo en el puerto 3306.');
    }
    
    // Ejecutar callback de error si existe
    if (callbacks.onError) {
      try {
        await callbacks.onError(error, { rit, datosProcesados, configPjud });
      } catch (callbackError) {
        console.warn(`⚠️ Error en callback onError: ${callbackError.message}`);
      }
    }
    
    return false;
  } finally {
    if (connection) await connection.end();
  }
}

module.exports = { 
  importarAMovimientosIntermedia,
  registrarCallback 
};

