-- ============================================
-- SOLUCIÓN AL ERROR DE IMPORTACIÓN
-- Error: #1062 - Entrada duplicada '1' para la clave 'PRIMARY'
-- ============================================

-- ============================================
-- PASO 1: Ver TODAS las tablas que existen
-- ============================================
SHOW TABLES;

-- ============================================
-- PASO 2: Verificar si CAUSA ya existe
-- ============================================
SHOW TABLES LIKE 'causa';

-- Si existe, ver su estructura
DESCRIBE causa;

-- Ver si tiene datos
SELECT COUNT(*) FROM causa;

-- ============================================
-- PASO 3: OPCIONES DE SOLUCIÓN
-- ============================================

-- OPCIÓN A: Eliminar todas las tablas y reimportar (CUIDADO: Borra datos)
-- Ejecuta esto SOLO si no te importa perder los datos actuales:
/*
DROP DATABASE IF EXISTS codi_ejamtest;
CREATE DATABASE codi_ejamtest;
USE codi_ejamtest;
-- Luego importa el SQL completo
*/

-- OPCIÓN B: Eliminar solo la tabla CAUSA y recrearla
-- Si solo causa está dando problemas:
/*
DROP TABLE IF EXISTS `causa_observacion_archivo`;
DROP TABLE IF EXISTS `causa_observacion`;
DROP TABLE IF EXISTS `causa`;
-- Luego importa solo la parte del SQL que crea causa
*/

-- OPCIÓN C: Modificar el SQL para usar IF NOT EXISTS en ALTER TABLE
-- Esto es más complejo, mejor usar opción A o B

-- ============================================
-- PASO 4: Ver qué tablas faltan
-- ============================================
-- Compara con las tablas que deberían existir según el SQL:
-- contrato, causa, usuario, cuenta, juzgado, etc.

SELECT 
    TABLE_NAME AS tablas_que_existen
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'codi_ejamtest'
ORDER BY TABLE_NAME;

