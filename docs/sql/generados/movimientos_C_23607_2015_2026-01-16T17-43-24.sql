-- ============================================
-- SQL Generado para RIT: C-23607-2015
-- Fecha: 2026-01-16T17:43:24.325Z
-- Cantidad de movimientos: 8
-- ============================================

-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS pjud_movimientos_intermedia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rit VARCHAR(50),
  competencia_id INT,
  corte_id INT,
  tribunal_id INT,
  folio VARCHAR(20),
  doc_principal_nombre VARCHAR(255),
  doc_anexo_nombre VARCHAR(255),
  anexo_texto TEXT,
  etapa VARCHAR(100),
  tramite VARCHAR(100),
  desc_tramite TEXT,
  fec_tramite DATE,
  foja VARCHAR(20),
  georref VARCHAR(100),
  pdf_demanda_nombre VARCHAR(255),
  pdf_ebook_nombre VARCHAR(255),
  fecha_consulta_actual DATETIME,
  fecha_consulta_anterior DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar movimientos
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23607-2015',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '9',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Resolución',  -- tramite
  'Archivo del expediente en el Tribunal', -- desc_tramite
  '2016-07-04', -- fec_tramite
  '2', -- foja
  NULL, -- georref
  'C_23607_2015_demanda.pdf', -- pdf_demanda_nombre
  'C_23607_2015_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:43:24', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:26:10 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23607-2015',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '8',  -- folio
  'C_23607_2015_mov_8_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Resolución',  -- tramite
  'Mero trámite', -- desc_tramite
  '2015-12-29', -- fec_tramite
  '5', -- foja
  NULL, -- georref
  'C_23607_2015_demanda.pdf', -- pdf_demanda_nombre
  'C_23607_2015_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:43:24', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:26:10 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23607-2015',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '7',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Ingreso',  -- etapa
  'Escrito',  -- tramite
  'Notificación por art. 44', -- desc_tramite
  '2015-12-10', -- fec_tramite
  '4', -- foja
  NULL, -- georref
  'C_23607_2015_demanda.pdf', -- pdf_demanda_nombre
  'C_23607_2015_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:43:24', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:26:10 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23607-2015',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '6',  -- folio
  'C_23607_2015_mov_6_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Actuación Receptor',  -- tramite
  'Certificación búsquedas Diligencia:01/12/2015', -- desc_tramite
  '2015-12-04', -- fec_tramite
  '0', -- foja
  NULL, -- georref
  'C_23607_2015_demanda.pdf', -- pdf_demanda_nombre
  'C_23607_2015_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:43:24', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:26:10 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23607-2015',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '4',  -- folio
  'C_23607_2015_mov_4_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Ingreso',  -- etapa
  'Resolución',  -- tramite
  'Ordena despachar mandamiento', -- desc_tramite
  '2015-10-16', -- fec_tramite
  '1', -- foja
  NULL, -- georref
  'C_23607_2015_demanda.pdf', -- pdf_demanda_nombre
  'C_23607_2015_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:43:24', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:26:10 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23607-2015',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '3',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Ingreso',  -- etapa
  'Escrito',  -- tramite
  'Acompaña documentos', -- desc_tramite
  '2015-10-09', -- fec_tramite
  '3', -- foja
  NULL, -- georref
  'C_23607_2015_demanda.pdf', -- pdf_demanda_nombre
  'C_23607_2015_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:43:24', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:26:10 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23607-2015',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '2',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Ingreso',  -- etapa
  'Escrito',  -- tramite
  'Ingreso demanda', -- desc_tramite
  '2015-09-29', -- fec_tramite
  '1', -- foja
  NULL, -- georref
  'C_23607_2015_demanda.pdf', -- pdf_demanda_nombre
  'C_23607_2015_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:43:24', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:26:10 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23607-2015',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '1',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Ingreso',  -- etapa
  'Resolución',  -- tramite
  'Apercibimiento poder y/o título', -- desc_tramite
  '2015-09-30', -- fec_tramite
  '2', -- foja
  NULL, -- georref
  'C_23607_2015_demanda.pdf', -- pdf_demanda_nombre
  'C_23607_2015_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:43:24', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:26:10 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);

-- ============================================
-- Fin del archivo SQL
-- ============================================