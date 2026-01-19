-- ============================================
-- SQL Generado para RIT: C-13786-2018
-- Fecha: 2026-01-16T18:32:35.401Z
-- Cantidad de movimientos: 17
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
  'C-13786-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '17',  -- folio
  'C_13786_2018_mov_17_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Resolución',  -- tramite
  'Archivo del expediente en el Tribunal', -- desc_tramite
  '2019-12-12', -- fec_tramite
  '10', -- foja
  NULL, -- georref
  'C_13786_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_13786_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 18:32:35', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:41:33 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-13786-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '16',  -- folio
  'C_13786_2018_mov_16_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Actuación Receptor',  -- tramite
  'NOTIFICACIÓN DE DEMANDA (Certificación) Diligencia:17/06/2019 17:22', -- desc_tramite
  '2019-06-18', -- fec_tramite
  '0', -- foja
  NULL, -- georref
  'C_13786_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_13786_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 18:32:35', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:41:33 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-13786-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '15',  -- folio
  'C_13786_2018_mov_15_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Actuación Receptor',  -- tramite
  'NOTIFICACIÓN DE DEMANDA (Certificación) Diligencia:17/06/2019 17:22', -- desc_tramite
  '2019-06-18', -- fec_tramite
  '0', -- foja
  NULL, -- georref
  'C_13786_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_13786_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 18:32:35', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:41:33 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-13786-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '14',  -- folio
  'C_13786_2018_mov_14_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Resolución',  -- tramite
  'Notificación por art. 44 C.P.C.', -- desc_tramite
  '2019-06-07', -- fec_tramite
  '9', -- foja
  NULL, -- georref
  'C_13786_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_13786_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 18:32:35', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:41:33 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-13786-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '13',  -- folio
  'C_13786_2018_mov_13_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Escrito',  -- tramite
  'Notificación por art. 44', -- desc_tramite
  '2019-06-05', -- fec_tramite
  '8', -- foja
  NULL, -- georref
  'C_13786_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_13786_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 18:32:35', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:41:33 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-13786-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '12',  -- folio
  'C_13786_2018_mov_12_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Actuación Receptor',  -- tramite
  'CERTIFICACIÓN BÚSQUEDAS (Búsqueda positiva) Diligencia:11/04/2019 16:48', -- desc_tramite
  '2019-04-12', -- fec_tramite
  '0', -- foja
  NULL, -- georref
  'C_13786_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_13786_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 18:32:35', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:41:33 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-13786-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '11',  -- folio
  'C_13786_2018_mov_11_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Actuación Receptor',  -- tramite
  'CERTIFICACIÓN BÚSQUEDAS (Búsqueda positiva) Diligencia:02/04/2019 17:30', -- desc_tramite
  '2019-04-04', -- fec_tramite
  '0', -- foja
  NULL, -- georref
  'C_13786_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_13786_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 18:32:35', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:41:33 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-13786-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '10',  -- folio
  'C_13786_2018_mov_10_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Resolución',  -- tramite
  'Por recibido el desarchivo', -- desc_tramite
  '2019-03-26', -- fec_tramite
  '7', -- foja
  NULL, -- georref
  'C_13786_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_13786_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 18:32:35', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:41:33 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-13786-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '9',  -- folio
  'C_13786_2018_mov_9_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Escrito',  -- tramite
  'Desarchivo', -- desc_tramite
  '2019-03-22', -- fec_tramite
  '6', -- foja
  NULL, -- georref
  'C_13786_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_13786_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 18:32:35', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:41:33 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-13786-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '8',  -- folio
  'C_13786_2018_mov_8_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Resolución',  -- tramite
  'Archivo del expediente en el Tribunal', -- desc_tramite
  '2018-10-05', -- fec_tramite
  '5', -- foja
  NULL, -- georref
  'C_13786_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_13786_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 18:32:35', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:41:33 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-13786-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '7',  -- folio
  'C_13786_2018_mov_7_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Actuación Receptor',  -- tramite
  'NOTIFICACIÓN DE DEMANDA (Búsqueda negativa) Diligencia:08/06/2018 12:30', -- desc_tramite
  '2018-06-08', -- fec_tramite
  '0', -- foja
  NULL, -- georref
  'C_13786_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_13786_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 18:32:35', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:41:33 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-13786-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '6',  -- folio
  'C_13786_2018_mov_6_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Actuación Receptor',  -- tramite
  'NOTIFICACIÓN DE DEMANDA (Búsqueda negativa) Diligencia:28/05/2018 13:24', -- desc_tramite
  '2018-05-29', -- fec_tramite
  '0', -- foja
  NULL, -- georref
  'C_13786_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_13786_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 18:32:35', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:41:33 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-13786-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '5',  -- folio
  'C_13786_2018_mov_5_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Inicio de la Tramitación',  -- etapa
  'Resolución',  -- tramite
  'Ordena despachar mandamiento', -- desc_tramite
  '2018-05-14', -- fec_tramite
  '4', -- foja
  NULL, -- georref
  'C_13786_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_13786_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 18:32:35', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:41:33 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-13786-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '4',  -- folio
  'C_13786_2018_mov_4_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Inicio de la Tramitación',  -- etapa
  NULL,  -- tramite
  'Acredita Poder', -- desc_tramite
  '2018-05-11', -- fec_tramite
  '0', -- foja
  NULL, -- georref
  'C_13786_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_13786_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 18:32:35', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:41:33 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-13786-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '3',  -- folio
  'C_13786_2018_mov_3_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Inicio de la Tramitación',  -- etapa
  'Escrito',  -- tramite
  'Acompaña documentos', -- desc_tramite
  '2018-05-10', -- fec_tramite
  '3', -- foja
  NULL, -- georref
  'C_13786_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_13786_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 18:32:35', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:41:33 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-13786-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '2',  -- folio
  'C_13786_2018_mov_2_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Inicio de la Tramitación',  -- etapa
  'Resolución',  -- tramite
  'Apercibimiento poder y/o título', -- desc_tramite
  '2018-05-10', -- fec_tramite
  '2', -- foja
  NULL, -- georref
  'C_13786_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_13786_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 18:32:35', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:41:33 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-13786-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '1',  -- folio
  'C_13786_2018_mov_1_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Inicio de la Tramitación',  -- etapa
  'Escrito',  -- tramite
  'Ingreso demanda', -- desc_tramite
  '2018-05-09', -- fec_tramite
  '1', -- foja
  NULL, -- georref
  'C_13786_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_13786_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 18:32:35', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:41:33 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);

-- ============================================
-- Fin del archivo SQL
-- ============================================