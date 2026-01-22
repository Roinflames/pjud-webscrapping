const fs = require('fs');
const path = require('path');

const STATE_FILE = path.resolve(__dirname, 'rit_state.json');

/**
 * Obtiene el último RIT procesado desde el archivo de estado
 */
function getLastRit() {
  if (!fs.existsSync(STATE_FILE)) {
    return null;
  }

  try {
    const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    return data.lastRit || null;
  } catch (error) {
    console.warn('⚠️ Error leyendo archivo de estado:', error.message);
    return null;
  }
}

/**
 * Guarda el último RIT procesado
 */
function saveLastRit(rit) {
  try {
    const data = {
      lastRit: rit,
      lastUpdate: new Date().toISOString()
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('❌ Error guardando estado:', error.message);
  }
}

/**
 * Resetea el estado (elimina el archivo)
 */
function resetState() {
  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
    console.log('✅ Estado reseteado');
  }
}

module.exports = { getLastRit, saveLastRit, resetState };
