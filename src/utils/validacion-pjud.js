/**
 * Validación Estricta de Datos PJUD
 * 
 * Valida que una causa tenga los 6 datos requeridos del PJUD:
 * 1. competencia
 * 2. corte
 * 3. tribunal
 * 4. tipoCausa
 * 5. rol (del RIT)
 * 6. año (del RIT)
 * 
 * También valida caratulado (opcional pero recomendado)
 */

/**
 * Validar que el RIT tenga formato correcto y extraer rol y año
 */
function validarYExtraerRIT(rit) {
  if (!rit || typeof rit !== 'string' || rit.trim() === '') {
    return { valido: false, error: 'RIT faltante o vacío' };
  }

  const ritTrimmed = rit.trim();
  
  // Validar que no sea texto inválido
  const ritUpper = ritTrimmed.toUpperCase();
  if (ritUpper.includes('SIN ROL') || 
      ritUpper.includes('SIN RIT') || 
      ritTrimmed === '.' ||
      ritTrimmed.length < 5) {
    return { valido: false, error: `RIT inválido: "${ritTrimmed}"` };
  }

  // Formato esperado: TIPO-ROL-AÑO (ej: C-13786-2018) o ROL-AÑO (ej: 16707-2019)
  const partes = ritTrimmed.split('-');
  
  if (partes.length < 2) {
    return { valido: false, error: `RIT formato inválido: "${ritTrimmed}" (debe ser TIPO-ROL-AÑO o ROL-AÑO)` };
  }

  let tipoCausa, rol, año;

  if (partes.length === 3) {
    // Formato: TIPO-ROL-AÑO (ej: C-13786-2018)
    tipoCausa = partes[0].trim();
    rol = partes[1].trim();
    año = partes[2].trim();
  } else if (partes.length === 2) {
    // Formato: ROL-AÑO (ej: 16707-2019)
    tipoCausa = 'C'; // Default para civil
    rol = partes[0].trim();
    año = partes[1].trim();
  } else {
    return { valido: false, error: `RIT formato inválido: "${ritTrimmed}"` };
  }

  // Validar que rol y año sean numéricos
  if (!rol || !/^\d+$/.test(rol)) {
    return { valido: false, error: `Rol inválido en RIT: "${ritTrimmed}"` };
  }

  if (!año || !/^\d{4}$/.test(año)) {
    return { valido: false, error: `Año inválido en RIT: "${ritTrimmed}" (debe ser 4 dígitos)` };
  }

  return {
    valido: true,
    rit: ritTrimmed,
    tipoCausa,
    rol,
    año: parseInt(año, 10)
  };
}

/**
 * Validar que una causa tenga todos los datos requeridos del PJUD
 * 
 * @param {Object} causa - Objeto con datos de la causa
 * @returns {Object} - { valida: boolean, errores: string[], datos: Object }
 */
function validarDatosPJUDCompletos(causa) {
  const errores = [];
  const datos = {};

  // 1. Validar RIT y extraer rol y año
  const ritValidado = validarYExtraerRIT(causa.rit || causa.id_causa);
  if (!ritValidado.valido) {
    errores.push(ritValidado.error);
  } else {
    datos.rit = ritValidado.rit;
    datos.rol = ritValidado.rol;
    datos.año = ritValidado.año;
    datos.tipoCausa = ritValidado.tipoCausa;
  }

  // 2. Validar competencia (requerido)
  const competencia = causa.competencia || causa.materia_estrategia_id || causa.competencia_id;
  if (!competencia || competencia === '' || competencia === 'NULL' || competencia === null) {
    errores.push('Competencia faltante');
  } else {
    datos.competencia = String(competencia).trim();
  }

  // 3. Validar corte (requerido)
  const corte = causa.corte || causa.corte_id;
  if (!corte || corte === '' || corte === 'NULL' || corte === null) {
    errores.push('Corte faltante');
  } else {
    datos.corte = String(corte).trim();
  }

  // 4. Validar tribunal (requerido)
  const tribunal = causa.tribunal || causa.juzgado_cuenta_id || causa.tribunal_id || causa.juzgado_id;
  if (!tribunal || tribunal === '' || tribunal === 'NULL' || tribunal === null) {
    errores.push('Tribunal faltante');
  } else {
    datos.tribunal = String(tribunal).trim();
  }

  // 5. Validar tipoCausa (ya extraído del RIT, pero verificar si viene explícito)
  if (causa.tipoCausa || causa.letra) {
    datos.tipoCausa = (causa.tipoCausa || causa.letra).trim();
  }

  // 6. Validar caratulado (opcional pero recomendado)
  const caratulado = causa.caratulado || causa.causa_nombre;
  if (!caratulado || caratulado === '' || caratulado === 'NULL' || caratulado === null) {
    errores.push('Caratulado faltante (recomendado)');
  } else {
    datos.caratulado = String(caratulado).trim();
  }

  // Verificar que tenemos los 6 datos requeridos
  const tieneTodosLosDatos = 
    datos.rit && 
    datos.rol && 
    datos.año && 
    datos.competencia && 
    datos.corte && 
    datos.tribunal;

  return {
    valida: tieneTodosLosDatos && errores.length === 0,
    errores,
    datos: tieneTodosLosDatos ? datos : null,
    tieneCaratulado: !!datos.caratulado
  };
}

/**
 * Validar datos antes de agregar a la cola de scraping
 * 
 * @param {Object} causa - Datos de la causa
 * @returns {Object} - { puedeProcesar: boolean, motivo: string, config: Object }
 */
function validarParaScraping(causa) {
  const validacion = validarDatosPJUDCompletos(causa);

  if (!validacion.valida) {
    return {
      puedeProcesar: false,
      motivo: `Datos incompletos: ${validacion.errores.join(', ')}`,
      errores: validacion.errores
    };
  }

  // Preparar configuración para scraping
  const config = {
    rit: validacion.datos.rit,
    competencia: validacion.datos.competencia,
    corte: validacion.datos.corte,
    tribunal: validacion.datos.tribunal,
    tipoCausa: validacion.datos.tipoCausa,
    // Metadatos adicionales
    caratulado: validacion.datos.caratulado || null,
    causa_id: causa.causa_id || causa.id || null,
    agenda_id: causa.agenda_id || null
  };

  return {
    puedeProcesar: true,
    motivo: 'Datos completos',
    config,
    tieneCaratulado: validacion.tieneCaratulado
  };
}

module.exports = {
  validarDatosPJUDCompletos,
  validarYExtraerRIT,
  validarParaScraping
};
