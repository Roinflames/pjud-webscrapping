const fs = require('fs');
const path = require('path');
const { processTableData, exportStructuredJSON, prepareMovimientosForDB } = require('./dataProcessor');

/**
 * Exporta datos en formato JSON estructurado y descriptivo
 * @param {Array} rows - Filas extraídas de la tabla
 * @param {string} outputDir - Directorio de salida
 * @param {string} rit - RIT de la causa
 * @param {Object} pdfMapping - Mapeo de índices de movimiento a nombres de PDF (opcional)
 */
function exportToJSON(rows, outputDir, rit, pdfMapping = {}) {
  // Procesar datos para estructura descriptiva
  const datosProcesados = processTableData(rows, rit, pdfMapping);
  
  // Exportar JSON estructurado (movimientos_*.json)
  exportStructuredJSON(datosProcesados, outputDir, rit);
  
  // También guardar formato crudo para referencia (resultado_*.json)
  const filenameRaw = `resultado_${rit.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
  const filepathRaw = path.join(outputDir, filenameRaw);
  fs.writeFileSync(filepathRaw, JSON.stringify(rows, null, 2), 'utf8');
  
  console.log(`🟢 JSON crudo exportado: ${filenameRaw}`);
}

/**
 * Exporta datos en formato CSV (solo movimientos)
 */
function exportToCSV(rows, outputDir, rit) {
  const datosProcesados = processTableData(rows, rit);
  const filename = `resultado_${rit.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
  const filepath = path.join(outputDir, filename);

  // Crear CSV con encabezados descriptivos
  const headers = ['rit', 'indice', 'fecha', 'tipo_movimiento', 'subtipo_movimiento', 'descripcion', 'folio', 'tiene_pdf', 'caratulado', 'juzgado'];
  
  const csvRows = datosProcesados.movimientos.map(mov => [
    datosProcesados.rit || '',
    mov.indice || '',
    mov.fecha || '',
    mov.tipo_movimiento || '',
    mov.subtipo_movimiento || '',
    (mov.descripcion || '').replace(/;/g, ','), // Reemplazar ; por , en descripción
    mov.folio || '',
    mov.tiene_pdf ? 'SI' : 'NO',
    datosProcesados.cabecera?.caratulado || '',
    datosProcesados.cabecera?.juzgado || ''
  ]);

  const csvContent = [
    headers.join(';'),
    ...csvRows.map(row => row.join(';'))
  ].join('\n');

  fs.writeFileSync(filepath, csvContent, 'utf8');
  console.log(`🟢 CSV estructurado exportado: ${filename}`);
}

// Exportar movimientos estructurados del PJUD
function exportMovimientos(movimientos, outputDir, rit) {
  const filename = `movimientos_${rit.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(movimientos, null, 2), 'utf8');
  console.log(`📋 Movimientos exportados en: ${filepath}`);
}

// Exportar movimientos estructurados del PJUD
function exportMovimientos(movimientos, outputDir, rit) {
  const filename = `movimientos_${rit.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(movimientos, null, 2), 'utf8');
  console.log(`📋 Movimientos exportados en: ${filepath}`);
}

module.exports = {
  exportToJSON,
  exportToCSV,
  exportMovimientos,
  processTableData,
  prepareMovimientosForDB
};
