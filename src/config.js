const fs = require('fs');
const path = require('path');

function loadConfig() {
  const jsonPath = path.resolve(__dirname, 'config/pjud_config.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`No se encontró el archivo: ${jsonPath}`);
  }
  return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
}

module.exports = { loadConfig };
