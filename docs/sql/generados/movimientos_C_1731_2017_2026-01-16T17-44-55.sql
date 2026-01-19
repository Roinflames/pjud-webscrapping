-- ============================================
-- SQL Generado para RIT: C-1731-2017
-- Fecha: 2026-01-16T17:44:55.979Z
-- Cantidad de movimientos: 6
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
  'C-1731-2017',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '5',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Ingreso',  -- etapa
  'Resolución',  -- tramite
  'Apercibimiento de tener por no presentada la DDA', -- desc_tramite
  '2017-02-02', -- fec_tramite
  '37', -- foja
  NULL, -- georref
  'C_1731_2017_demanda.pdf', -- pdf_demanda_nombre
  'C_1731_2017_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:44:55', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:27:43 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-1731-2017',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '5',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  NULL,  -- etapa
  NULL,  -- tramite
  'Archivo del expediente en el Tribunal', -- desc_tramite
  '2017-02-02', -- fec_tramite
  '37', -- foja
  NULL, -- georref
  'C_1731_2017_demanda.pdf', -- pdf_demanda_nombre
  'C_1731_2017_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:44:55', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:27:43 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-1731-2017',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '4',  -- folio
  'C_1731_2017_mov_4_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Ingreso',  -- etapa
  NULL,  -- tramite
  'Acredita Poder', -- desc_tramite
  '2017-01-30', -- fec_tramite
  '0', -- foja
  NULL, -- georref
  'C_1731_2017_demanda.pdf', -- pdf_demanda_nombre
  'C_1731_2017_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:44:55', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:27:43 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-1731-2017',  -- rit
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
  '2017-01-30', -- fec_tramite
  '3', -- foja
  NULL, -- georref
  'C_1731_2017_demanda.pdf', -- pdf_demanda_nombre
  'C_1731_2017_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:44:55', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:27:43 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-1731-2017',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '2',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Ingreso',  -- etapa
  'Resolución',  -- tramite
  'Apercibimiento poder y/o título', -- desc_tramite
  '2017-01-30', -- fec_tramite
  '2', -- foja
  NULL, -- georref
  'C_1731_2017_demanda.pdf', -- pdf_demanda_nombre
  'C_1731_2017_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:44:55', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:27:43 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-1731-2017',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '1',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Ingreso',  -- etapa
  'Escrito',  -- tramite
  'Presenta solic/dda liquidación', -- desc_tramite
  '2017-01-27', -- fec_tramite
  '1', -- foja
  NULL, -- georref
  'C_1731_2017_demanda.pdf', -- pdf_demanda_nombre
  'C_1731_2017_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:44:55', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:27:43 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);

-- ============================================
-- Fin del archivo SQL
-- ============================================