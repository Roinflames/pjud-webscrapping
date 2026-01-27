-- ============================================
-- Actualizar datos de prueba con cuadernos y PDFs de colores
-- ============================================

USE codi_ejamtest;

-- Agregar cuaderno Ejecutivo a C-16707-2019
INSERT INTO cuadernos (causa_id, cuaderno_id, nombre, total_movimientos)
SELECT id, '2', 'Ejecutivo', 0
FROM causas
WHERE rit = 'C-16707-2019';

-- Agregar algunos movimientos al cuaderno Ejecutivo de C-16707-2019
INSERT INTO movimientos (
    causa_id, rit, indice,
    etapa, tramite, descripcion, fecha, foja, folio,
    tiene_pdf, cuaderno, cuaderno_id,
    pdf_azul, pdf_rojo
)
SELECT
    c.id,
    'C-16707-2019',
    11,
    'Ejecución',
    'Demanda Ejecutiva',
    'Presentación demanda ejecutiva',
    '05/05/2020',
    '150',
    '11',
    1,
    'Ejecutivo',
    '2',
    '16707_2019_mov_11_P.pdf',
    NULL
FROM causas c WHERE c.rit = 'C-16707-2019';

INSERT INTO movimientos (
    causa_id, rit, indice,
    etapa, tramite, descripcion, fecha, foja, folio,
    tiene_pdf, cuaderno, cuaderno_id,
    pdf_azul, pdf_rojo
)
SELECT
    c.id,
    'C-16707-2019',
    12,
    'Ejecución',
    'Mandamiento',
    'Mandamiento de ejecución y embargo',
    '10/05/2020',
    '155',
    '12',
    1,
    'Ejecutivo',
    '2',
    '16707_2019_mov_12_P.pdf',
    '16707_2019_mov_12_R.pdf'
FROM causas c WHERE c.rit = 'C-16707-2019';

INSERT INTO movimientos (
    causa_id, rit, indice,
    etapa, tramite, descripcion, fecha, foja, folio,
    tiene_pdf, cuaderno, cuaderno_id,
    pdf_azul, pdf_rojo
)
SELECT
    c.id,
    'C-16707-2019',
    13,
    'Ejecución',
    'Remate',
    'Solicitud de remate de bienes',
    '15/05/2020',
    '160',
    '13',
    1,
    'Ejecutivo',
    '2',
    NULL,
    '16707_2019_mov_13_R.pdf'
FROM causas c WHERE c.rit = 'C-16707-2019';

-- Actualizar algunos PDFs existentes para que tengan color rojo también
UPDATE movimientos
SET pdf_rojo = REPLACE(pdf_azul, '_P.pdf', '_R.pdf')
WHERE rit = 'C-16707-2019'
  AND folio IN ('1', '3', '7')
  AND pdf_azul IS NOT NULL;

UPDATE movimientos
SET pdf_rojo = REPLACE(pdf_azul, '_P.pdf', '_R.pdf')
WHERE rit = 'C-13786-2018'
  AND folio IN ('1', '5')
  AND pdf_azul IS NOT NULL;

-- Actualizar contador de cuaderno Ejecutivo
UPDATE cuadernos
SET total_movimientos = (
    SELECT COUNT(*)
    FROM movimientos
    WHERE movimientos.causa_id = cuadernos.causa_id
      AND movimientos.cuaderno_id = cuadernos.cuaderno_id
)
WHERE cuaderno_id = '2';

-- Actualizar flags de tiene_pdf basándose en los PDFs de colores
UPDATE movimientos
SET tiene_pdf = 1
WHERE pdf_azul IS NOT NULL OR pdf_rojo IS NOT NULL;

-- Verificar resultados
SELECT 'Cuadernos por causa:' as mensaje;
SELECT
    c.rit,
    cu.cuaderno_id,
    cu.nombre,
    cu.total_movimientos
FROM cuadernos cu
JOIN causas c ON cu.causa_id = c.id
ORDER BY c.rit, cu.cuaderno_id;

SELECT '\nDistribución de PDFs por color:' as mensaje;
SELECT
    rit,
    cuaderno,
    COUNT(*) as total_movimientos,
    COUNT(CASE WHEN pdf_azul IS NOT NULL THEN 1 END) as con_azul,
    COUNT(CASE WHEN pdf_rojo IS NOT NULL THEN 1 END) as con_rojo,
    COUNT(CASE WHEN pdf_azul IS NOT NULL AND pdf_rojo IS NOT NULL THEN 1 END) as con_ambos
FROM movimientos
GROUP BY rit, cuaderno
ORDER BY rit, cuaderno;

SELECT '\nTotal de movimientos por causa:' as mensaje;
SELECT
    rit,
    COUNT(*) as total
FROM movimientos
GROUP BY rit;
