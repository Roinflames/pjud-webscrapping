#!/usr/bin/env python3
"""Generar PDFs realistas por movimiento"""
import sys
import base64

def crear_pdf_movimiento(rit, folio, tipo_mov, descripcion, fecha, color="PRINCIPAL"):
    tipo_doc = "DOCUMENTO PRINCIPAL" if color == "PRINCIPAL" else "ANEXO"
    pdf_content = f"""%PDF-1.4
1 0 obj
<</Type /Catalog /Pages 2 0 R>>
endobj
2 0 obj
<</Type /Pages /Kids [3 0 R] /Count 1>>
endobj
3 0 obj
<</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R
/Resources <</Font <</F1 <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>
/F2 <</Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold>>>>>>>>
endobj
4 0 obj
<</Length 450>>
stream
BT
/F2 18 Tf 50 720 Td (PODER JUDICIAL DE CHILE) Tj
0 -25 Td /F1 12 Tf (27 Juzgado Civil de Santiago) Tj
0 -40 Td /F2 14 Tf ({tipo_doc}) Tj
0 -30 Td /F1 11 Tf (RIT: {rit}) Tj
0 -20 Td (Folio: {folio}) Tj
0 -20 Td (Fecha: {fecha}) Tj
0 -30 Td /F2 12 Tf (Tramite: {tipo_mov}) Tj
0 -25 Td /F1 10 Tf (Descripcion:) Tj
0 -15 Td ({descripcion[:60]}) Tj
0 -15 Td ({descripcion[60:120] if len(descripcion) > 60 else ''}) Tj
0 -40 Td /F1 9 Tf (Documento generado por sistema de gestion judicial) Tj
0 -15 Td (Fecha de emision: {fecha}) Tj
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
<</Size 5 /Root 1 0 R>>
startxref
817
%%EOF"""
    return base64.b64encode(pdf_content.encode('latin-1')).decode('ascii')

# Leer movimientos desde MySQL
import subprocess
result = subprocess.run([
    'mysql', '-u', 'root', 'codi_ejamtest', '-N', '-e',
    """SELECT m.id, m.rit, m.folio, m.tramite, m.descripcion, m.fecha,
       m.pdf_azul, m.pdf_rojo
       FROM movimientos m
       WHERE m.pdf_azul IS NOT NULL OR m.pdf_rojo IS NOT NULL
       ORDER BY m.rit, CAST(m.folio AS UNSIGNED)"""
], capture_output=True, text=True)

print("-- Script SQL para poblar PDFs realistas")
print("USE codi_ejamtest;")
print("DELETE FROM pdfs;")

for line in result.stdout.strip().split('\n'):
    if not line:
        continue
    parts = line.split('\t')
    mov_id, rit, folio, tramite, desc, fecha, pdf_azul, pdf_rojo = parts

    # PDF Azul
    if pdf_azul and pdf_azul != 'NULL':
        b64 = crear_pdf_movimiento(rit, folio, tramite or 'Tramite', desc or 'Sin descripcion', fecha or '01/01/2020', 'PRINCIPAL')
        print(f"INSERT INTO pdfs (movimiento_id, causa_id, rit, tipo, nombre_archivo, contenido_base64, tamano_bytes) ")
        print(f"SELECT {mov_id}, causa_id, '{rit}', 'PRINCIPAL', '{pdf_azul}', '{b64}', {len(base64.b64decode(b64))} ")
        print(f"FROM movimientos WHERE id = {mov_id};")

    # PDF Rojo
    if pdf_rojo and pdf_rojo != 'NULL':
        b64 = crear_pdf_movimiento(rit, folio, tramite or 'Tramite', desc or 'Sin descripcion', fecha or '01/01/2020', 'ANEXO')
        print(f"INSERT INTO pdfs (movimiento_id, causa_id, rit, tipo, nombre_archivo, contenido_base64, tamano_bytes) ")
        print(f"SELECT {mov_id}, causa_id, '{rit}', 'ANEXO', '{pdf_rojo}', '{b64}', {len(base64.b64decode(b64))} ")
        print(f"FROM movimientos WHERE id = {mov_id};")

print("\nSELECT 'PDFs generados' as mensaje, COUNT(*) as total FROM pdfs;")
