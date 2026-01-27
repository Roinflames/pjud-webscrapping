-- ============================================
-- Poblar tabla pdfs con contenido de prueba
-- PDFs simples en base64 para demostración
-- ============================================

USE codi_ejamtest;

-- Crear un PDF simple de prueba en base64 (PDF válido mínimo)
-- Este es un PDF real válido que dice "PDF de Prueba"
SET @pdf_base64 = 'JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nDPQM1Qo5ypUMABCMA0A8AQDAQplbmRzdHJlYW0KZW5kb2JqCgozIDAgb2JqCjMxCmVuZG9iagoKNSAwIG9iago8PAovVHlwZS9QYWdlCi9NZWRpYUJveFswIDAgNjEyIDc5Ml0KL1BhcmVudCA0IDAgUgovUmVzb3VyY2VzPDwvRm9udDw8L0YxIDYgMCBSPj4KPj4KL0NvbnRlbnRzIDIgMCBSCj4+CmVuZG9iago+PgplbmRvYmoKCjYgMCBvYmoKPDwKL1R5cGUvRm9udAovU3VidHlwZS9UeXBlMQovQmFzZUZvbnQvVGltZXMtUm9tYW4KPj4KZW5kb2JqCgo0IDAgb2JqCjw8Ci9UeXBlL1BhZ2VzCi9Db3VudCAxCi9LaWRzWzUgMCBSXQo+PgplbmRvYmoKCjcgMCBvYmoKPDwKL1R5cGUvQ2F0YWxvZwovUGFnZXMgNCAwIFIKPj4KZW5kb2JqCgp4cmVmCjAgOAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA3NCAwMDAwMCBuIAowMDAwMDAwMTc4IDAwMDAwIG4gCjAwMDAwMDAzNjEgMDAwMDAgbiAKMDAwMDAwMDE5NyAwMDAwMCBuIAowMDAwMDAwMzE4IDAwMDAwIG4gCjAwMDAwMDA0MjAgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA4Ci9Sb290IDcgMCBSCi9JbmZvIDEgMCBSCj4+CnN0YXJ0eHJlZgo0NjkKJSVFT0YK';

-- Insertar PDFs para algunos movimientos de C-16707-2019
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
WHERE m.rit = 'C-16707-2019'
  AND m.pdf_azul IS NOT NULL
  AND m.folio IN ('1', '2', '3')
ON DUPLICATE KEY UPDATE contenido_base64 = @pdf_base64;

-- Insertar PDFs rojos
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
WHERE m.rit = 'C-16707-2019'
  AND m.pdf_rojo IS NOT NULL
  AND m.folio IN ('1', '3', '7')
ON DUPLICATE KEY UPDATE contenido_base64 = @pdf_base64;

-- Insertar PDFs para C-13786-2018
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
WHERE m.rit = 'C-13786-2018'
  AND m.pdf_azul IS NOT NULL
  AND m.folio IN ('1', '2')
ON DUPLICATE KEY UPDATE contenido_base64 = @pdf_base64;

-- Verificar PDFs insertados
SELECT 'PDFs en base de datos:' as mensaje;
SELECT
    c.rit,
    p.tipo,
    p.nombre_archivo,
    ROUND(p.tamano_bytes / 1024, 2) as tamano_kb,
    CASE WHEN p.contenido_base64 IS NOT NULL THEN 'Sí' ELSE 'No' END as tiene_contenido
FROM pdfs p
JOIN causas c ON p.causa_id = c.id
ORDER BY c.rit, p.movimiento_id, p.tipo;

SELECT '\nTotal de PDFs por causa:' as mensaje;
SELECT
    c.rit,
    COUNT(*) as total_pdfs,
    COUNT(CASE WHEN p.tipo = 'PRINCIPAL' THEN 1 END) as azules,
    COUNT(CASE WHEN p.tipo = 'ANEXO' THEN 1 END) as rojos
FROM pdfs p
JOIN causas c ON p.causa_id = c.id
GROUP BY c.rit;
