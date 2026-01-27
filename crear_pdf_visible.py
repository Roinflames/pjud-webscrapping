#!/usr/bin/env python3
"""
Crear un PDF de prueba con contenido visible
"""
import base64

# PDF mínimo pero con contenido VISIBLE
# Este PDF tiene texto real que se verá al abrirlo
pdf_content = """%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj

4 0 obj
<<
/Length 180
>>
stream
BT
/F1 24 Tf
50 700 Td
(DOCUMENTO DE PRUEBA) Tj
0 -40 Td
/F1 14 Tf
(RIT: C-16707-2019) Tj
0 -30 Td
(Folio: 1) Tj
0 -30 Td
(Este es un PDF de prueba generado) Tj
0 -30 Td
(para el sistema de gestion de causas) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000317 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
547
%%EOF"""

# Convertir a base64
pdf_base64 = base64.b64encode(pdf_content.encode('latin-1')).decode('ascii')

print("-- PDF en base64 (copiar este valor):")
print(f"SET @pdf_base64 = '{pdf_base64}';")
print(f"\n-- Longitud: {len(pdf_base64)} caracteres")
print(f"-- Tamaño PDF: {len(pdf_content)} bytes")
