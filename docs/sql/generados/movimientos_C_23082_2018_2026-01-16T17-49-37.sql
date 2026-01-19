-- ============================================
-- SQL Generado para RIT: C-23082-2018
-- Fecha: 2026-01-16T17:49:37.990Z
-- Cantidad de movimientos: 21
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
  'C-23082-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '20',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Terminada',  -- etapa
  'Resolución',  -- tramite
  'Archivo del expediente en el Tribunal', -- desc_tramite
  '2021-01-13', -- fec_tramite
  '14', -- foja
  NULL, -- georref
  'C_23082_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_23082_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:49:37', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:32:24 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23082-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '20',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  NULL,  -- etapa
  NULL,  -- tramite
  'Tiene por pagado el crédito', -- desc_tramite
  '2021-01-13', -- fec_tramite
  '14', -- foja
  NULL, -- georref
  'C_23082_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_23082_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:49:37', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:32:24 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23082-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '19',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Terminada',  -- etapa
  'Escrito',  -- tramite
  'Da cuenta de pago', -- desc_tramite
  '2021-01-08', -- fec_tramite
  '13', -- foja
  NULL, -- georref
  'C_23082_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_23082_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:49:37', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:32:24 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23082-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '18',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Terminada',  -- etapa
  'Resolución',  -- tramite
  'Por recibido el desarchivo', -- desc_tramite
  '2020-12-21', -- fec_tramite
  '12', -- foja
  NULL, -- georref
  'C_23082_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_23082_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:49:37', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:32:24 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23082-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '17',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Terminada',  -- etapa
  'Escrito',  -- tramite
  'Desarchivo', -- desc_tramite
  '2020-12-18', -- fec_tramite
  '11', -- foja
  NULL, -- georref
  'C_23082_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_23082_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:49:37', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:32:24 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23082-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '16',  -- folio
  'C_23082_2018_mov_16_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Terminada',  -- etapa
  'Resolución',  -- tramite
  'Archivo del expediente en el Tribunal', -- desc_tramite
  '2019-11-13', -- fec_tramite
  '2', -- foja
  NULL, -- georref
  'C_23082_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_23082_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:49:37', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:32:24 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23082-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '15',  -- folio
  'C_23082_2018_mov_15_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Excepciones',  -- etapa
  '(CER)Certificacion',  -- tramite
  'Certifica que no se opuso excepciones', -- desc_tramite
  '2019-05-06', -- fec_tramite
  '10', -- foja
  NULL, -- georref
  'C_23082_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_23082_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:49:37', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:32:24 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23082-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '14',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Resolución',  -- tramite
  'Certifíquese', -- desc_tramite
  '2019-04-29', -- fec_tramite
  '9', -- foja
  NULL, -- georref
  'C_23082_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_23082_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:49:37', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:32:24 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23082-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '13',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Escrito',  -- tramite
  'Certificación que se indica', -- desc_tramite
  '2019-04-26', -- fec_tramite
  '8', -- foja
  NULL, -- georref
  'C_23082_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_23082_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:49:37', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:32:24 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23082-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '12',  -- folio
  'C_23082_2018_mov_12_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Actuación Receptor',  -- tramite
  'NOTIFICACIÓN DE DEMANDA (Exitosa) Diligencia:25/03/2019 12:36', -- desc_tramite
  '2019-03-28', -- fec_tramite
  '0', -- foja
  NULL, -- georref
  'C_23082_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_23082_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:49:37', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:32:24 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23082-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '11',  -- folio
  'C_23082_2018_mov_11_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Resolución',  -- tramite
  'Notificación por art. 44 C.P.C.', -- desc_tramite
  '2018-12-18', -- fec_tramite
  '7', -- foja
  NULL, -- georref
  'C_23082_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_23082_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:49:37', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:32:24 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23082-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '10',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Escrito',  -- tramite
  'Notificación por art. 44', -- desc_tramite
  '2018-12-14', -- fec_tramite
  '6', -- foja
  NULL, -- georref
  'C_23082_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_23082_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:49:37', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:32:24 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23082-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '9',  -- folio
  'C_23082_2018_mov_9_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Actuación Receptor',  -- tramite
  'NOTIFICACIÓN DE DEMANDA (Certificación) Diligencia:06/12/2018 16:26', -- desc_tramite
  '2018-12-11', -- fec_tramite
  '0', -- foja
  NULL, -- georref
  'C_23082_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_23082_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:49:37', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:32:24 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23082-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '8',  -- folio
  'C_23082_2018_mov_8_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Actuación Receptor',  -- tramite
  'NOTIFICACIÓN DE DEMANDA (Certificación) Diligencia:31/10/2018 13:12', -- desc_tramite
  '2018-11-07', -- fec_tramite
  '0', -- foja
  NULL, -- georref
  'C_23082_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_23082_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:49:37', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:32:24 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23082-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '7',  -- folio
  'C_23082_2018_mov_7_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Inicio de la Tramitación',  -- etapa
  'Resolución',  -- tramite
  'Ordena despachar mandamiento', -- desc_tramite
  '2018-09-05', -- fec_tramite
  '5', -- foja
  NULL, -- georref
  'C_23082_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_23082_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:49:37', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:32:24 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23082-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '6',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Inicio de la Tramitación',  -- etapa
  NULL,  -- tramite
  'Acredita Poder', -- desc_tramite
  '2018-09-05', -- fec_tramite
  '0', -- foja
  NULL, -- georref
  'C_23082_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_23082_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:49:37', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:32:24 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23082-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '5',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Inicio de la Tramitación',  -- etapa
  'Escrito',  -- tramite
  'Cumple lo ordenado', -- desc_tramite
  '2018-07-31', -- fec_tramite
  '4', -- foja
  NULL, -- georref
  'C_23082_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_23082_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:49:37', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:32:24 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23082-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '4',  -- folio
  'C_23082_2018_mov_4_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Inicio de la Tramitación',  -- etapa
  'Resolución',  -- tramite
  'Pospone inicio de la tramitación', -- desc_tramite
  '2018-07-30', -- fec_tramite
  '3', -- foja
  NULL, -- georref
  'C_23082_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_23082_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:49:37', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:32:24 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23082-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '3',  -- folio
  'C_23082_2018_mov_3_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Inicio de la Tramitación',  -- etapa
  'Resolución',  -- tramite
  'Apercibimiento poder y/o título', -- desc_tramite
  '2018-07-27', -- fec_tramite
  '2', -- foja
  NULL, -- georref
  'C_23082_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_23082_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:49:37', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:32:24 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23082-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '2',  -- folio
  'C_23082_2018_mov_2_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Inicio de la Tramitación',  -- etapa
  'Escrito',  -- tramite
  'Acompaña documentos', -- desc_tramite
  '2018-07-26', -- fec_tramite
  '2', -- foja
  NULL, -- georref
  'C_23082_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_23082_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:49:37', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:32:24 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-23082-2018',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '1',  -- folio
  'C_23082_2018_mov_1_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Inicio de la Tramitación',  -- etapa
  'Escrito',  -- tramite
  'Ingreso demanda', -- desc_tramite
  '2018-07-26', -- fec_tramite
  '1', -- foja
  NULL, -- georref
  'C_23082_2018_demanda.pdf', -- pdf_demanda_nombre
  'C_23082_2018_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:49:37', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:32:24 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);

-- ============================================
-- Fin del archivo SQL
-- ============================================