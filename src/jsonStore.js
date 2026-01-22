const fs = require("fs");
const path = require("path");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function ritToFileBase(rit) {
  return String(rit || "SIN_RIT").replace(/[^a-zA-Z0-9]/g, "_");
}

/**
 * Guarda 1 JSON por causa en outputs/causas/{RIT}.json
 */
function saveCausaJSON(baseOutputDir, rit, payload) {
  const causasDir = path.join(baseOutputDir, "causas");
  ensureDir(causasDir);

  const fileBase = ritToFileBase(rit);
  const filePath = path.join(causasDir, `${fileBase}.json`);

  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
  return filePath;
}

/**
 * (Opcional) append a NDJSON: outputs/causas.ndjson
 */
function appendCausaNDJSON(baseOutputDir, payload) {
  ensureDir(baseOutputDir);
  const filePath = path.join(baseOutputDir, "causas.ndjson");
  fs.appendFileSync(filePath, JSON.stringify(payload) + "\n", "utf8");
  return filePath;
}

/**
 * (Opcional) índice liviano outputs/index.json (para búsquedas rápidas)
 */
function upsertIndex(baseOutputDir, item) {
  ensureDir(baseOutputDir);
  const indexPath = path.join(baseOutputDir, "index.json");

  let index = [];
  if (fs.existsSync(indexPath)) {
    try { 
      index = JSON.parse(fs.readFileSync(indexPath, "utf8")); 
    } catch (_) {
      // Si el archivo está corrupto, empezar de nuevo
      index = [];
    }
  }

  // reemplazar por rit si existe
  index = index.filter(x => x.rit !== item.rit);
  index.push(item);

  // Ordenar por fecha de procesamiento (más recientes primero)
  index.sort((a, b) => {
    const dateA = new Date(a.processed_at || 0);
    const dateB = new Date(b.processed_at || 0);
    return dateB - dateA;
  });

  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), "utf8");
  return indexPath;
}

module.exports = { saveCausaJSON, appendCausaNDJSON, upsertIndex };
