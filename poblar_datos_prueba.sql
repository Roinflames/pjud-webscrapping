-- Poblar base de datos con causas de prueba del frontend puerto 8000
USE codi_ejamtest;

-- Limpiar datos existentes
DELETE FROM movimientos;
DELETE FROM causas;

-- Insertar causa C-16707-2019
INSERT INTO causas (
    rit, tipo_causa, rol, anio,
    competencia_id, competencia_nombre,
    corte_id, corte_nombre,
    tribunal_id, tribunal_nombre,
    caratulado, fecha_ingreso,
    estado, etapa,
    total_movimientos, total_pdfs,
    scraping_exitoso
) VALUES (
    'C-16707-2019', 'C', '16707', 2019,
    '3', 'Civil',
    '90', 'Corte de Apelaciones de Santiago',
    '276', '27 Juzgado Civil de Santiago',
    'PROMOTORA CMR FALABELLA/GUTIERREZ RAMOS CARLOS DOMINGO',
    '02/07/2019',
    'TERMINADA', 'Terminada',
    10, 5,
    1
);

-- Insertar movimientos de C-16707-2019
INSERT INTO movimientos (
    causa_id, rit, indice,
    etapa, tramite, descripcion, fecha, foja, folio,
    tiene_pdf, pdf_principal
) VALUES
(LAST_INSERT_ID(), 'C-16707-2019', 1, 'Ejecución', 'Sentencia', 'Sentencia definitiva', '15/03/2020', '100', '1', 1, '16707_2019_mov_1_azul.pdf'),
(LAST_INSERT_ID(), 'C-16707-2019', 2, 'Ejecución', 'Resolución', 'Resolución de cuaderno', '20/03/2020', '105', '2', 1, '16707_2019_mov_2_azul.pdf'),
(LAST_INSERT_ID(), 'C-16707-2019', 3, 'Ejecución', 'Escrito', 'Escrito de demanda ejecutiva', '25/03/2020', '110', '3', 1, '16707_2019_mov_3_azul.pdf'),
(LAST_INSERT_ID(), 'C-16707-2019', 4, 'Ejecución', 'Notificación', 'Notificación a demandado', '30/03/2020', '115', '4', 0, NULL),
(LAST_INSERT_ID(), 'C-16707-2019', 5, 'Ejecución', 'Diligencia', 'Diligencia receptor', '05/04/2020', '120', '5', 1, '16707_2019_mov_5_azul.pdf'),
(LAST_INSERT_ID(), 'C-16707-2019', 6, 'Ejecución', 'Resolución', 'Resolución de alzada', '10/04/2020', '125', '6', 0, NULL),
(LAST_INSERT_ID(), 'C-16707-2019', 7, 'Terminada', 'Sentencia', 'Sentencia ejecutoriada', '15/04/2020', '130', '7', 1, '16707_2019_mov_7_rojo.pdf'),
(LAST_INSERT_ID(), 'C-16707-2019', 8, 'Terminada', 'Archivo', 'Archivo provisional', '20/04/2020', '135', '8', 0, NULL),
(LAST_INSERT_ID(), 'C-16707-2019', 9, 'Terminada', 'Certificado', 'Certificado final', '25/04/2020', '140', '9', 1, '16707_2019_mov_9_azul.pdf'),
(LAST_INSERT_ID(), 'C-16707-2019', 10, 'Terminada', 'Archivo', 'Archivo definitivo', '30/04/2020', '145', '10', 0, NULL);

-- Insertar causa C-13786-2018
INSERT INTO causas (
    rit, tipo_causa, rol, anio,
    competencia_id, competencia_nombre,
    corte_id, corte_nombre,
    tribunal_id, tribunal_nombre,
    caratulado, fecha_ingreso,
    estado, etapa,
    total_movimientos, total_pdfs,
    scraping_exitoso
) VALUES (
    'C-13786-2018', 'C', '13786', 2018,
    '3', 'Civil',
    '90', 'Corte de Apelaciones de Santiago',
    '252', '1 Juzgado Civil de Santiago',
    'PROMOTORA CMR FALABELLA/PRUEBA SCRAPING',
    '15/05/2018',
    'EN_TRAMITE', 'Discusión',
    8, 4,
    1
);

-- Insertar movimientos de C-13786-2018
INSERT INTO movimientos (
    causa_id, rit, indice,
    etapa, tramite, descripcion, fecha, foja, folio,
    tiene_pdf, pdf_principal
) VALUES
(LAST_INSERT_ID(), 'C-13786-2018', 1, 'Discusión', 'Demanda', 'Demanda ordinaria civil', '20/05/2018', '1', '1', 1, '13786_2018_mov_1_azul.pdf'),
(LAST_INSERT_ID(), 'C-13786-2018', 2, 'Discusión', 'Proveído', 'Proveído traslado', '25/05/2018', '5', '2', 1, '13786_2018_mov_2_azul.pdf'),
(LAST_INSERT_ID(), 'C-13786-2018', 3, 'Discusión', 'Contestación', 'Contestación demanda', '10/06/2018', '10', '3', 1, '13786_2018_mov_3_azul.pdf'),
(LAST_INSERT_ID(), 'C-13786-2018', 4, 'Discusión', 'Resolución', 'Resolución recibe causa a prueba', '20/06/2018', '15', '4', 0, NULL),
(LAST_INSERT_ID(), 'C-13786-2018', 5, 'Prueba', 'Escrito', 'Lista de testigos', '01/07/2018', '20', '5', 1, '13786_2018_mov_5_azul.pdf'),
(LAST_INSERT_ID(), 'C-13786-2018', 6, 'Prueba', 'Audiencia', 'Audiencia de prueba', '15/07/2018', '25', '6', 0, NULL),
(LAST_INSERT_ID(), 'C-13786-2018', 7, 'Discusión', 'Observaciones', 'Observaciones a la prueba', '30/07/2018', '30', '7', 0, NULL),
(LAST_INSERT_ID(), 'C-13786-2018', 8, 'Discusión', 'Citación', 'Citación para oír sentencia', '10/08/2018', '35', '8', 0, NULL);

-- Verificar datos insertados
SELECT 'Causas insertadas:' as mensaje;
SELECT rit, caratulado, tribunal_nombre, total_movimientos FROM causas;

SELECT '\nMovimientos insertados:' as mensaje;
SELECT COUNT(*) as total FROM movimientos GROUP BY rit;

SELECT '\nResumen por RIT:' as mensaje;
SELECT
    c.rit,
    c.caratulado,
    c.total_movimientos,
    COUNT(m.id) as movimientos_reales
FROM causas c
LEFT JOIN movimientos m ON c.id = m.causa_id
GROUP BY c.id;
