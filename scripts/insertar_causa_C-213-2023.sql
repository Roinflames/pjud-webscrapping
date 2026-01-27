-- ============================================
-- INSERTAR CAUSA DE PRUEBA: C-213-2023
-- Para testear scraping que detecta cambios en BD
-- ============================================

USE codi_ejamtest;

-- Paso 1: Buscar tribunal "1º Juzgado de Letras de Iquique"
-- Ejecuta esto primero para encontrar el tribunal_id
SELECT 
    j.id AS tribunal_id,
    j.nombre AS tribunal_nombre
FROM juzgado j
WHERE j.nombre LIKE '%Iquique%'
   OR j.nombre LIKE '%1%Juzgado%Letras%'
   OR j.nombre LIKE '%Juzgado%Iquique%'
ORDER BY j.id
LIMIT 10;

-- Paso 2: Insertar la causa
-- IMPORTANTE: Reemplaza TRIBUNAL_ID_AQUI con el ID encontrado en el Paso 1
-- Si no encuentras el tribunal, puedes usar NULL temporalmente

INSERT INTO causa (
    id_causa,              -- RIT completo
    causa_nombre,          -- Caratulado
    materia_estrategia_id, -- Competencia (3 = Civil)
    juzgado_cuenta_id,     -- Tribunal (reemplaza TRIBUNAL_ID_AQUI)
    letra,                 -- Tipo causa (C = Civil)
    rol,                   -- Rol (213)
    anio,                  -- Año (2023)
    estado                 -- Estado (1 = activo)
) VALUES (
    'C-213-2023',
    'COMPAÑÍA MINERA DOÑA INÉS DE COLLAHUASI SCM/FISCO DE CHILE (CDE)',
    3,                     -- Competencia: Civil
    NULL,                  -- ⚠️ REEMPLAZA CON TRIBUNAL_ID encontrado arriba
    'C',                   -- Tipo: Civil
    '213',
    2023,
    1                      -- Estado: activo
)
ON DUPLICATE KEY UPDATE
    causa_nombre = VALUES(causa_nombre),
    materia_estrategia_id = VALUES(materia_estrategia_id),
    juzgado_cuenta_id = VALUES(juzgado_cuenta_id),
    letra = VALUES(letra),
    rol = VALUES(rol),
    anio = VALUES(anio);

-- Paso 3: Verificar que se insertó correctamente
SELECT 
    c.id AS causa_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal_id,
    j.nombre AS tribunal_nombre,
    c.letra AS tipo_causa,
    c.rol,
    c.anio
FROM causa c
LEFT JOIN juzgado j ON c.juzgado_cuenta_id = j.id
WHERE c.id_causa = 'C-213-2023';

-- ============================================
-- NOTAS:
-- ============================================
-- 1. Si juzgado_cuenta_id es NULL, el scraping puede fallar
-- 2. Busca manualmente el tribunal_id y actualiza:
--    UPDATE causa SET juzgado_cuenta_id = TRIBUNAL_ID WHERE id_causa = 'C-213-2023';
-- 3. Una vez insertada, el listener o worker detectará la causa automáticamente
