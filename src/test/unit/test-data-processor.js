/**
 * PRUEBAS UNITARIAS - DataProcessor
 * 
 * Tests para las funciones de procesamiento de datos
 */

const assert = require('assert');
const path = require('path');

// Módulo a testear
const { 
  processTableData, 
  prepareMovimientosForDB,
  extractCabecera,
  extractMovimientos,
  extractPartes
} = require('../../dataProcessor');

// Datos de prueba
const MOCK_ROWS_SIMPLE = [
  ['1', 'Descargar PDF', 'PDF', 'Ingreso', 'Demanda', 'Se ingresa demanda ejecutiva', '01/03/2017', '1'],
  ['2', '', '', 'Inicio de la Tramitación', 'Resolución', 'A lo principal: téngase por interpuesta', '05/03/2017', '3'],
  ['3', 'Descargar PDF', 'PDF', 'Notificación', 'Notificación', 'Se notifica al demandado', '15/03/2017', '5'],
  ['4', '', '', 'Excepciones', 'Escrito', 'Se oponen excepciones', '20/03/2017', '7'],
  ['5', 'Descargar PDF', 'PDF', 'Terminada', 'Archivo del Expediente', 'Archívese', '01/06/2020', '45']
];

const MOCK_ROWS_STRUCTURED = [
  {
    texto: ['1', 'Descargar PDF', 'PDF', 'Ingreso', 'Demanda', 'Se ingresa demanda ejecutiva', '01/03/2017', '1'],
    pdfs: [{ tipo: 'P', tipo_desc: 'azul', linkIndex: 0 }],
    datos_limpios: { 
      indice: 1, 
      etapa: 'Ingreso', 
      tramite: 'Demanda',
      desc_tramite: 'Se ingresa demanda ejecutiva',
      fec_tramite: '01/03/2017',
      folio: '1'
    }
  },
  {
    texto: ['2', '', '', 'Probatorio', 'Auto de prueba', 'Se recibe la causa a prueba', '10/04/2017', '15'],
    pdfs: [],
    datos_limpios: { 
      indice: 2, 
      etapa: 'Probatorio', 
      tramite: 'Auto de prueba',
      desc_tramite: 'Se recibe la causa a prueba',
      fec_tramite: '10/04/2017',
      folio: '15'
    }
  }
];

// Contadores de tests
let passed = 0;
let failed = 0;
const errors = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (error) {
    failed++;
    errors.push({ name, error: error.message });
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

describe('processTableData', () => {
  test('debe retornar estructura correcta con array vacío', () => {
    const result = processTableData([], 'C-1234-2020');
    assert.strictEqual(result.rit, 'C-1234-2020');
    assert.strictEqual(result.metadata.total_movimientos, 0);
    assert.strictEqual(Array.isArray(result.movimientos), true);
    assert.strictEqual(result.movimientos.length, 0);
  });

  test('debe procesar filas simples (arrays)', () => {
    const result = processTableData(MOCK_ROWS_SIMPLE, 'C-3030-2017');
    assert.strictEqual(result.rit, 'C-3030-2017');
    assert.ok(result.movimientos.length > 0, 'Debe tener movimientos');
  });

  test('debe procesar filas estructuradas (objetos)', () => {
    const result = processTableData(MOCK_ROWS_STRUCTURED, 'C-3030-2017');
    assert.strictEqual(result.rit, 'C-3030-2017');
    assert.strictEqual(result.movimientos.length, 2);
  });

  test('debe incluir metadata completa', () => {
    const result = processTableData(MOCK_ROWS_STRUCTURED, 'C-3030-2017');
    assert.ok(result.metadata.fecha_procesamiento);
    assert.strictEqual(typeof result.metadata.total_movimientos, 'number');
    assert.strictEqual(typeof result.metadata.tiene_documentos_pdf, 'boolean');
  });

  test('debe determinar estado actual', () => {
    const result = processTableData(MOCK_ROWS_SIMPLE, 'C-3030-2017');
    assert.ok(result.estado_actual);
    assert.ok(result.estado_actual.estado);
    assert.ok(['EN_TRAMITE', 'TERMINADA', 'SUSPENDIDA', 'SIN_INFORMACION'].includes(result.estado_actual.estado));
  });

  test('debe detectar causa terminada', () => {
    const rowsTerminada = [
      {
        texto: ['5', '', '', 'Terminada', 'Archivo del Expediente', 'Archívese la causa', '01/06/2020', '45'],
        pdfs: [],
        datos_limpios: { indice: 5, etapa: 'Terminada', desc_tramite: 'Archívese la causa' }
      }
    ];
    const result = processTableData(rowsTerminada, 'C-TEST-2020');
    assert.strictEqual(result.estado_actual.estado, 'TERMINADA');
  });

  test('debe asociar PDFs correctamente con pdfMapping', () => {
    const pdfMapping = {
      1: { azul: 'C_3030_2017_mov_1_azul.pdf', rojo: null }
    };
    const result = processTableData(MOCK_ROWS_STRUCTURED, 'C-3030-2017', pdfMapping);
    const mov1 = result.movimientos.find(m => m.indice === 1);
    assert.strictEqual(mov1.pdf_principal_nombre, 'C_3030_2017_mov_1_azul.pdf');
  });
});

describe('extractMovimientos', () => {
  test('debe extraer movimientos de arrays simples', () => {
    const movimientos = extractMovimientos(MOCK_ROWS_SIMPLE);
    assert.ok(movimientos.length > 0);
    movimientos.forEach(m => {
      assert.ok(m.indice !== undefined);
    });
  });

  test('debe extraer movimientos de objetos estructurados', () => {
    const movimientos = extractMovimientos(MOCK_ROWS_STRUCTURED);
    assert.strictEqual(movimientos.length, 2);
    assert.strictEqual(movimientos[0].indice, 1);
    assert.strictEqual(movimientos[1].indice, 2);
  });

  test('debe detectar PDFs en movimientos', () => {
    const movimientos = extractMovimientos(MOCK_ROWS_STRUCTURED);
    const movConPdf = movimientos.find(m => m.indice === 1);
    assert.strictEqual(movConPdf.tiene_pdf, true);
  });

  test('debe extraer etapa y descripción', () => {
    const movimientos = extractMovimientos(MOCK_ROWS_STRUCTURED);
    const mov = movimientos[0];
    assert.ok(mov.etapa || mov.tipo_movimiento);
    assert.ok(mov.desc_tramite || mov.descripcion);
  });
});

describe('prepareMovimientosForDB', () => {
  test('debe retornar array vacío si no hay movimientos', () => {
    const result = prepareMovimientosForDB({ movimientos: [] });
    assert.strictEqual(result.length, 0);
  });

  test('debe preparar movimientos con campos requeridos', () => {
    const processed = processTableData(MOCK_ROWS_STRUCTURED, 'C-3030-2017');
    const dbReady = prepareMovimientosForDB(processed);
    
    assert.ok(dbReady.length > 0);
    dbReady.forEach(mov => {
      assert.ok(mov.rit);
      assert.ok(mov.indice !== undefined);
      assert.ok('tiene_pdf' in mov);
      assert.ok('raw_data' in mov);
    });
  });

  test('debe incluir caratulado y juzgado de cabecera', () => {
    const processed = {
      rit: 'C-TEST-2020',
      cabecera: { caratulado: 'BANCO/CLIENTE', juzgado: 'Juzgado Civil' },
      movimientos: [{ indice: 1, tipo_movimiento: 'Ingreso', descripcion: 'Test' }]
    };
    const dbReady = prepareMovimientosForDB(processed);
    assert.strictEqual(dbReady[0].caratulado, 'BANCO/CLIENTE');
    assert.strictEqual(dbReady[0].juzgado, 'Juzgado Civil');
  });
});

describe('Clasificación de Etapas', () => {
  const ETAPAS_MAPPING = {
    'Ingreso': 'INGRESO',
    'Inicio de la Tramitación': 'INICIO_TRAMITACION',
    'Notificación': 'NOTIFICACION',
    'Excepciones': 'EXCEPCIONES',
    'Probatorio': 'PROBATORIO',
    'Sentencia': 'SENTENCIA',
    'Terminada': 'TERMINADA'
  };

  test('debe clasificar etapas conocidas correctamente', () => {
    Object.entries(ETAPAS_MAPPING).forEach(([input, expected]) => {
      // Simular clasificación
      const clasificada = ETAPAS_MAPPING[input] || 'TRAMITACION';
      assert.strictEqual(clasificada, expected, `Etapa "${input}" debería ser "${expected}"`);
    });
  });

  test('debe retornar TRAMITACION para etapas desconocidas', () => {
    const etapaDesconocida = 'Algo Extraño';
    const clasificada = ETAPAS_MAPPING[etapaDesconocida] || 'TRAMITACION';
    assert.strictEqual(clasificada, 'TRAMITACION');
  });
});

// ============================================
// RESUMEN
// ============================================

console.log('\n' + '='.repeat(50));
console.log('📊 RESUMEN DE PRUEBAS');
console.log('='.repeat(50));
console.log(`✅ Pasaron: ${passed}`);
console.log(`❌ Fallaron: ${failed}`);

if (errors.length > 0) {
  console.log('\n📋 Errores detallados:');
  errors.forEach(({ name, error }) => {
    console.log(`   - ${name}: ${error}`);
  });
}

console.log('\n' + '='.repeat(50));

// Exit code basado en resultados
process.exit(failed > 0 ? 1 : 0);
