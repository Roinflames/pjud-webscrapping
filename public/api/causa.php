<?php
header('Content-Type: application/json; charset=utf-8');

$rol = $_GET['rol'] ?? null;
$action = $_GET['action'] ?? 'movimientos';

if (!$rol) {
    http_response_code(400);
    echo json_encode(['error' => 'Falta parámetro rol']);
    exit;
}

// ============================================================
// ESTRATEGIA: Buscar archivos PRIMERO, base de datos como fallback
// ============================================================

// 1. Buscar en archivos JSON/CSV
$resultado = buscarEnArchivos($rol);
if ($resultado) {
    echo json_encode($resultado, JSON_UNESCAPED_UNICODE);
    exit;
}

// 2. Fallback: base de datos (con timeout para no colgar)
$dbHost = getenv('DB_HOST') ?: 'localhost';
$dbName = getenv('DB_NAME') ?: 'codi_ejamtest';
$dbUser = getenv('DB_USER') ?: 'root';
$dbPass = getenv('DB_PASS') ?: '';

try {
    $pdo = new PDO(
        "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4",
        $dbUser,
        $dbPass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 3
        ]
    );

    if ($action === 'pdf') {
        $indice = $_GET['indice'] ?? null;
        $tipo = $_GET['tipo'] ?? 'principal';

        if (!$indice) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta parámetro indice']);
            exit;
        }

        $stmt = $pdo->prepare("
            SELECT nombre_archivo, contenido_base64, tamano_bytes
            FROM movimientos_pdf
            WHERE rit = :rit AND indice = :indice AND tipo = :tipo
        ");
        $stmt->execute(['rit' => $rol, 'indice' => $indice, 'tipo' => $tipo]);
        $pdf = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$pdf) {
            http_response_code(404);
            echo json_encode(['error' => 'PDF no encontrado']);
            exit;
        }

        $format = $_GET['format'] ?? 'json';
        if ($format === 'download') {
            header('Content-Type: application/pdf');
            header('Content-Disposition: attachment; filename="' . $pdf['nombre_archivo'] . '"');
            echo base64_decode($pdf['contenido_base64']);
            exit;
        }

        echo json_encode([
            'nombre' => $pdf['nombre_archivo'],
            'base64' => $pdf['contenido_base64'],
            'tamano' => $pdf['tamano_bytes']
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Obtener movimientos desde BD
    $stmt = $pdo->prepare("
        SELECT m.folio, m.tiene_pdf, m.tipo_movimiento, m.subtipo_movimiento,
               m.descripcion, m.fecha, m.caratulado, m.juzgado, m.indice
        FROM movimientos m
        WHERE m.rit = :rit
        ORDER BY m.indice DESC
    ");
    $stmt->execute(['rit' => $rol]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($rows) === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Archivo de resultados no encontrado']);
        exit;
    }

    $movimientos = [];
    $cabecera = null;

    foreach ($rows as $row) {
        $movimientos[] = [
            $row['folio'] ?? '',
            $row['tiene_pdf'] ? 'Descargar Documento' : '',
            $row['folio'] ?? '',
            $row['tipo_movimiento'] ?? '',
            $row['subtipo_movimiento'] ?? '',
            $row['descripcion'] ?? '',
            $row['fecha'] ?? '',
            '',
            ''
        ];

        if ($cabecera === null) {
            $cabecera = [
                '',
                $rol,
                $row['fecha'] ?? '',
                $row['caratulado'] ?? '',
                $row['juzgado'] ?? ''
            ];
        }
    }

    array_unshift($movimientos, [], $cabecera);
    echo json_encode($movimientos, JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(404);
    echo json_encode(['error' => 'Archivo de resultados no encontrado']);
}

// ============================================================
// FUNCIONES
// ============================================================

/**
 * Buscar datos en archivos JSON/CSV locales
 */
function buscarEnArchivos($rol) {
    // Normalizar ROL: "C-13786-2018" → "13786_2018" y "C_13786_2018"
    $rol_sin_prefijo = preg_replace('/^[A-Za-z]-/', '', $rol);
    $rol_sin_prefijo = str_replace('-', '_', $rol_sin_prefijo);

    $rol_con_prefijo = 'C_' . $rol_sin_prefijo;

    $baseDir = __DIR__ . '/../../src/outputs';

    // Rutas posibles para JSON
    $rutasJson = [
        $baseDir . "/resultado_{$rol_con_prefijo}.json",
        $baseDir . "/resultado_{$rol_sin_prefijo}.json",
        $baseDir . "/causas/{$rol_con_prefijo}.json",
        $baseDir . "/movimientos_{$rol_con_prefijo}.json",
        $baseDir . "/movimientos_{$rol_sin_prefijo}.json",
    ];

    // Rutas posibles para CSV
    $rutasCsv = [
        $baseDir . "/resultado_{$rol_con_prefijo}.csv",
        $baseDir . "/resultado_{$rol_sin_prefijo}.csv",
    ];

    // Buscar JSON primero
    foreach ($rutasJson as $archivoJson) {
        if (file_exists($archivoJson)) {
            $data = json_decode(file_get_contents($archivoJson), true);
            if ($data) {
                // Formato 1: causas/C_XXX.json con metadata y config_entrada
                if (isset($data['metadata']) && isset($data['config_entrada'])) {
                    return convertirNuevoFormatoALegacy($data, $rol);
                }
                // Formato 2: movimientos_XXX.json con causa y metadata (sin config_entrada)
                if (isset($data['metadata']) && isset($data['causa'])) {
                    return convertirMovimientosFormatoALegacy($data, $rol);
                }
                // Formato 3: resultado_XXX.json con array de objetos [{indice, folio, rit...}]
                if (is_array($data) && isset($data[0]) && is_array($data[0]) && isset($data[0]['indice'])) {
                    return convertirResultadoALegacy($data, $rol);
                }
                // Formato 4: Ya es formato legacy (array de arrays) - filtrar y normalizar
                if (is_array($data) && isset($data[0]) && is_array($data[0])) {
                    return filtrarFormatoLegacy($data, $rol);
                }
                return $data;
            }
        }
    }

    // Buscar en CSV como fallback
    foreach ($rutasCsv as $archivoCsv) {
        if (file_exists($archivoCsv)) {
            return parsearCSV($archivoCsv, $rol);
        }
    }

    return null;
}

/**
 * Convierte el nuevo formato JSON estructurado (causas/C_XXX.json) al formato legacy
 */
function convertirNuevoFormatoALegacy($data, $rol) {
    $movimientos = [];
    $causa = $data['causa'] ?? [];
    $metadata = $data['metadata'] ?? [];

    $cabecera = [
        '',
        $causa['rit'] ?? $rol,
        $causa['fecha_ingreso'] ?? '',
        $causa['caratulado'] ?? '',
        $causa['juzgado'] ?? ''
    ];

    foreach (($data['movimientos'] ?? []) as $mov) {
        $movimientos[] = [
            $mov['folio'] ?? '',
            ($mov['tiene_pdf'] ?? false) ? 'Descargar Documento' : '',
            $mov['folio'] ?? '',
            $mov['etapa'] ?? '',
            $mov['tramite'] ?? '',
            $mov['descripcion'] ?? '',
            $mov['fecha'] ?? '',
            $mov['foja'] ?? '',
            $mov['georef'] ?? ''
        ];
    }

    array_unshift($movimientos, [], $cabecera);
    return $movimientos;
}

/**
 * Convierte movimientos_XXX.json al formato legacy
 */
function convertirMovimientosFormatoALegacy($data, $rol) {
    $movimientos = [];
    $causa = $data['causa'] ?? [];

    $rit = $causa['rit'] ?? $rol;
    $rit = str_replace('_', '-', $rit);

    $cabecera = [
        '',
        $rit,
        $causa['fecha_ingreso'] ?? '',
        $causa['caratulado'] ?? '',
        $causa['juzgado'] ?? ''
    ];

    foreach (($data['movimientos'] ?? []) as $mov) {
        $movimientos[] = [
            $mov['folio'] ?? '',
            ($mov['tiene_pdf'] ?? false) ? 'Descargar Documento' : '',
            $mov['folio'] ?? '',
            $mov['etapa'] ?? '',
            $mov['tramite'] ?? '',
            $mov['descripcion'] ?? '',
            $mov['fecha'] ?? '',
            $mov['foja'] ?? '',
            $mov['georef'] ?? ''
        ];
    }

    array_unshift($movimientos, [], $cabecera);
    return $movimientos;
}

/**
 * Convierte resultado_XXX.json (array de objetos) al formato legacy
 * Maneja formato mixto: resultados de búsqueda + movimientos + litigantes
 */
function convertirResultadoALegacy($data, $rol) {
    $movimientos = [];
    $cabecera = null;

    // Buscar cabecera en resultados de búsqueda (raw con 5 elementos y RIT válido)
    foreach ($data as $obj) {
        $raw = $obj['raw'] ?? [];
        if (count($raw) === 5 && isset($raw[1]) && preg_match('/^C?-?\d+-\d{4}$/', $raw[1])) {
            $cabecera = [
                '',
                $raw[1],
                $raw[2],
                $raw[3],
                $raw[4]
            ];
            break;
        }
    }

    if (!$cabecera) {
        $primera = $data[0] ?? [];
        $cabecera = [
            '',
            $primera['rit'] ?? $rol,
            $primera['fecha'] ?? '',
            $primera['caratulado'] ?? '',
            $primera['juzgado'] ?? ''
        ];
    }

    // Convertir solo movimientos reales (raw con 9 elementos)
    foreach ($data as $obj) {
        $raw = $obj['raw'] ?? [];
        $folio = $obj['folio'] ?? '';

        // Saltar resultados de búsqueda (raw con 5 elementos)
        if (count($raw) === 5) continue;
        // Saltar paginación
        if (is_string($folio) && strpos($folio, 'Total de registros') !== false) continue;
        // Saltar litigantes
        if (in_array($folio, ['AB.DTE', 'DDO.', 'DTE.'])) continue;

        if (count($raw) === 9) {
            $tienePdf = ($raw[1] === 'Descargar Documento');
            $movimientos[] = [
                $raw[0],
                $tienePdf ? 'Descargar Documento' : '',
                $raw[0],
                $raw[3],
                $raw[4],
                $raw[5],
                $raw[6],
                $raw[7],
                $raw[8]
            ];
        }
    }

    array_unshift($movimientos, [], $cabecera);
    return $movimientos;
}

/**
 * Filtra y normaliza el formato legacy (array de arrays)
 * Elimina paginación, litigantes y filas innecesarias
 */
function filtrarFormatoLegacy($data, $rol) {
    $cabecera = null;
    $movimientos = [];

    foreach ($data as $row) {
        if (!is_array($row)) continue;

        // Detectar cabecera (tiene RIT en posición 1)
        if (!$cabecera && isset($row[1]) && is_string($row[1]) && preg_match('/^C?-?\d+-\d{4}$/', $row[1])) {
            $cabecera = $row;
            continue;
        }

        // Saltar paginación
        if (isset($row[0]) && is_string($row[0]) && strpos($row[0], 'Total de registros') !== false) {
            continue;
        }

        // Saltar litigantes
        if (isset($row[0]) && in_array($row[0], ['AB.DTE', 'DDO.', 'DTE.'])) {
            continue;
        }

        // Saltar filas con menos de 6 elementos
        if (count($row) < 6) continue;

        // Incluir movimientos con contenido real
        $hasContent = !empty($row[3]) || !empty($row[4]) || !empty($row[5]);
        if ($hasContent) {
            $movimientos[] = $row;
        }
    }

    $resultado = [[]];
    if ($cabecera) {
        $resultado[] = $cabecera;
    } else {
        $resultado[] = ['', $rol, '', '', ''];
    }

    return array_merge($resultado, $movimientos);
}

/**
 * Parsear archivo CSV
 */
function parsearCSV($archivoCsv, $rol) {
    $movimientos = [];
    $handle = fopen($archivoCsv, 'r');

    if (!$handle) return null;

    fgetcsv($handle, 0, ';'); // headers

    while (($row = fgetcsv($handle, 0, ';')) !== false) {
        $movimientos[] = [
            $row[6] ?? '',
            ($row[7] ?? '') === 'SI' ? 'Descargar Documento' : '',
            $row[6] ?? '',
            $row[3] ?? '',
            $row[4] ?? '',
            $row[5] ?? '',
            $row[2] ?? '',
            '',
            ''
        ];
    }
    fclose($handle);

    if (count($movimientos) > 0) {
        $handle = fopen($archivoCsv, 'r');
        fgetcsv($handle, 0, ';');
        $primeraFila = fgetcsv($handle, 0, ';');
        fclose($handle);

        $cabecera = [
            '',
            $primeraFila[0] ?? $rol,
            $primeraFila[2] ?? '',
            $primeraFila[8] ?? '',
            $primeraFila[9] ?? ''
        ];

        array_unshift($movimientos, [], $cabecera);
    }

    return $movimientos;
}
