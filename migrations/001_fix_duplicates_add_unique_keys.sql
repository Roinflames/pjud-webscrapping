-- ============================================
-- MIGRACIÓN: Eliminar duplicados y agregar claves únicas
-- Fecha: 2026-01-29
-- Propósito: Prevenir duplicación de datos en scraping
-- ============================================

-- PASO 1: Eliminar movimientos duplicados
-- Mantiene solo el movimiento más reciente por cada (causa_id, folio)
DELETE m1 FROM movimientos m1
INNER JOIN movimientos m2
WHERE m1.causa_id = m2.causa_id
  AND m1.folio = m2.folio
  AND m1.id < m2.id;

-- PASO 2: Agregar índice único en movimientos
-- Previene futuros duplicados en (causa_id, folio)
ALTER TABLE movimientos
ADD UNIQUE KEY unique_causa_folio (causa_id, folio);

-- PASO 3: Eliminar PDFs duplicados (si existen)
DELETE p1 FROM pdfs p1
INNER JOIN pdfs p2
WHERE p1.movimiento_id = p2.movimiento_id
  AND p1.folio = p2.folio
  AND p1.tipo_pdf = p2.tipo_pdf
  AND p1.id < p2.id;

-- PASO 4: Agregar índice único en PDFs
-- Previene futuros duplicados en (movimiento_id, folio, tipo_pdf)
ALTER TABLE pdfs
ADD UNIQUE KEY unique_mov_folio_tipo (movimiento_id, folio, tipo_pdf);

-- VERIFICACIÓN: Contar registros después de la limpieza
SELECT
  (SELECT COUNT(*) FROM causas) as total_causas,
  (SELECT COUNT(*) FROM movimientos) as total_movimientos,
  (SELECT COUNT(*) FROM pdfs) as total_pdfs;

-- VERIFICACIÓN: Mostrar índices únicos creados
SHOW KEYS FROM movimientos WHERE Key_name = 'unique_causa_folio';
SHOW KEYS FROM pdfs WHERE Key_name = 'unique_mov_folio_tipo';
