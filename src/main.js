// Orquestador del flujo
require('dotenv').config();
const { log } = require('./utils/logger');

async function runScript(scriptPath) {
  try {
    log(`Iniciando ${scriptPath}...`);
    const { spawn } = require('child_process');
    return new Promise((resolve, reject) => {
      const process = spawn('node', [scriptPath], { stdio: 'pipe' });

      process.stdout.on('data', (data) => log(data.toString().trim()));
      process.stderr.on('data', (data) => log(data.toString().trim(), 'ERROR'));

      process.on('close', (code) => {
        if (code === 0) {
          log(`✅ Finalizó correctamente: ${scriptPath}`);
          resolve(true);
        } else {
          log(`❌ Error en ${scriptPath} (code ${code})`, 'ERROR');
          reject(new Error(`Script failed: ${scriptPath}`));
        }
      });
    });
  } catch (error) {
    log(`Error al ejecutar ${scriptPath}: ${error.message}`, 'ERROR');
    throw error;
  }
}

(async () => {
  log('=== 🚀 Inicio del flujo RPA ===');

  try {
    // Paso 1:
    await runScript('./ejam_rpa.js');

    // Paso 2: Buscar y descargar ebook en PJUD
    // await runScript('./pjud_search.js');

    // Paso 3: Crear nuevo caso en LegalFlow
    // await runScript('./legalflow_rpa.js');

    log('🎯 Flujo completo ejecutado exitosamente.');
  } catch (error) {
    log(`💥 Flujo interrumpido: ${error.message}`, 'ERROR');
  } finally {
    log('=== 🧾 Fin del flujo RPA ===');
  }
})();

