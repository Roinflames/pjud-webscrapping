-- ============================================
-- Poblar TODOS los PDFs de todos los movimientos
-- ============================================

USE codi_ejamtest;

-- PDF de prueba válido en base64
SET @pdf_base64 = 'JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nDPQM1Qo5ypUMABCMA0A8AQDAQplbmRzdHJlYW0KZW5kb2JqCgozIDAgb2JqCjMxCmVuZG9iagoKNSAwIG9iago8PAovVHlwZS9QYWdlCi9NZWRpYUJveFswIDAgNjEyIDc5Ml0KL1BhcmVudCA0IDAgUgovUmVzb3VyY2VzPDwvRm9udDw8L0YxIDYgMCBSPj4KPj4KL0NvbnRlbnRzIDIgMCBSCj4+CmVuZG9iago+PgplbmRvYmoKCjYgMCBvYmoKPDwKL1R5cGUvRm9udAovU3VidHlwZS9UeXBlMQovQmFzZUZvbnQvVGltZXMtUm9tYW4KPj4KZW5kb2JqCgo0IDAgb2JqCjw8Ci9UeXBlL1BhZ2VzCi9Db3VudCAxCi9LaWRzWzUgMCBSXQo+PgplbmRvYmoKCjcgMCBvYmoKPDwKL1R5cGUvQ2F0YWxvZwovUGFnZXMgNCAwIFIKPj4KZW5kb2JqCgp4cmVmCjAgOAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA3NCAwMDAwMCBuIAowMDAwMDAwMTc4IDAwMDAwIG4gCjAwMDAwMDAzNjEgMDAwMDAgbiAKMDAwMDAwMDE5NyAwMDAwMCBuIAowMDAwMDAwMzE4IDAwMDAwIG4gCjAwMDAwMDA0MjAgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA4Ci9Sb290IDcgMCBSCi9JbmZvIDEgMCBSCj4+CnN0YXJ0eHJlZgo0NjkKJSVFT0YK';

-- Limpiar tabla pdfs para repoblar
DELETE FROM pdfs;

-- Insertar TODOS los PDFs AZULES de TODOS los movimientos
INSERT INTO pdfs (movimiento_id, causa_id, rit, tipo, nombre_archivo, contenido_base64, tamano_bytes)
SELECT
    m.id,
    m.causa_id,
    m.rit,
    'PRINCIPAL',
    m.pdf_azul,
    @pdf_base64,
    LENGTH(FROM_BASE64(@pdf_base64))
FROM movimientos m
WHERE m.pdf_azul IS NOT NULL;

-- Insertar TODOS los PDFs ROJOS de TODOS los movimientos
INSERT INTO pdfs (movimiento_id, causa_id, rit, tipo, nombre_archivo, contenido_base64, tamano_bytes)
SELECT
    m.id,
    m.causa_id,
    m.rit,
    'ANEXO',
    m.pdf_rojo,
    @pdf_base64,
    LENGTH(FROM_BASE64(@pdf_base64))
FROM movimientos m
WHERE m.pdf_rojo IS NOT NULL;

-- Verificar resultados
SELECT '\n=== VERIFICACIÓN: PDFs por causa ===' as mensaje;
SELECT
    rit,
    COUNT(*) as total_pdfs,
    COUNT(CASE WHEN tipo = 'PRINCIPAL' THEN 1 END) as azules,
    COUNT(CASE WHEN tipo = 'ANEXO' THEN 1 END) as rojos,
    COUNT(CASE WHEN contenido_base64 IS NOT NULL THEN 1 END) as con_contenido
FROM pdfs
GROUP BY rit;

SELECT '\n=== PDFs por movimiento ===' as mensaje;
SELECT
    m.rit,
    m.folio,
    m.cuaderno,
    CASE WHEN m.pdf_azul IS NOT NULL THEN 'Registrado' ELSE '-' END as azul_mov,
    CASE WHEN m.pdf_rojo IS NOT NULL THEN 'Registrado' ELSE '-' END as rojo_mov,
    COUNT(DISTINCT CASE WHEN p.tipo = 'PRINCIPAL' AND p.contenido_base64 IS NOT NULL THEN p.id END) as azul_ok,
    COUNT(DISTINCT CASE WHEN p.tipo = 'ANEXO' AND p.contenido_base64 IS NOT NULL THEN p.id END) as rojo_ok
FROM movimientos m
LEFT JOIN pdfs p ON m.id = p.movimiento_id
WHERE m.pdf_azul IS NOT NULL OR m.pdf_rojo IS NOT NULL
GROUP BY m.id, m.rit, m.folio, m.cuaderno
ORDER BY m.rit, CAST(m.folio AS UNSIGNED);

SELECT '\n=== Estadísticas finales ===' as mensaje;
SELECT
    COUNT(DISTINCT m.id) as movimientos_con_pdfs,
    COUNT(p.id) as total_registros_pdfs,
    COUNT(CASE WHEN p.contenido_base64 IS NOT NULL THEN 1 END) as pdfs_con_contenido,
    COUNT(CASE WHEN p.contenido_base64 IS NULL THEN 1 END) as pdfs_sin_contenido
FROM movimientos m
LEFT JOIN pdfs p ON m.id = p.movimiento_id
WHERE m.pdf_azul IS NOT NULL OR m.pdf_rojo IS NOT NULL;
