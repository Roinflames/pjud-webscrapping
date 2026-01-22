/**
 * RUNNER DE PRUEBAS UNITARIAS
 * 
 * Ejecuta todas las pruebas del proyecto
 * 
 * Uso:
 *   node src/test/run-tests.js
 *   node src/test/run-tests.js --only=data-processor
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const TESTS_DIR = path.join(__dirname, 'unit');

// Obtener argumentos
const args = process.argv.slice(2);
const onlyTest = args.find(a => a.startsWith('--only='))?.split('=')[1];

console.log('\n' + '='.repeat(60));
console.log('🧪 EJECUTANDO PRUEBAS UNITARIAS');
console.log('='.repeat(60));

// Obtener lista de archivos de test
let testFiles = fs.readdirSync(TESTS_DIR)
  .filter(f => f.startsWith('test-') && f.endsWith('.js'));

if (onlyTest) {
  testFiles = testFiles.filter(f => f.includes(onlyTest));
  if (testFiles.length === 0) {
    console.error(`❌ No se encontraron tests que coincidan con: ${onlyTest}`);
    process.exit(1);
  }
}

console.log(`\n📋 Tests a ejecutar: ${testFiles.length}`);
testFiles.forEach(f => console.log(`   - ${f}`));

const results = {
  passed: 0,
  failed: 0,
  errors: []
};

// Ejecutar cada archivo de test
for (const testFile of testFiles) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`🔬 Ejecutando: ${testFile}`);
  console.log('─'.repeat(60));
  
  const testPath = path.join(TESTS_DIR, testFile);
  
  try {
    execSync(`node "${testPath}"`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    results.passed++;
  } catch (error) {
    results.failed++;
    results.errors.push({
      file: testFile,
      exitCode: error.status
    });
  }
}

// Resumen final
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN GLOBAL');
console.log('='.repeat(60));
console.log(`\n📁 Archivos de test: ${testFiles.length}`);
console.log(`✅ Exitosos: ${results.passed}`);
console.log(`❌ Fallidos: ${results.failed}`);

if (results.errors.length > 0) {
  console.log('\n⚠️ Tests con errores:');
  results.errors.forEach(({ file, exitCode }) => {
    console.log(`   - ${file} (exit code: ${exitCode})`);
  });
}

console.log('\n' + '='.repeat(60));

// Exit con código apropiado
process.exit(results.failed > 0 ? 1 : 0);
