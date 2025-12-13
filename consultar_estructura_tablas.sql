-- ============================================
-- CONSULTAS PARA ENTENDER ESTRUCTURA DE DATOS
-- Un registro completo de cada tabla sin NULL
-- ============================================

USE codi_ejamtest;

-- ============================================
-- TABLA 1: accion
-- ============================================
SELECT 
    id,
    empresa_id,
    nombre,
    accion
FROM accion
WHERE id IS NOT NULL
  AND empresa_id IS NOT NULL
  AND nombre IS NOT NULL
  AND nombre != ''
  AND accion IS NOT NULL
  AND accion != ''
ORDER BY id
LIMIT 5;

-- ============================================
-- TABLA 2: actuacion
-- ============================================
SELECT 
    id,
    cuaderno_id,
    nombre
FROM actuacion
WHERE id IS NOT NULL
  AND cuaderno_id IS NOT NULL
  AND nombre IS NOT NULL
  AND nombre != ''
ORDER BY id
LIMIT 5;

-- ============================================
-- TABLA 3: actuacion_anexo_procesal
-- ============================================
SELECT 
    id,
    actuacion_id,
    anexo_procesal_id
FROM actuacion_anexo_procesal
WHERE id IS NOT NULL
  AND actuacion_id IS NOT NULL
  AND anexo_procesal_id IS NOT NULL
ORDER BY id
LIMIT 5;

-- ============================================
-- TABLA 4: agenda
-- ============================================
SELECT 
    id,
    cuenta_id,
    gestionar_id,
    agendador_id,
    sucursal_id,
    campania,
    nombre_cliente,
    email_cliente,
    telefono_cliente,
    ciudad_cliente,
    fecha_carga,
    fecha_asignado,
    status_id,
    detalle_cliente,
    abogado_id,
    monto,
    reunion_id,
    observacion,
    rut_cliente,
    telefono_recado_cliente,
    fecha_contrato,
    lead,
    form_id,
    agenda_contacto_id,
    pago_actual,
    sub_status_id,
    canal_id,
    fecha_seguimiento,
    obs_formulario,
    id_ghl
FROM agenda
WHERE id IS NOT NULL
  AND nombre_cliente IS NOT NULL
  AND nombre_cliente != ''
  AND rut_cliente IS NOT NULL
  AND rut_cliente != ''
ORDER BY id
LIMIT 5;

-- ============================================
-- TABLA 5: causa
-- ============================================
SELECT 
    id,
    agenda_id,
    materia_estrategia_id,
    juzgado_cuenta_id,
    id_causa,
    causa_nombre,
    estado,
    anexo_id,
    fecha_ultimo_ingreso
FROM causa
WHERE id IS NOT NULL
  AND agenda_id IS NOT NULL
  AND id_causa IS NOT NULL
  AND id_causa != ''
  AND causa_nombre IS NOT NULL
  AND causa_nombre != ''
ORDER BY id
LIMIT 5;

-- ============================================
-- CONSULTA COMBINADA: Ver relaciones entre tablas
-- ============================================
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    c.estado AS causa_estado,
    a.id AS agenda_id_completo,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.email_cliente,
    a.telefono_cliente,
    a.abogado_id,
    a.cuenta_id AS agenda_cuenta_id,
    a.campania,
    a.fecha_carga,
    a.status_id AS agenda_status
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE c.id_causa IS NOT NULL
  AND c.id_causa != ''
  AND c.causa_nombre IS NOT NULL
  AND c.causa_nombre != ''
  AND a.nombre_cliente IS NOT NULL
  AND a.nombre_cliente != ''
  AND a.rut_cliente IS NOT NULL
  AND a.rut_cliente != ''
ORDER BY c.id
LIMIT 10;

-- ============================================
-- CONSULTA: Ver actuaciones relacionadas con causas
-- ============================================
SELECT 
    act.id AS actuacion_id,
    act.cuaderno_id,
    act.nombre AS actuacion_nombre,
    aap.id AS relacion_id,
    aap.actuacion_id,
    aap.anexo_procesal_id
FROM actuacion act
LEFT JOIN actuacion_anexo_procesal aap ON act.id = aap.actuacion_id
WHERE act.id IS NOT NULL
  AND act.nombre IS NOT NULL
  AND act.nombre != ''
ORDER BY act.id
LIMIT 10;

-- ============================================
-- RESUMEN: Contar registros con datos completos
-- ============================================
SELECT 
    'accion' AS tabla,
    COUNT(*) AS total,
    COUNT(CASE WHEN nombre IS NOT NULL AND nombre != '' THEN 1 END) AS con_nombre,
    COUNT(CASE WHEN accion IS NOT NULL AND accion != '' THEN 1 END) AS con_accion
FROM accion
UNION ALL
SELECT 
    'actuacion' AS tabla,
    COUNT(*) AS total,
    COUNT(CASE WHEN nombre IS NOT NULL AND nombre != '' THEN 1 END) AS con_nombre,
    COUNT(CASE WHEN cuaderno_id IS NOT NULL THEN 1 END) AS con_cuaderno
FROM actuacion
UNION ALL
SELECT 
    'actuacion_anexo_procesal' AS tabla,
    COUNT(*) AS total,
    COUNT(CASE WHEN actuacion_id IS NOT NULL THEN 1 END) AS con_actuacion,
    COUNT(CASE WHEN anexo_procesal_id IS NOT NULL THEN 1 END) AS con_anexo
FROM actuacion_anexo_procesal
UNION ALL
SELECT 
    'agenda' AS tabla,
    COUNT(*) AS total,
    COUNT(CASE WHEN nombre_cliente IS NOT NULL AND nombre_cliente != '' THEN 1 END) AS con_cliente,
    COUNT(CASE WHEN rut_cliente IS NOT NULL AND rut_cliente != '' THEN 1 END) AS con_rut
FROM agenda
UNION ALL
SELECT 
    'causa' AS tabla,
    COUNT(*) AS total,
    COUNT(CASE WHEN id_causa IS NOT NULL AND id_causa != '' THEN 1 END) AS con_rit,
    COUNT(CASE WHEN causa_nombre IS NOT NULL AND causa_nombre != '' THEN 1 END) AS con_caratulado
FROM causa;

