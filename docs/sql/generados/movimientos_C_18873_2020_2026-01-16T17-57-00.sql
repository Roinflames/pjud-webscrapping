-- ============================================
-- SQL Generado para RIT: C-18873-2020
-- Fecha: 2026-01-16T17:57:00.726Z
-- Cantidad de movimientos: 28
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
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '28',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Terminada',  -- etapa
  'Resolución',  -- tramite
  'Archivo del expediente en el Tribunal', -- desc_tramite
  '2022-01-25', -- fec_tramite
  '2', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '27',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Terminada',  -- etapa
  'Resolución',  -- tramite
  'Recepción oficio', -- desc_tramite
  '2021-07-21', -- fec_tramite
  '25', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '26',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Terminada',  -- etapa
  'Escrito',  -- tramite
  'Contesta oficio', -- desc_tramite
  '2021-07-19', -- fec_tramite
  '24', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '25',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Terminada',  -- etapa
  'Actuación Receptor',  -- tramite
  'Lanzamiento con fuerza pública (Realizada) Diligencia:09/07/2021 21:18', -- desc_tramite
  '2021-07-09', -- fec_tramite
  '0', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '24',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Terminada',  -- etapa
  'Resolución',  -- tramite
  'Mero trámite', -- desc_tramite
  '2021-06-01', -- fec_tramite
  '23', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '23',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Terminada',  -- etapa
  'Escrito',  -- tramite
  'Lanzamiento', -- desc_tramite
  '2021-05-28', -- fec_tramite
  '22', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '22',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Terminada',  -- etapa
  'Actuación Receptor',  -- tramite
  'Notificación por cédula de otras resoluciones (Exitosa) Diligencia:25/05/2021 17:45', -- desc_tramite
  '2021-05-26', -- fec_tramite
  '0', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '21',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Terminada',  -- etapa
  'Resolución',  -- tramite
  'Mero trámite', -- desc_tramite
  '2021-05-17', -- fec_tramite
  '21', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '20',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Terminada',  -- etapa
  'Escrito',  -- tramite
  'Lanzamiento', -- desc_tramite
  '2021-05-07', -- fec_tramite
  '20', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '19',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Aud.Contes.y Concil./Recib. a prueba',  -- etapa
  'Resolución',  -- tramite
  'Ratifica conciliación', -- desc_tramite
  '2021-02-12', -- fec_tramite
  '19', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '18',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Aud.Contes.y Concil./Recib. a prueba',  -- etapa
  'Escrito',  -- tramite
  'Cumple lo ordenado', -- desc_tramite
  '2021-02-10', -- fec_tramite
  '18', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '17',  -- folio
  'C_18873_2020_mov_17_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Aud.Contes.y Concil./Recib. a prueba',  -- etapa
  '(COM)Comparendo',  -- tramite
  'Aud. de contestación y conciliación', -- desc_tramite
  '2021-02-09', -- fec_tramite
  '17', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '16',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Aud.Contes.y Concil./Recib. a prueba',  -- etapa
  'Escrito',  -- tramite
  'Patrocinio y poder', -- desc_tramite
  '2021-02-08', -- fec_tramite
  '16', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '15',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Aud.Contes.y Concil./Recib. a prueba',  -- etapa
  '(COM)Comparendo',  -- tramite
  'Suspende audiencia', -- desc_tramite
  '2021-02-01', -- fec_tramite
  '15', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '14',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Aud.Contes.y Concil./Recib. a prueba',  -- etapa
  'Resolución',  -- tramite
  'Mero trámite', -- desc_tramite
  '2021-01-29', -- fec_tramite
  '14', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '13',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  '(NOT)Notificacion',  -- tramite
  'Notificación de demanda', -- desc_tramite
  '2021-01-27', -- fec_tramite
  '13', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '12',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Actuación Receptor',  -- tramite
  'Certificación (Realizada) Diligencia:27/01/2021 15:56', -- desc_tramite
  '2021-01-27', -- fec_tramite
  '0', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '11',  -- folio
  'C_18873_2020_mov_11_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Escrito',  -- tramite
  'Tenga presente', -- desc_tramite
  '2021-01-27', -- fec_tramite
  '7', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '10',  -- folio
  'C_18873_2020_mov_10_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Actuación Receptor',  -- tramite
  'NOTIFICACIÓN DE DEMANDA (Exitosa) Diligencia:25/01/2021 18:36', -- desc_tramite
  '2021-01-26', -- fec_tramite
  '0', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '9',  -- folio
  'C_18873_2020_mov_9_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Resolución',  -- tramite
  'Notificación por art. 44 C.P.C.', -- desc_tramite
  '2021-01-20', -- fec_tramite
  '6', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '8',  -- folio
  NULL,  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Escrito',  -- tramite
  'Notificación por art. 44', -- desc_tramite
  '2021-01-19', -- fec_tramite
  '5', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '7',  -- folio
  'C_18873_2020_mov_7_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Actuación Receptor',  -- tramite
  'CERTIFICACIÓN BÚSQUEDAS (Búsqueda positiva) Diligencia:13/01/2021 16:28', -- desc_tramite
  '2021-01-14', -- fec_tramite
  '0', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '6',  -- folio
  'C_18873_2020_mov_6_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Notificación demanda y su proveído',  -- etapa
  'Actuación Receptor',  -- tramite
  'CERTIFICACIÓN BÚSQUEDAS (Búsqueda positiva) Diligencia:11/01/2021 15:50', -- desc_tramite
  '2021-01-12', -- fec_tramite
  '0', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '5',  -- folio
  'C_18873_2020_mov_5_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Inicio tramitación',  -- etapa
  'Resolución',  -- tramite
  'Da curso a la demanda y cita a comparendo', -- desc_tramite
  '2021-01-04', -- fec_tramite
  '4', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '4',  -- folio
  'C_18873_2020_mov_4_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Inicio tramitación',  -- etapa
  NULL,  -- tramite
  'Acredita Poder', -- desc_tramite
  '2020-12-31', -- fec_tramite
  '0', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '3',  -- folio
  'C_18873_2020_mov_3_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Inicio tramitación',  -- etapa
  'Escrito',  -- tramite
  'Cumple lo ordenado', -- desc_tramite
  '2020-12-29', -- fec_tramite
  '3', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '2',  -- folio
  'C_18873_2020_mov_2_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Inicio tramitación',  -- etapa
  'Resolución',  -- tramite
  'Apercibimiento poder y/o título', -- desc_tramite
  '2020-12-28', -- fec_tramite
  '2', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);
INSERT INTO pjud_movimientos_intermedia 
  (rit, competencia_id, corte_id, tribunal_id, folio, doc_principal_nombre, doc_anexo_nombre, anexo_texto, etapa, tramite, desc_tramite, fec_tramite, foja, georref, pdf_demanda_nombre, pdf_ebook_nombre, fecha_consulta_actual, fecha_consulta_anterior)
VALUES (
  'C-18873-2020',  -- rit
  3,  -- competencia_id
  90,  -- corte_id
  NULL,  -- tribunal_id
  '1',  -- folio
  'C_18873_2020_mov_1_P.pdf',  -- doc_principal_nombre
  NULL,  -- doc_anexo_nombre
  NULL,  -- anexo_texto
  'Inicio tramitación',  -- etapa
  'Escrito',  -- tramite
  'Ingreso demanda', -- desc_tramite
  '2020-12-24', -- fec_tramite
  '1', -- foja
  NULL, -- georref
  'C_18873_2020_demanda.pdf', -- pdf_demanda_nombre
  'C_18873_2020_ebook.pdf', -- pdf_ebook_nombre
  '2026-01-16 17:57:00', -- fecha_consulta_actual
  'Fri Jan 16 2026 17:21:06 GMT-0300 (Chile Summer Time)'  -- fecha_consulta_anterior
);

-- ============================================
-- Fin del archivo SQL
-- ============================================