const fs = require('fs');
const path = require('path');

function exportToJSON(rows, outputDir, rit) {
  const filename = `resultado_${rit.replace('-', '_')}.json`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(rows, null, 2), 'utf8');
  console.log(`🟢 JSON exportado en: ${filepath}`);
}

function exportToCSV(rows, outputDir, rit) {
  const filename = `resultado_${rit.replace('-', '_')}.csv`;
  const filepath = path.join(outputDir, filename);

  // Convertir matriz de filas a CSV
  const csvContent = rows.map(r => r.join(";")).join("\n");

  fs.writeFileSync(filepath, csvContent, 'utf8');
  console.log(`🟢 CSV exportado en: ${filepath}`);
}

module.exports = {
  exportToJSON,
  exportToCSV
};
