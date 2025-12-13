-- ============================================
-- CONSULTAS PARA BUSCAR DATOS EN PRODUCCIÓN
-- Basado en pjud_config.json
-- Base de datos: codi_ejamtest
-- ============================================

-- ============================================
-- PASO 1: Buscar por FOLIO (más específico)
-- ============================================
-- El folio "20212" es único y debería darte el contrato exacto
SELECT 
    'CONTRATO ENCONTRADO' AS tipo,
    c.id AS contrato_id,
    c.folio,
    c.nombre AS cliente,
    c.rut,
    c.agenda_id
FROM contrato c
WHERE c.folio = '20212';

-- ============================================
-- PASO 2: Si encontraste el contrato, busca la CAUSA relacionada
-- ============================================
-- Reemplaza el contrato_id con el que encontraste arriba
SELECT 
    'CAUSA ENCONTRADA' AS tipo,
    ca.id AS causa_id,
    ca.agenda_id,
    ca.id_causa AS rit_completo,
    CONCAT(ca.rol, '-', ca.anio) AS rit_construido,
    ca.rol,
    ca.anio,
    ca.letra AS tipoCausa,
    ca.causa_nombre AS caratulado,
    ca.materia_estrategia_id,
    ca.juzgado_cuenta_id
FROM causa ca
WHERE ca.agenda_id IN (
    SELECT agenda_id 
    FROM contrato 
    WHERE folio = '20212'
);

-- ============================================
-- PASO 3: Buscar por RUT del cliente
-- ============================================
SELECT 
    'CLIENTE POR RUT' AS tipo,
    c.id AS contrato_id,
    c.folio,
    c.nombre AS cliente,
    c.rut,
    c.agenda_id
FROM contrato c
WHERE c.rut = '8.462.961-8'
   OR c.rut = '8462961-8'  -- Sin puntos
   OR c.rut LIKE '%8462961%';  -- Búsqueda parcial

-- ============================================
-- PASO 4: Buscar por NOMBRE del cliente
-- ============================================
SELECT 
    'CLIENTE POR NOMBRE' AS tipo,
    c.id AS contrato_id,
    c.folio,
    c.nombre AS cliente,
    c.rut,
    c.agenda_id
FROM contrato c
WHERE c.nombre LIKE '%Carlos Domingo Gutierrez Ramos%'
   OR c.nombre LIKE '%Carlos%Gutierrez%'
   OR c.nombre LIKE '%Gutierrez Ramos%';

-- ============================================
-- PASO 5: Buscar por RIT (Rol Único)
-- ============================================
SELECT 
    'CAUSA POR RIT' AS tipo,
    ca.id AS causa_id,
    ca.agenda_id,
    ca.id_causa AS rit_completo,
    CONCAT(ca.rol, '-', ca.anio) AS rit_construido,
    ca.rol,
    ca.anio,
    ca.letra,
    ca.causa_nombre AS caratulado
FROM causa ca
WHERE ca.id_causa = '16707-2019'
   OR ca.id_causa LIKE '%16707-2019%'
   OR (ca.rol = '16707' AND ca.anio = 2019)
   OR ca.rol LIKE '%16707%';

-- ============================================
-- PASO 6: Buscar por CARATULADO
-- ============================================
SELECT 
    'CAUSA POR CARATULADO' AS tipo,
    ca.id AS causa_id,
    ca.agenda_id,
    ca.causa_nombre AS caratulado,
    ca.rol,
    ca.anio,
    ca.letra
FROM causa ca
WHERE ca.causa_nombre LIKE '%27 Juzgado Civil de Santiago%'
   OR ca.causa_nombre LIKE '%Juzgado Civil%'
   OR ca.causa_nombre LIKE '%Santiago%';

-- ============================================
-- PASO 7: Buscar ABOGADO
-- ============================================
SELECT 
    'ABOGADO' AS tipo,
    u.id AS abogado_id,
    u.nombre AS abogado,
    u.correo AS email
FROM usuario u
WHERE u.nombre LIKE '%Tatiana Gonzalez%'
   OR u.nombre LIKE '%Tatiana%Gonzalez%'
   OR u.nombre LIKE '%Gonzalez%';

-- ============================================
-- PASO 8: Buscar JUZGADO/TRIBUNAL
-- ============================================
-- Buscar en tabla juzgado
SELECT 
    'JUZGADO' AS tipo,
    j.id AS tribunal_id,
    j.nombre AS tribunal_nombre
FROM juzgado j
WHERE j.id = 276
   OR j.nombre LIKE '%Promotora CMR Falabella%'
   OR j.nombre LIKE '%CMR%'
   OR j.nombre LIKE '%Falabella%';

-- Buscar en tabla cuenta (compañía)
SELECT 
    'CUENTA/COMPAÑÍA' AS tipo,
    c.id AS cuenta_id,
    c.nombre AS cuenta_nombre
FROM cuenta c
WHERE c.nombre LIKE '%Promotora CMR Falabella%'
   OR c.nombre LIKE '%CMR%'
   OR c.nombre LIKE '%Falabella%';

-- ============================================
-- PASO 9: CONSULTA COMPLETA - Todo junto
-- ============================================
-- Esta consulta busca TODOS los datos del JSON en una sola query
SELECT 
    -- Datos del JSON
    'DATOS COMPLETOS' AS tipo_busqueda,
    
    -- Contrato
    c.id AS contrato_id,
    c.folio,
    c.nombre AS cliente_json,
    c.rut AS rut_json,
    
    -- Causa
    ca.id AS causa_id,
    COALESCE(ca.id_causa, CONCAT(ca.rol, '-', ca.anio)) AS rit_json,
    ca.rol,
    ca.anio,
    ca.letra AS tipoCausa_json,
    ca.causa_nombre AS caratulado_json,
    ca.materia_estrategia_id AS competencia_posible,
    
    -- Abogado
    u_abogado.id AS abogado_id,
    u_abogado.nombre AS abogado_json,
    
    -- Juzgado/Tribunal
    j.id AS tribunal_id_json,
    j.nombre AS tribunal_nombre,
    
    -- Cuenta/Compañía
    cuenta.id AS cuenta_id,
    cuenta.nombre AS juzgado_json,
    
    -- Relaciones
    a.id AS agenda_id,
    cr.id AS contrato_rol_id,
    cr.juzgado_id AS juzgado_id_en_rol

FROM contrato c
INNER JOIN agenda a ON c.agenda_id = a.id
LEFT JOIN causa ca ON ca.agenda_id = a.id
LEFT JOIN usuario u_abogado ON a.abogado_id = u_abogado.id
LEFT JOIN cuenta ON a.cuenta_id = cuenta.id
LEFT JOIN contrato_rol cr ON cr.contrato_id = c.id
LEFT JOIN juzgado j ON cr.juzgado_id = j.id

WHERE 
    -- Buscar por folio
    c.folio = '20212'
    -- O por RUT
    OR c.rut LIKE '%8462961%'
    -- O por nombre
    OR c.nombre LIKE '%Carlos%Gutierrez%'
    -- O por RIT
    OR ca.id_causa = '16707-2019'
    OR (ca.rol = '16707' AND ca.anio = 2019)
    -- O por caratulado
    OR ca.causa_nombre LIKE '%Juzgado Civil%Santiago%'
    -- O por abogado
    OR u_abogado.nombre LIKE '%Tatiana%Gonzalez%'
    -- O por tribunal
    OR j.id = 276
    OR j.nombre LIKE '%CMR%'
    OR cuenta.nombre LIKE '%CMR%';

-- ============================================
-- PASO 10: Verificar qué tablas tienen datos
-- ============================================
-- Ejecuta estas consultas para ver cuántos registros hay en cada tabla

SELECT 'contrato' AS tabla, COUNT(*) AS total_registros FROM contrato;
SELECT 'causa' AS tabla, COUNT(*) AS total_registros FROM causa;
SELECT 'agenda' AS tabla, COUNT(*) AS total_registros FROM agenda;
SELECT 'juzgado' AS tabla, COUNT(*) AS total_registros FROM juzgado;
SELECT 'usuario' AS tabla, COUNT(*) AS total_registros FROM usuario;
SELECT 'cuenta' AS tabla, COUNT(*) AS total_registros FROM cuenta;
SELECT 'contrato_rol' AS tabla, COUNT(*) AS total_registros FROM contrato_rol;

-- ============================================
-- PASO 11: Ver estructura de campos clave
-- ============================================
-- Ver ejemplos de datos en cada tabla

SELECT 'EJEMPLOS CONTRATO' AS info, id, folio, nombre, rut FROM contrato LIMIT 5;
SELECT 'EJEMPLOS CAUSA' AS info, id, id_causa, rol, anio, letra, causa_nombre FROM causa LIMIT 5;
SELECT 'EJEMPLOS JUZGADO' AS info, id, nombre FROM juzgado LIMIT 5;
SELECT 'EJEMPLOS USUARIO' AS info, id, nombre FROM usuario WHERE nombre LIKE '%abogado%' OR nombre LIKE '%Gonzalez%' LIMIT 5;

