-- ============================================
-- Actualizar TODOS los PDFs con contenido VISIBLE
-- ============================================

USE codi_ejamtest;

-- PDF con contenido VISIBLE (texto real)
SET @pdf_base64 = 'JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCgoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagoKMyAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDIgMCBSCi9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCi9Db250ZW50cyA0IDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9IZWx2ZXRpY2EKPj4KPj4KPj4KPj4KZW5kb2JqCgo0IDAgb2JqCjw8Ci9MZW5ndGggMTgwCj4+CnN0cmVhbQpCVAovRjEgMjQgVGYKNTAgNzAwIFRkCihET0NVTUVOVE8gREUgUFJVRUJBKSBUagowIC00MCBUZAovRjEgMTQgVGYKKFJJVDogQy0xNjcwNy0yMDE5KSBUagowIC0zMCBUZAooRm9saW86IDEpIFRqCjAgLTMwIFRkCihFc3RlIGVzIHVuIFBERiBkZSBwcnVlYmEgZ2VuZXJhZG8pIFRqCjAgLTMwIFRkCihwYXJhIGVsIHNpc3RlbWEgZGUgZ2VzdGlvbiBkZSBjYXVzYXMpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZgowMDAwMDAwMDA5IDAwMDAwIG4KMDAwMDAwMDA1OCAwMDAwMCBuCjAwMDAwMDAxMTUgMDAwMDAgbgowMDAwMDAwMzE3IDAwMDAwIG4KdHJhaWxlcgo8PAovU2l6ZSA1Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo1NDcKJSVFT0Y=';

-- Actualizar TODOS los PDFs con el contenido visible
UPDATE pdfs
SET
    contenido_base64 = @pdf_base64,
    tamano_bytes = LENGTH(FROM_BASE64(@pdf_base64))
WHERE contenido_base64 IS NOT NULL OR contenido_base64 IS NULL;

-- Verificar actualización
SELECT 'PDFs actualizados con contenido visible' as mensaje;

SELECT
    rit,
    tipo,
    COUNT(*) as total,
    COUNT(CASE WHEN contenido_base64 IS NOT NULL THEN 1 END) as con_contenido,
    AVG(tamano_bytes) as promedio_bytes
FROM pdfs
GROUP BY rit, tipo;

SELECT '\nDetalle de PDFs:' as mensaje;
SELECT
    rit,
    nombre_archivo,
    tipo,
    ROUND(tamano_bytes / 1024, 2) as kb,
    CASE WHEN contenido_base64 IS NOT NULL THEN '✅ OK' ELSE '❌ VACÍO' END as estado,
    LEFT(contenido_base64, 30) as inicio_contenido
FROM pdfs
ORDER BY rit, nombre_archivo
LIMIT 10;
