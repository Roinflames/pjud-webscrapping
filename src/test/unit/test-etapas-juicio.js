/**
 * PRUEBAS UNITARIAS - Clasificación de Etapas del Juicio
 * 
 * Tests para verificar la correcta clasificación de movimientos por etapa procesal
 */

const assert = require('assert');

// Mapeo de etapas
const ETAPAS_MAPPING = {
  'Ingreso': 'INGRESO',
  'Inicio de la Tramitación': 'INICIO_TRAMITACION',
  'Notificación demanda y su proveído': 'NOTIFICACION',
  'Notificación': 'NOTIFICACION',
  'Excepciones': 'EXCEPCIONES',
  'Contestación Excepciones': 'CONTESTACION_EXCEPCIONES',
  'Contestación': 'CONTESTACION',
  'Réplica': 'REPLICA',
  'Dúplica': 'DUPLICA',
  'Conciliación': 'CONCILIACION',
  'Probatorio': 'PROBATORIO',
  'Prueba': 'PROBATORIO',
  'Audiencia': 'AUDIENCIA',
  'Discusión': 'DISCUSION',
  'Citación para Oír Sentencia': 'CITACION_SENTENCIA',
  'Sentencia': 'SENTENCIA',
  'Recursos': 'RECURSOS',
  'Apelación': 'RECURSOS',
  'Cumplimiento': 'CUMPLIMIENTO',
  'Terminada': 'TERMINADA',
  'Archivada': 'ARCHIVADA'
};

// Función de clasificación
function clasificarEtapa(tipoMovimiento) {
  if (!tipoMovimiento) return 'SIN_ETAPA';
  
  // Buscar coincidencia exacta primero
  if (ETAPAS_MAPPING[tipoMovimiento]) {
    return ETAPAS_MAPPING[tipoMovimiento];
  }
  
  // Buscar coincidencia parcial (case-insensitive)
  const tipoLower = tipoMovimiento.toLowerCase();
  for (const [key, value] of Object.entries(ETAPAS_MAPPING)) {
    if (tipoLower.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return 'TRAMITACION';
}

// Contadores
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

describe('Clasificación de Etapas - Coincidencia Exacta', () => {
  test('debe clasificar "Ingreso" como INGRESO', () => {
    assert.strictEqual(clasificarEtapa('Ingreso'), 'INGRESO');
  });

  test('debe clasificar "Inicio de la Tramitación" como INICIO_TRAMITACION', () => {
    assert.strictEqual(clasificarEtapa('Inicio de la Tramitación'), 'INICIO_TRAMITACION');
  });

  test('debe clasificar "Notificación" como NOTIFICACION', () => {
    assert.strictEqual(clasificarEtapa('Notificación'), 'NOTIFICACION');
  });

  test('debe clasificar "Excepciones" como EXCEPCIONES', () => {
    assert.strictEqual(clasificarEtapa('Excepciones'), 'EXCEPCIONES');
  });

  test('debe clasificar "Probatorio" como PROBATORIO', () => {
    assert.strictEqual(clasificarEtapa('Probatorio'), 'PROBATORIO');
  });

  test('debe clasificar "Sentencia" como SENTENCIA', () => {
    assert.strictEqual(clasificarEtapa('Sentencia'), 'SENTENCIA');
  });

  test('debe clasificar "Terminada" como TERMINADA', () => {
    assert.strictEqual(clasificarEtapa('Terminada'), 'TERMINADA');
  });
});

describe('Clasificación de Etapas - Coincidencia Parcial', () => {
  test('debe clasificar "Notificación demanda y su proveído" como NOTIFICACION', () => {
    assert.strictEqual(clasificarEtapa('Notificación demanda y su proveído'), 'NOTIFICACION');
  });

  test('debe clasificar textos que contienen "Audiencia" como AUDIENCIA', () => {
    assert.strictEqual(clasificarEtapa('Audiencia Preparatoria'), 'AUDIENCIA');
    assert.strictEqual(clasificarEtapa('Audiencia de Juicio'), 'AUDIENCIA');
  });

  test('debe clasificar "Contestación de Demanda" como CONTESTACION', () => {
    assert.strictEqual(clasificarEtapa('Contestación de Demanda'), 'CONTESTACION');
  });

  test('debe clasificar "Apelación" como RECURSOS', () => {
    assert.strictEqual(clasificarEtapa('Apelación'), 'RECURSOS');
  });
});

describe('Clasificación de Etapas - Casos Especiales', () => {
  test('debe retornar SIN_ETAPA para null', () => {
    assert.strictEqual(clasificarEtapa(null), 'SIN_ETAPA');
  });

  test('debe retornar SIN_ETAPA para undefined', () => {
    assert.strictEqual(clasificarEtapa(undefined), 'SIN_ETAPA');
  });

  test('debe retornar SIN_ETAPA para string vacío', () => {
    assert.strictEqual(clasificarEtapa(''), 'SIN_ETAPA');
  });

  test('debe retornar TRAMITACION para etapas desconocidas', () => {
    assert.strictEqual(clasificarEtapa('Algo Desconocido'), 'TRAMITACION');
    assert.strictEqual(clasificarEtapa('Trámite Especial'), 'TRAMITACION');
  });
});

describe('Clasificación de Etapas - Case Insensitive', () => {
  test('debe clasificar independiente de mayúsculas/minúsculas', () => {
    assert.strictEqual(clasificarEtapa('ingreso'), 'INGRESO');
    assert.strictEqual(clasificarEtapa('INGRESO'), 'INGRESO');
    assert.strictEqual(clasificarEtapa('InGrEsO'), 'INGRESO');
  });

  test('debe retornar TRAMITACION para variaciones sin acento (comportamiento actual)', () => {
    // Nota: actualmente no hay normalización de acentos
    // "Notificacion" sin tilde no coincide con "Notificación"
    assert.strictEqual(clasificarEtapa('Notificacion'), 'TRAMITACION');
  });
});

describe('Flujo Procesal Completo', () => {
  const FLUJO_ESPERADO = [
    { etapa: 'Ingreso', codigo: 'INGRESO' },
    { etapa: 'Inicio de la Tramitación', codigo: 'INICIO_TRAMITACION' },
    { etapa: 'Notificación', codigo: 'NOTIFICACION' },
    { etapa: 'Excepciones', codigo: 'EXCEPCIONES' },
    { etapa: 'Contestación', codigo: 'CONTESTACION' },
    { etapa: 'Conciliación', codigo: 'CONCILIACION' },
    { etapa: 'Probatorio', codigo: 'PROBATORIO' },
    { etapa: 'Discusión', codigo: 'DISCUSION' },
    { etapa: 'Sentencia', codigo: 'SENTENCIA' },
    { etapa: 'Terminada', codigo: 'TERMINADA' }
  ];

  test('debe clasificar correctamente un flujo procesal típico', () => {
    FLUJO_ESPERADO.forEach(({ etapa, codigo }) => {
      const resultado = clasificarEtapa(etapa);
      assert.strictEqual(resultado, codigo, `Etapa "${etapa}" debería ser "${codigo}" pero fue "${resultado}"`);
    });
  });

  test('debe agrupar movimientos por etapa correctamente', () => {
    const movimientos = [
      { indice: 1, etapa: 'Ingreso' },
      { indice: 2, etapa: 'Ingreso' },
      { indice: 3, etapa: 'Notificación' },
      { indice: 4, etapa: 'Probatorio' },
      { indice: 5, etapa: 'Probatorio' },
      { indice: 6, etapa: 'Probatorio' },
      { indice: 7, etapa: 'Sentencia' },
      { indice: 8, etapa: 'Terminada' }
    ];

    const agrupados = {};
    movimientos.forEach(mov => {
      const codigo = clasificarEtapa(mov.etapa);
      if (!agrupados[codigo]) agrupados[codigo] = [];
      agrupados[codigo].push(mov);
    });

    assert.strictEqual(agrupados['INGRESO'].length, 2);
    assert.strictEqual(agrupados['NOTIFICACION'].length, 1);
    assert.strictEqual(agrupados['PROBATORIO'].length, 3);
    assert.strictEqual(agrupados['SENTENCIA'].length, 1);
    assert.strictEqual(agrupados['TERMINADA'].length, 1);
  });
});

describe('Estadísticas por Etapa', () => {
  test('debe calcular estadísticas correctamente', () => {
    const movimientos = [
      { indice: 1, etapa: 'Ingreso', tiene_pdf: true },
      { indice: 2, etapa: 'Ingreso', tiene_pdf: false },
      { indice: 3, etapa: 'Probatorio', tiene_pdf: true },
      { indice: 4, etapa: 'Probatorio', tiene_pdf: true },
      { indice: 5, etapa: 'Terminada', tiene_pdf: false }
    ];

    const stats = {};
    movimientos.forEach(mov => {
      const codigo = clasificarEtapa(mov.etapa);
      if (!stats[codigo]) {
        stats[codigo] = { total: 0, con_pdf: 0 };
      }
      stats[codigo].total++;
      if (mov.tiene_pdf) stats[codigo].con_pdf++;
    });

    assert.strictEqual(stats['INGRESO'].total, 2);
    assert.strictEqual(stats['INGRESO'].con_pdf, 1);
    assert.strictEqual(stats['PROBATORIO'].total, 2);
    assert.strictEqual(stats['PROBATORIO'].con_pdf, 2);
    assert.strictEqual(stats['TERMINADA'].total, 1);
    assert.strictEqual(stats['TERMINADA'].con_pdf, 0);
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

process.exit(failed > 0 ? 1 : 0);
