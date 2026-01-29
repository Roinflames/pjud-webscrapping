#!/usr/bin/env node

// Script para scrapear una sola causa específica
require('dotenv').config();
const { readCausaCSV } = require('./read-csv');
const { processMultipleCausas } = require('./process-causas');

// Parsear argumentos
const args = process.argv.slice(2);
let targetRit = null;

for (const arg of args) {
  if (arg.startsWith('--rit=')) {
    targetRit = arg.substring(6);
  }
}

if (!targetRit) {
  console.error('❌ Error: Debes especificar --rit=C-XXXXX-XXXX');
  process.exit(1);
}

console.log(`🎯 Buscando causa: ${targetRit} en CSV...`);

// Leer CSV y buscar la causa
const causas = readCausaCSV();
const causasFiltradas = causas.filter(c => c.rit === targetRit);

if (causasFiltradas.length === 0) {
  console.error(`❌ Error: Causa ${targetRit} no encontrada en CSV`);
  process.exit(1);
}

const causa = causasFiltradas[0];
console.log(`✅ Causa encontrada: ${causa.caratulado || 'Sin caratulado'}`);
console.log(`📋 Tribunal ID: ${causa.tribunal || 'N/A'}`);

// Ejecutar el procesamiento de esta única causa
(async () => {
  try {
    await processMultipleCausas(causasFiltradas);
    console.log(`\n✅ Scraping completado exitosamente`);
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Error en scraping:`, error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
