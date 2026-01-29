#!/usr/bin/env node

/**
 * Scheduler Worker - Re-scrapea todas las causas de la BD cada 10 minutos
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { query } = require('./database/db-mariadb');
const { processMultipleCausas } = require('./process-causas');
const { sendCompletionEmail, checkEmailConfig } = require('./notifications/email-notifier');

const INTERVAL_MS = 10 * 60 * 1000; // 10 minutos
const STATUS_FILE = require('os').tmpdir() + '/pjud_scheduler_status.json';

let isRunning = false;
let currentIteration = 0;
let lastRun = null;
let nextRun = null;

async function updateStatus(status) {
  const statusData = {
    running: isRunning,
    iteration: currentIteration,
    lastRun: lastRun,
    nextRun: nextRun,
    ...status
  };

  fs.writeFileSync(STATUS_FILE, JSON.stringify(statusData, null, 2));
  console.log(`📊 Status actualizado: ${JSON.stringify(statusData)}`);
}

async function getAllCausasFromDB() {
  try {
    const causas = await query('SELECT rit, caratulado, tribunal_nombre FROM causas ORDER BY rit');
    return causas.map(c => ({
      rit: c.rit,
      caratulado: c.caratulado,
      tribunal: '276', // Tribunal por defecto para que no se descarte
      competencia: '3' // Civil
    }));
  } catch (error) {
    console.error('❌ Error obteniendo causas de BD:', error.message);
    return [];
  }
}

async function runScheduler() {
  if (isRunning) {
    console.log('⚠️ Scheduler ya está ejecutándose, saltando iteración...');
    return;
  }

  isRunning = true;
  currentIteration++;
  const inicioEjecucion = new Date();
  lastRun = inicioEjecucion.toISOString();
  nextRun = new Date(Date.now() + INTERVAL_MS).toISOString();

  console.log(`\n🔄 ========== SCHEDULER ITERACIÓN ${currentIteration} ==========`);
  console.log(`⏰ Iniciado: ${lastRun}`);
  console.log(`⏰ Próxima ejecución: ${nextRun}`);

  await updateStatus({
    status: 'running',
    message: `Scrapeando todas las causas (iteración ${currentIteration})`
  });

  try {
    // Obtener todas las causas de la BD
    const causas = await getAllCausasFromDB();

    if (causas.length === 0) {
      console.log('⚠️ No hay causas en la BD para procesar');
      await updateStatus({
        status: 'idle',
        message: 'No hay causas en la BD',
        error: null
      });
      isRunning = false;
      return;
    }

    console.log(`📋 Se van a re-scrapear ${causas.length} causas`);

    // Procesar todas las causas
    await processMultipleCausas(causas);

    console.log(`✅ Scheduler completado exitosamente`);
    console.log(`⏰ Próxima ejecución en 10 minutos: ${nextRun}`);

    await updateStatus({
      status: 'idle',
      message: `Última ejecución exitosa: ${causas.length} causas`,
      causasProcessed: causas.length,
      error: null
    });

  } catch (error) {
    console.error(`❌ Error en scheduler:`, error.message);
    console.error(error.stack);

    await updateStatus({
      status: 'error',
      message: `Error: ${error.message}`,
      error: error.message
    });
  } finally {
    isRunning = false;
  }
}

// Iniciar scheduler
console.log('🚀 Iniciando Scheduler Worker - Re-scraping cada 10 minutos');
console.log(`📁 Status file: ${STATUS_FILE}`);

// Ejecutar inmediatamente la primera vez
updateStatus({
  status: 'starting',
  message: 'Scheduler iniciando...'
});

console.log('⏰ Primera ejecución en 5 segundos...');
setTimeout(() => {
  runScheduler();

  // Luego ejecutar cada 10 minutos
  setInterval(runScheduler, INTERVAL_MS);
}, 5000);

// Mantener el proceso vivo
process.on('SIGINT', async () => {
  console.log('\n🛑 Deteniendo scheduler...');
  await updateStatus({
    status: 'stopped',
    message: 'Scheduler detenido manualmente'
  });
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Deteniendo scheduler...');
  await updateStatus({
    status: 'stopped',
    message: 'Scheduler detenido manualmente'
  });
  process.exit(0);
});

console.log('✅ Scheduler Worker en ejecución');
console.log('   Presiona Ctrl+C para detener');
