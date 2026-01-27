<?php
header('Content-Type: application/json; charset=utf-8');

$rol = $_GET['rol'] ?? null;
$action = $_GET['action'] ?? 'movimientos'; // movimientos | pdf

if (!$rol) {
    http_response_code(400);
    echo json_encode(['error' => 'Falta parámetro rol']);
    exit;
}

// PRIMERO: Intentar buscar en archivos (más rápido, sin dependencia de DB)
if ($action === 'movimientos') {
    $resultado = buscarEnArchivos($rol);
    if ($resultado) {
        echo json_encode($resultado, JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// SEGUNDO: Si no hay archivos, intentar base de datos
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
            PDO::ATTR_TIMEOUT => 3  // Timeout de 3 segundos
        ]
    );

    // Acción: Obtener PDF específico
    if ($action === 'pdf') {
        $indice = $_GET['indice'] ?? null;
        $tipo = $_GET['tipo'] ?? 'principal'; // principal | anexo

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

        // Devolver PDF como descarga o como JSON con base64
        $format = $_GET['format'] ?? 'json';

        if ($format === 'download') {
            // Enviar como archivo PDF para descarga
            header('Content-Type: application/pdf');
            header('Content-Disposition: attachment; filename="' . $pdf['nombre_archivo'] . '"');
            echo base64_decode($pdf['contenido_base64']);
            exit;
        }

        // Devolver como JSON
        echo json_encode([
            'nombre' => $pdf['nombre_archivo'],
            'base64' => $pdf['contenido_base64'],
            'tamano' => $pdf['tamano_bytes']
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Acción por defecto: Obtener movimientos
    $includePdfs = ($_GET['include_pdfs'] ?? 'false') === 'true';

    if ($includePdfs) {
        // Consulta con PDFs en base64
        $stmt = $pdo->prepare("
            SELECT
                m.folio,
                m.tiene_pdf,
                m.tipo_movimiento,
                m.subtipo_movimiento,
                m.descripcion,
                m.fecha,
                m.caratulado,
                m.juzgado,
                m.indice,
                pp.contenido_base64 AS pdf_principal_base64,
                pp.nombre_archivo AS pdf_principal_nombre,
                pa.contenido_base64 AS pdf_anexo_base64,
                pa.nombre_archivo AS pdf_anexo_nombre
            FROM movimientos m
            LEFT JOIN movimientos_pdf pp ON m.id = pp.movimiento_id AND pp.tipo = 'principal'
            LEFT JOIN movimientos_pdf pa ON m.id = pa.movimiento_id AND pa.tipo = 'anexo'
            WHERE m.rit = :rit
            ORDER BY m.indice DESC
        ");
    } else {
        // Consulta sin PDFs (más rápida)
        $stmt = $pdo->prepare("
            SELECT
                m.folio,
                m.tiene_pdf,
                m.tipo_movimiento,
                m.subtipo_movimiento,
                m.descripcion,
                m.fecha,
                m.caratulado,
                m.juzgado,
                m.indice,
                pp.nombre_archivo AS pdf_principal_nombre,
                pa.nombre_archivo AS pdf_anexo_nombre
            FROM movimientos m
            LEFT JOIN movimientos_pdf pp ON m.id = pp.movimiento_id AND pp.tipo = 'principal'
            LEFT JOIN movimientos_pdf pa ON m.id = pa.movimiento_id AND pa.tipo = 'anexo'
            WHERE m.rit = :rit
            ORDER BY m.indice DESC
        ");
    }

    $stmt->execute(['rit' => $rol]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($rows) === 0) {
        // Fallback a archivos CSV/JSON
        $resultado = buscarEnArchivos($rol);
        if ($resultado) {
            echo json_encode($resultado, JSON_UNESCAPED_UNICODE);
            exit;
        }

        http_response_code(404);
        echo json_encode(['error' => 'No se encontraron movimientos para este RIT']);
        exit;
    }

    // Formatear respuesta
    $movimientos = [];
    $cabecera = null;
    $pdfs = [];

    foreach ($rows as $row) {
        $movimiento = [
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

        // Agregar info de PDFs si están disponibles
        if ($row['pdf_principal_nombre']) {
            $movimiento['pdf_principal'] = $row['pdf_principal_nombre'];
            if ($includePdfs && $row['pdf_principal_base64']) {
                $pdfs[$row['pdf_principal_nombre']] = $row['pdf_principal_base64'];
            }
        }
        if ($row['pdf_anexo_nombre']) {
            $movimiento['pdf_anexo'] = $row['pdf_anexo_nombre'];
            if ($includePdfs && $row['pdf_anexo_base64']) {
                $pdfs[$row['pdf_anexo_nombre']] = $row['pdf_anexo_base64'];
            }
        }

        $movimientos[] = $movimiento;

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

    // Respuesta estructurada
    $response = $movimientos;

    // Si se solicitaron PDFs, agregarlos al final
    if ($includePdfs && count($pdfs) > 0) {
        $response = [
            'movimientos' => $movimientos,
            'pdfs' => $pdfs,
            'total_pdfs' => count($pdfs)
        ];
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    // Fallback a archivos
    $resultado = buscarEnArchivos($rol);
    if ($resultado) {
        echo json_encode($resultado, JSON_UNESCAPED_UNICODE);
        exit;
    }

    http_response_code(500);
    echo json_encode(['error' => 'Error de base de datos: ' . $e->getMessage()]);
}

/**
 * Fallback: buscar en archivos CSV/JSON
 * Busca en múltiples formatos de nombre para mayor compatibilidad
 */
function buscarEnArchivos($rol) {
    // Formato 1: Con prefijo (C_13786_2018)
    $rol_con_prefijo = str_replace('-', '_', $rol);

    // Formato 2: Sin prefijo (13786_2018)
    $rol_sin_prefijo = strtolower($rol);
    $rol_sin_prefijo = preg_replace('/^[a-z]-/i', '', $rol_sin_prefijo);
    $rol_sin_prefijo = str_replace('-', '_', $rol_sin_prefijo);

    // Rutas posibles para JSON (solo src/outputs)
    $rutasJson = [
        __DIR__ . "/../../src/outputs/resultado_{$rol_con_prefijo}.json",   // Con prefijo
        __DIR__ . "/../../src/outputs/resultado_{$rol_sin_prefijo}.json",   // Sin prefijo
        __DIR__ . "/../../src/outputs/causas/{$rol_con_prefijo}.json",      // Causas estructuradas
        __DIR__ . "/../../src/outputs/movimientos_{$rol_con_prefijo}.json", // Movimientos con prefijo
        __DIR__ . "/../../src/outputs/movimientos_{$rol_sin_prefijo}.json", // Movimientos sin prefijo
    ];

    // Rutas posibles para CSV
    $rutasCsv = [
        __DIR__ . "/../../src/outputs/resultado_{$rol_con_prefijo}.csv",
        __DIR__ . "/../../src/outputs/resultado_{$rol_sin_prefijo}.csv",
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
                if (is_array($data) && isset($data[0]['indice'])) {
                    return convertirResultadoALegacy($data, $rol);
                }
                // Formato 4: Ya es formato legacy (array de arrays) - filtrar y normalizar
                return filtrarFormatoLegacy($data, $rol);
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

    // Cabecera
    $cabecera = [
        '',
        $rol,
        $data['datos_basicos']['fecha'] ?? '',
        $data['cabecera']['caratulado'] ?? $data['datos_basicos']['caratulado'] ?? '',
        $data['cabecera']['juzgado'] ?? ''
    ];

    // Convertir movimientos
    if (isset($data['movimientos']) && is_array($data['movimientos'])) {
        foreach ($data['movimientos'] as $mov) {
            $movimientos[] = [
                $mov['folio'] ?? '',
                ($mov['tiene_pdf'] ?? false) ? 'Descargar Documento' : '',
                $mov['folio'] ?? '',
                $mov['etapa'] ?? '',
                $mov['tramite'] ?? '',
                $mov['descripcion'] ?? '',
                $mov['fecha'] ?? '',
                $mov['foja'] ?? '',
                ''
            ];
        }
    }

    array_unshift($movimientos, [], $cabecera);
    return $movimientos;
}

/**
 * Convierte el formato movimientos_XXX.json (con causa y metadata) al formato legacy
 */
function convertirMovimientosFormatoALegacy($data, $rol) {
    $movimientos = [];

    // Cabecera desde $data['causa']
    $causa = $data['causa'] ?? [];
    $cabecera = [
        '',
        $causa['rit'] ?? $rol,
        $causa['fecha_ingreso'] ?? '',
        $causa['caratulado'] ?? '',
        $causa['juzgado'] ?? ''
    ];

    // Convertir movimientos si existen
    if (isset($data['movimientos']) && is_array($data['movimientos'])) {
        foreach ($data['movimientos'] as $mov) {
            $movimientos[] = [
                $mov['folio'] ?? $mov['indice'] ?? '',
                ($mov['tiene_pdf'] ?? false) ? 'Descargar Documento' : '',
                $mov['folio'] ?? $mov['indice'] ?? '',
                $mov['etapa'] ?? '',
                $mov['tramite'] ?? '',
                $mov['descripcion'] ?? '',
                $mov['fecha'] ?? '',
                $mov['foja'] ?? '',
                ''
            ];
        }
    }

    array_unshift($movimientos, [], $cabecera);
    return $movimientos;
}

/**
 * Convierte el formato resultado_XXX.json (array de objetos) al formato legacy
 * Maneja formato mixto: resultados de búsqueda + movimientos + litigantes
 */
function convertirResultadoALegacy($data, $rol) {
    $movimientos = [];
    $cabecera = null;

    // Buscar la primera fila que sea resultado de búsqueda (raw con 5 elementos y RIT válido)
    foreach ($data as $obj) {
        $raw = $obj['raw'] ?? [];
        if (count($raw) === 5 && isset($raw[1]) && preg_match('/^C?-?\d+-\d{4}$/', $raw[1])) {
            $cabecera = [
                '',
                $raw[1],  // RIT
                $raw[2],  // fecha
                $raw[3],  // caratulado
                $raw[4]   // juzgado
            ];
            break;
        }
    }

    // Si no encontró cabecera en formato búsqueda, usar primer elemento
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

    // Convertir solo los movimientos reales (raw con 9 elementos, folio numérico)
    foreach ($data as $obj) {
        $raw = $obj['raw'] ?? [];
        $folio = $obj['folio'] ?? '';

        // Saltar filas que no son movimientos:
        // - Resultados de búsqueda (raw con 5 elementos)
        // - Paginación (contiene "Total de registros")
        // - Litigantes (folio es AB.DTE, DDO., DTE.)
        if (count($raw) === 5) continue;
        if (is_string($folio) && strpos($folio, 'Total de registros') !== false) continue;
        if (in_array($folio, ['AB.DTE', 'DDO.', 'DTE.'])) continue;

        // Movimientos reales tienen raw con 9 elementos
        if (count($raw) === 9) {
            $tienePdf = ($raw[1] === 'Descargar Documento');
            $movimientos[] = [
                $raw[0],  // folio
                $tienePdf ? 'Descargar Documento' : '',
                $raw[0],  // anexo (mismo que folio)
                $raw[3],  // etapa
                $raw[4],  // tramite
                $raw[5],  // descripcion
                $raw[6],  // fecha
                $raw[7],  // foja
                $raw[8]   // georef
            ];
        } elseif (count($raw) === 4 && !in_array($raw[0], ['AB.DTE', 'DDO.', 'DTE.'])) {
            // Litigantes tienen raw con 4 elementos - saltar
            continue;
        }
    }

    array_unshift($movimientos, [], $cabecera);
    return $movimientos;
}

/**
 * Parsea un archivo CSV y lo convierte al formato esperado
 */
function parsearCSV($archivoCsv, $rol) {
    $movimientos = [];
    $handle = fopen($archivoCsv, 'r');

    if (!$handle) {
        return null;
    }

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

/**
 * Filtra y normaliza el formato legacy (array de arrays)
 * Elimina paginación, litigantes y filas vacías innecesarias
 */
function filtrarFormatoLegacy($data, $rol) {
    $cabecera = null;
    $movimientos = [];

    foreach ($data as $row) {
        if (!is_array($row)) continue;

        // Detectar cabecera (tiene RIT en posición 1)
        if (isset($row[1]) && is_string($row[1]) && preg_match('/^C?-?\d+-\d{4}$/', $row[1])) {
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

        // Saltar filas completamente vacías o con menos de 6 elementos
        if (count($row) < 6) continue;

        // Incluir movimientos válidos (folio numérico o vacío pero con datos en otras posiciones)
        $hasContent = !empty($row[3]) || !empty($row[4]) || !empty($row[5]);

        if ($hasContent) {
            $movimientos[] = $row;
        }
    }

    // Construir resultado con formato esperado
    $resultado = [[]];  // Fila vacía inicial

    if ($cabecera) {
        $resultado[] = $cabecera;
    } else {
        // Cabecera por defecto
        $resultado[] = ['', $rol, '', '', ''];
    }

    return array_merge($resultado, $movimientos);
}
