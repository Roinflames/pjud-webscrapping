-- ============================================
-- MIGRACIÓN: Agregar columna indice a PDFs y arreglar relaciones
-- Fecha: 2026-01-29
-- Propósito: Mejorar tracking de PDFs usando índice de movimientos
-- ============================================

-- PASO 1: Agregar columna indice a tabla pdfs
ALTER TABLE pdfs
ADD COLUMN indice VARCHAR(50) AFTER folio;

-- PASO 2: Actualizar índices de PDFs existentes desde movimientos
UPDATE pdfs p
INNER JOIN movimientos m ON p.movimiento_id = m.id
SET p.indice = m.indice
WHERE p.movimiento_id IS NOT NULL;

-- PASO 3: Reasignar PDFs huérfanos a movimientos actuales
-- (En caso de que haya PDFs con movimiento_id inválido)
UPDATE pdfs p
INNER JOIN causas c ON p.rit = c.rit
INNER JOIN movimientos m ON m.causa_id = c.id AND m.folio = p.folio
SET p.movimiento_id = m.id,
    p.causa_id = c.id,
    p.indice = m.indice
WHERE p.movimiento_id IS NULL
   OR NOT EXISTS (SELECT 1 FROM movimientos WHERE id = p.movimiento_id);

-- VERIFICACIÓN: Mostrar PDFs con sus movimientos
SELECT
  p.id as pdf_id,
  p.rit,
  p.folio,
  p.indice,
  p.tipo_pdf,
  m.id as mov_id,
  m.tramite,
  CASE WHEN p.movimiento_id = m.id THEN 'OK' ELSE 'ERROR' END as relacion
FROM pdfs p
LEFT JOIN movimientos m ON p.movimiento_id = m.id
ORDER BY p.rit, p.folio;

-- VERIFICACIÓN: Contar PDFs por causa
SELECT
  c.rit,
  COUNT(DISTINCT p.id) as total_pdfs,
  COUNT(DISTINCT CASE WHEN p.movimiento_id IS NOT NULL THEN p.id END) as pdfs_asociados
FROM causas c
LEFT JOIN pdfs p ON p.causa_id = c.id
GROUP BY c.rit;
