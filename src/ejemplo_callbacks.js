/**
 * EJEMPLOS DE USO DE CALLBACKS DESPUÉS DE INSERTAR DATOS EN SQL
 * 
 * Este archivo muestra cómo registrar funciones que se ejecutarán
 * automáticamente después de insertar datos en la tabla intermedia.
 */

const { registrarCallback } = require('./importar_intermedia_sql');
const mysql = require('mysql2/promise');

// ============================================
// EJEMPLO 1: Copiar datos a otra tabla después de cada INSERT
// ============================================
registrarCallback('afterInsert', async (movimiento, connection) => {
  console.log(`📋 Procesando movimiento insertado: ID ${movimiento.id}, RIT ${movimiento.rit}`);
  
  // Ejemplo: Copiar a tabla final
  await connection.query(`
    INSERT INTO pjud_movimientos_final 
    (rit, competencia_id, corte_id, folio, etapa, desc_tramite, fec_tramite)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      etapa = VALUES(etapa),
      desc_tramite = VALUES(desc_tramite),
      fec_tramite = VALUES(fec_tramite)
  `, [
    movimiento.rit,
    movimiento.competencia_id,
    movimiento.corte_id,
    movimiento.folio,
    movimiento.etapa,
    movimiento.desc_tramite,
    movimiento.fec_tramite
  ]);
  
  console.log(`   ✅ Movimiento copiado a tabla final`);
});

// ============================================
// EJEMPLO 2: Actualizar estadísticas después de cada INSERT
// ============================================
registrarCallback('afterInsert', async (movimiento, connection) => {
  // Actualizar contador de movimientos por RIT
  await connection.query(`
    INSERT INTO pjud_estadisticas_rit (rit, total_movimientos, ultimo_movimiento_fecha)
    VALUES (?, 1, ?)
    ON DUPLICATE KEY UPDATE
      total_movimientos = total_movimientos + 1,
      ultimo_movimiento_fecha = VALUES(ultimo_movimiento_fecha)
  `, [movimiento.rit, movimiento.fecha_consulta_actual]);
});

// ============================================
// EJEMPLO 3: Detectar y registrar eventos importantes
// ============================================
registrarCallback('afterInsert', async (movimiento, connection) => {
  // Detectar si es un movimiento importante
  const descTramite = (movimiento.desc_tramite || '').toLowerCase();
  let tipoEvento = null;
  
  if (descTramite.includes('demanda')) {
    tipoEvento = 'DEMANDA';
  } else if (descTramite.includes('sentencia')) {
    tipoEvento = 'SENTENCIA';
  } else if (descTramite.includes('terminada') || descTramite.includes('archivo')) {
    tipoEvento = 'TERMINADA';
  } else if (descTramite.includes('audiencia')) {
    tipoEvento = 'AUDIENCIA';
  }
  
  // Si es importante, registrarlo
  if (tipoEvento) {
    await connection.query(`
      INSERT INTO pjud_eventos_importantes 
      (rit, movimiento_id, tipo_evento, desc_tramite, fec_tramite)
      VALUES (?, ?, ?, ?, ?)
    `, [
      movimiento.rit,
      movimiento.id,
      tipoEvento,
      movimiento.desc_tramite,
      movimiento.fec_tramite
    ]);
    
    console.log(`   🎯 Evento importante detectado: ${tipoEvento} para RIT ${movimiento.rit}`);
  }
});

// ============================================
// EJEMPLO 4: Enviar notificación o webhook (ejemplo)
// ============================================
registrarCallback('afterInsert', async (movimiento, connection) => {
  // Ejemplo: Guardar en cola para procesamiento posterior
  if (movimiento.desc_tramite && movimiento.desc_tramite.toLowerCase().includes('sentencia')) {
    await connection.query(`
      INSERT INTO pjud_cola_notificaciones (rit, tipo, movimiento_id, fecha_creacion)
      VALUES (?, 'SENTENCIA', ?, NOW())
    `, [movimiento.rit, movimiento.id]);
    
    console.log(`   📧 Notificación de sentencia agregada a cola para RIT ${movimiento.rit}`);
  }
});

// ============================================
// EJEMPLO 5: Validar y limpiar datos
// ============================================
registrarCallback('afterInsert', async (movimiento, connection) => {
  // Validar que fec_tramite no sea futura
  if (movimiento.fec_tramite) {
    const fechaTramite = new Date(movimiento.fec_tramite);
    const hoy = new Date();
    
    if (fechaTramite > hoy) {
      console.warn(`   ⚠️ Fecha de trámite futura detectada para movimiento ${movimiento.id}`);
      // Opcional: Actualizar la fecha
      await connection.query(`
        UPDATE pjud_movimientos_intermedia 
        SET fec_tramite = ? 
        WHERE id = ?
      `, [hoy.toISOString().split('T')[0], movimiento.id]);
    }
  }
});

// ============================================
// EJEMPLO 6: Callback después de insertar TODOS los movimientos de un RIT
// ============================================
registrarCallback('afterBatch', async (batchInfo, connection) => {
  const { rit, totalMovimientos, configPjud } = batchInfo;
  
  console.log(`\n📊 Resumen del batch para RIT ${rit}:`);
  console.log(`   - Total movimientos: ${totalMovimientos}`);
  console.log(`   - Competencia: ${configPjud.competencia}`);
  console.log(`   - Corte: ${configPjud.corte}`);
  
  // Ejemplo: Actualizar última fecha de scraping para este RIT
  await connection.query(`
    UPDATE causa 
    SET fecha_ultima_consulta = NOW(), 
        total_movimientos = ?
    WHERE rit = ?
  `, [totalMovimientos, rit]);
  
  console.log(`   ✅ Información del RIT actualizada en tabla principal`);
});

// ============================================
// EJEMPLO 7: Manejo de errores
// ============================================
registrarCallback('onError', async (error, context) => {
  const { rit, datosProcesados } = context;
  
  console.error(`\n❌ Error al procesar RIT ${rit}:`);
  console.error(`   - Error: ${error.message}`);
  console.error(`   - Movimientos intentados: ${datosProcesados?.movimientos?.length || 0}`);
  
  // Ejemplo: Registrar error en tabla de logs
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'codi_ejamtest',
    port: 3306
  });
  
  try {
    await connection.query(`
      INSERT INTO pjud_errores_scraping 
      (rit, error_message, movimientos_intentados, fecha_error)
      VALUES (?, ?, ?, NOW())
    `, [rit, error.message, datosProcesados?.movimientos?.length || 0]);
  } catch (err) {
    console.error(`   ⚠️ No se pudo registrar el error en BD: ${err.message}`);
  } finally {
    await connection.end();
  }
});

// ============================================
// NOTAS IMPORTANTES
// ============================================
// 1. Puedes registrar múltiples callbacks del mismo tipo
// 2. Los callbacks se ejecutan en el orden en que se registran
// 3. Si un callback falla, se registra un warning pero no detiene el proceso
// 4. Los callbacks reciben la conexión de MySQL para hacer queries adicionales
// 5. Usa try-catch dentro de tus callbacks para manejar errores
// ============================================

module.exports = {
  // Exportar para que otros archivos puedan usar estos callbacks
  // O simplemente require este archivo al inicio de tu script principal
};


