const fs = require('fs');
const path = require('path');

function exportToJSON(rows, outputDir, rit) {
  const filename = `resultado_${rit.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(rows, null, 2), 'utf8');
  console.log(`🟢 JSON exportado en: ${filepath}`);
}

function exportToCSV(rows, outputDir, rit) {
  const filename = `resultado_${rit.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
  const filepath = path.join(outputDir, filename);

  // Convertir matriz de filas a CSV
  const csvContent = rows.map(r => r.join(";")).join("\n");

  fs.writeFileSync(filepath, csvContent, 'utf8');
  console.log(`🟢 CSV exportado en: ${filepath}`);
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
  exportMovimientos
};
