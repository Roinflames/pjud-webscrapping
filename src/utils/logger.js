const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);

const logFile = path.join(LOG_DIR, `run_${new Date().toISOString().replace(/[:.]/g, '-')}.log`);

function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${type}] ${message}\n`;
  fs.appendFileSync(logFile, line);
  console.log(line.trim());
}

module.exports = { log };
