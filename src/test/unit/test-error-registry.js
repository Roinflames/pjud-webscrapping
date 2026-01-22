/**
 * PRUEBAS UNITARIAS - ErrorRegistry
 * 
 * Tests para el sistema de registro de errores
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Archivo temporal para tests
const TEST_ERRORS_FILE = path.join(__dirname, 'test_errors_temp.json');

// Limpiar archivo de prueba antes de empezar
if (fs.existsSync(TEST_ERRORS_FILE)) {
  fs.unlinkSync(TEST_ERRORS_FILE);
}

/**
 * Sistema de registro de errores (copia para testing)
 */
class ErrorRegistry {
  constructor(filePath) {
    this.filePath = filePath;
    this.errors = this.load();
  }

  load() {
    if (fs.existsSync(this.filePath)) {
      try {
        return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
      } catch (e) {
        return {};
      }
    }
    return {};
  }

  save() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.errors, null, 2), 'utf-8');
  }

  registrar(rit, tipoError, mensaje, stackTrace = null) {
    const key = `${rit}:${tipoError}`;
    if (!this.errors[key]) {
      this.errors[key] = {
        rit,
        tipo_error: tipoError,
        mensaje,
        stack_trace: stackTrace,
        intentos: 0,
        primer_intento: new Date().toISOString(),
        ultimo_intento: null,
        resuelto: false
      };
    }
    this.errors[key].intentos++;
    this.errors[key].ultimo_intento = new Date().toISOString();
    this.errors[key].mensaje = mensaje;
    this.save();
    return this.errors[key];
  }

  debeReintentar(rit, tipoError, maxIntentos = 3) {
    const key = `${rit}:${tipoError}`;
    if (!this.errors[key]) return true;
    if (this.errors[key].resuelto) return true;
    return this.errors[key].intentos < maxIntentos;
  }

  marcarResuelto(rit, tipoError = null) {
    if (tipoError) {
      const key = `${rit}:${tipoError}`;
      if (this.errors[key]) {
        this.errors[key].resuelto = true;
        this.errors[key].fecha_resolucion = new Date().toISOString();
      }
    } else {
      Object.keys(this.errors).forEach(key => {
        if (key.startsWith(`${rit}:`)) {
          this.errors[key].resuelto = true;
          this.errors[key].fecha_resolucion = new Date().toISOString();
        }
      });
    }
    this.save();
  }

  getErroresPendientes() {
    return Object.values(this.errors).filter(e => !e.resuelto);
  }

  getResumen() {
    const errores = Object.values(this.errors);
    return {
      total: errores.length,
      pendientes: errores.filter(e => !e.resuelto).length,
      resueltos: errores.filter(e => e.resuelto).length,
      por_tipo: errores.reduce((acc, e) => {
        acc[e.tipo_error] = (acc[e.tipo_error] || 0) + 1;
        return acc;
      }, {})
    };
  }

  clear() {
    this.errors = {};
    this.save();
  }
}

// Contadores de tests
let passed = 0;
let failed = 0;
const testErrors = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (error) {
    failed++;
    testErrors.push({ name, error: error.message });
    console.log(`  ❌ ${name}: ${error.message}`);
  }
}

function describe(suite, fn) {
  console.log(`\n📋 ${suite}`);
  fn();
}

// ============================================
// TESTS
// ============================================

describe('ErrorRegistry - Inicialización', () => {
  test('debe crear instancia con archivo nuevo', () => {
    const registry = new ErrorRegistry(TEST_ERRORS_FILE);
    assert.ok(registry);
    assert.deepStrictEqual(registry.errors, {});
  });

  test('debe cargar errores existentes', () => {
    // Crear archivo con datos
    const testData = { 'C-TEST-2020:ERROR': { rit: 'C-TEST-2020', intentos: 1 } };
    fs.writeFileSync(TEST_ERRORS_FILE, JSON.stringify(testData));
    
    const registry = new ErrorRegistry(TEST_ERRORS_FILE);
    assert.ok(registry.errors['C-TEST-2020:ERROR']);
  });
});

describe('ErrorRegistry - Registro de Errores', () => {
  const registry = new ErrorRegistry(TEST_ERRORS_FILE);
  registry.clear();

  test('debe registrar nuevo error', () => {
    const result = registry.registrar('C-3030-2017', 'TIMEOUT', 'Timeout esperando selector');
    assert.strictEqual(result.rit, 'C-3030-2017');
    assert.strictEqual(result.tipo_error, 'TIMEOUT');
    assert.strictEqual(result.intentos, 1);
    assert.strictEqual(result.resuelto, false);
  });

  test('debe incrementar intentos en error existente', () => {
    registry.registrar('C-3030-2017', 'TIMEOUT', 'Timeout otra vez');
    const key = 'C-3030-2017:TIMEOUT';
    assert.strictEqual(registry.errors[key].intentos, 2);
  });

  test('debe actualizar mensaje en reintentos', () => {
    registry.registrar('C-3030-2017', 'TIMEOUT', 'Mensaje actualizado');
    const key = 'C-3030-2017:TIMEOUT';
    assert.strictEqual(registry.errors[key].mensaje, 'Mensaje actualizado');
  });

  test('debe guardar stack trace', () => {
    registry.registrar('C-3030-2017', 'EXCEPTION', 'Error', 'Error: at line 1');
    const key = 'C-3030-2017:EXCEPTION';
    assert.strictEqual(registry.errors[key].stack_trace, 'Error: at line 1');
  });
});

describe('ErrorRegistry - Control de Reintentos', () => {
  const registry = new ErrorRegistry(TEST_ERRORS_FILE);
  registry.clear();

  test('debe permitir reintento si no hay errores', () => {
    const result = registry.debeReintentar('C-NUEVO-2020', 'ERROR');
    assert.strictEqual(result, true);
  });

  test('debe permitir reintento si intentos < máximo', () => {
    registry.registrar('C-TEST-2020', 'ERROR', 'Test');
    registry.registrar('C-TEST-2020', 'ERROR', 'Test');
    const result = registry.debeReintentar('C-TEST-2020', 'ERROR', 3);
    assert.strictEqual(result, true);
  });

  test('debe bloquear reintento si intentos >= máximo', () => {
    registry.registrar('C-TEST-2020', 'ERROR', 'Test'); // 3er intento
    const result = registry.debeReintentar('C-TEST-2020', 'ERROR', 3);
    assert.strictEqual(result, false);
  });

  test('debe permitir reintento si error está resuelto', () => {
    registry.marcarResuelto('C-TEST-2020', 'ERROR');
    const result = registry.debeReintentar('C-TEST-2020', 'ERROR', 3);
    assert.strictEqual(result, true);
  });
});

describe('ErrorRegistry - Resolución de Errores', () => {
  const registry = new ErrorRegistry(TEST_ERRORS_FILE);
  registry.clear();

  test('debe marcar error específico como resuelto', () => {
    registry.registrar('C-3030-2017', 'TIMEOUT', 'Test');
    registry.registrar('C-3030-2017', 'PARSE', 'Test');
    
    registry.marcarResuelto('C-3030-2017', 'TIMEOUT');
    
    assert.strictEqual(registry.errors['C-3030-2017:TIMEOUT'].resuelto, true);
    assert.strictEqual(registry.errors['C-3030-2017:PARSE'].resuelto, false);
  });

  test('debe marcar todos los errores de un RIT como resueltos', () => {
    registry.clear();
    registry.registrar('C-3030-2017', 'TIMEOUT', 'Test');
    registry.registrar('C-3030-2017', 'PARSE', 'Test');
    registry.registrar('C-OTRO-2020', 'ERROR', 'Test');
    
    registry.marcarResuelto('C-3030-2017'); // Sin tipo específico
    
    assert.strictEqual(registry.errors['C-3030-2017:TIMEOUT'].resuelto, true);
    assert.strictEqual(registry.errors['C-3030-2017:PARSE'].resuelto, true);
    assert.strictEqual(registry.errors['C-OTRO-2020:ERROR'].resuelto, false);
  });

  test('debe incluir fecha de resolución', () => {
    registry.clear();
    registry.registrar('C-TEST-2020', 'ERROR', 'Test');
    registry.marcarResuelto('C-TEST-2020', 'ERROR');
    
    assert.ok(registry.errors['C-TEST-2020:ERROR'].fecha_resolucion);
  });
});

describe('ErrorRegistry - Consultas', () => {
  const registry = new ErrorRegistry(TEST_ERRORS_FILE);
  registry.clear();

  // Preparar datos
  registry.registrar('C-1-2020', 'TIMEOUT', 'Test');
  registry.registrar('C-2-2020', 'PARSE', 'Test');
  registry.registrar('C-3-2020', 'NETWORK', 'Test');
  registry.marcarResuelto('C-1-2020', 'TIMEOUT');

  test('debe obtener errores pendientes', () => {
    const pendientes = registry.getErroresPendientes();
    assert.strictEqual(pendientes.length, 2);
    assert.ok(pendientes.every(e => !e.resuelto));
  });

  test('debe obtener resumen correcto', () => {
    const resumen = registry.getResumen();
    assert.strictEqual(resumen.total, 3);
    assert.strictEqual(resumen.pendientes, 2);
    assert.strictEqual(resumen.resueltos, 1);
  });

  test('debe agrupar por tipo de error', () => {
    const resumen = registry.getResumen();
    assert.strictEqual(resumen.por_tipo['TIMEOUT'], 1);
    assert.strictEqual(resumen.por_tipo['PARSE'], 1);
    assert.strictEqual(resumen.por_tipo['NETWORK'], 1);
  });
});

describe('ErrorRegistry - Persistencia', () => {
  test('debe persistir cambios en archivo', () => {
    const registry1 = new ErrorRegistry(TEST_ERRORS_FILE);
    registry1.clear();
    registry1.registrar('C-PERSIST-2020', 'ERROR', 'Test persistencia');
    
    // Crear nueva instancia para verificar persistencia
    const registry2 = new ErrorRegistry(TEST_ERRORS_FILE);
    assert.ok(registry2.errors['C-PERSIST-2020:ERROR']);
    assert.strictEqual(registry2.errors['C-PERSIST-2020:ERROR'].mensaje, 'Test persistencia');
  });

  test('debe manejar archivo corrupto gracefully', () => {
    fs.writeFileSync(TEST_ERRORS_FILE, 'invalid json{{{');
    const registry = new ErrorRegistry(TEST_ERRORS_FILE);
    assert.deepStrictEqual(registry.errors, {});
  });
});

// ============================================
// CLEANUP
// ============================================

// Limpiar archivo temporal
if (fs.existsSync(TEST_ERRORS_FILE)) {
  fs.unlinkSync(TEST_ERRORS_FILE);
}

// ============================================
// RESUMEN
// ============================================

console.log('\n' + '='.repeat(50));
console.log('📊 RESUMEN DE PRUEBAS');
console.log('='.repeat(50));
console.log(`✅ Pasaron: ${passed}`);
console.log(`❌ Fallaron: ${failed}`);

if (testErrors.length > 0) {
  console.log('\n📋 Errores detallados:');
  testErrors.forEach(({ name, error }) => {
    console.log(`   - ${name}: ${error}`);
  });
}

console.log('\n' + '='.repeat(50));

process.exit(failed > 0 ? 1 : 0);
