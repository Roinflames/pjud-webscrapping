<?php
header('Content-Type: application/json; charset=utf-8');

$rol = $_GET['rol'] ?? null;

if (!$rol) {
    http_response_code(400);
    echo json_encode(['error' => 'Falta parámetro rol']);
    exit;
}

/*
  Convención de nombre:
  C-16707-2019  -> resultado_16707_2019.csv o resultado_16707_2019.json
*/
$rol_limpio = strtolower($rol);
$rol_limpio = str_replace(['c-', 'C-'], '', $rol_limpio);
$rol_limpio = str_replace('-', '_', $rol_limpio);

$archivoJson = __DIR__ . "/../../src/outputs/resultado_{$rol_limpio}.json";
$archivoCsv = __DIR__ . "/../../src/outputs/resultado_{$rol_limpio}.csv";

// Primero intentar JSON
if (file_exists($archivoJson)) {
    echo file_get_contents($archivoJson);
    exit;
}

// Si no hay JSON, intentar CSV
if (file_exists($archivoCsv)) {
    $movimientos = [];
    $handle = fopen($archivoCsv, 'r');

    if ($handle) {
        // Leer cabecera
        $headers = fgetcsv($handle, 0, ';');

        // Leer filas
        while (($row = fgetcsv($handle, 0, ';')) !== false) {
            // Convertir a array con los campos del CSV
            // headers: rit;indice;fecha;tipo_movimiento;subtipo_movimiento;descripcion;folio;tiene_pdf;caratulado;juzgado
            $movimientos[] = [
                $row[6] ?? '',  // folio (índice 0 en el array de salida)
                $row[7] === 'SI' ? 'Descargar Documento' : '',  // tiene_pdf (índice 1)
                $row[6] ?? '',  // anexo = folio (índice 2)
                $row[3] ?? '',  // etapa = tipo_movimiento (índice 3)
                $row[4] ?? '',  // tramite = subtipo_movimiento (índice 4)
                $row[5] ?? '',  // descripcion (índice 5)
                $row[2] ?? '',  // fecha (índice 6)
                '',             // foja (índice 7)
                ''              // georef (índice 8)
            ];
        }
        fclose($handle);

        // Agregar cabecera al inicio (primer movimiento tiene los datos de cabecera)
        if (count($movimientos) > 0) {
            // Obtener datos de cabecera del CSV
            $handle = fopen($archivoCsv, 'r');
            fgetcsv($handle, 0, ';'); // saltar headers
            $primeraFila = fgetcsv($handle, 0, ';');
            fclose($handle);

            $cabecera = [
                '',                         // índice 0
                $primeraFila[0] ?? $rol,    // RIT (índice 1)
                $primeraFila[2] ?? '',      // Fecha ingreso (índice 2)
                $primeraFila[8] ?? '',      // Caratulado/Promotora (índice 3)
                $primeraFila[9] ?? ''       // Juzgado/Tribunal (índice 4)
            ];

            // Insertar cabecera al inicio y una fila vacía
            array_unshift($movimientos, [], $cabecera);
        }
    }

    echo json_encode($movimientos, JSON_UNESCAPED_UNICODE);
    exit;
}

// No se encontró ningún archivo
http_response_code(404);
echo json_encode(['error' => 'Archivo de resultados no encontrado']);
