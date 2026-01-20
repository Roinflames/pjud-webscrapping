<?php
header('Content-Type: application/json; charset=utf-8');

$rol = $_GET['rol'] ?? null;
$action = $_GET['action'] ?? 'movimientos'; // movimientos | pdf

if (!$rol) {
    http_response_code(400);
    echo json_encode(['error' => 'Falta parámetro rol']);
    exit;
}

// Configuración de base de datos
$dbHost = getenv('DB_HOST') ?: 'localhost';
$dbName = getenv('DB_NAME') ?: 'codi_ejamtest';
$dbUser = getenv('DB_USER') ?: 'root';
$dbPass = getenv('DB_PASS') ?: '';

try {
    $pdo = new PDO(
        "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4",
        $dbUser,
        $dbPass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
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
 */
function buscarEnArchivos($rol) {
    $rol_limpio = strtolower($rol);
    $rol_limpio = str_replace(['c-', 'C-'], '', $rol_limpio);
    $rol_limpio = str_replace('-', '_', $rol_limpio);

    $archivoJson = __DIR__ . "/../../src/outputs/resultado_{$rol_limpio}.json";
    $archivoCsv = __DIR__ . "/../../src/outputs/resultado_{$rol_limpio}.csv";

    if (file_exists($archivoJson)) {
        return json_decode(file_get_contents($archivoJson), true);
    }

    if (file_exists($archivoCsv)) {
        $movimientos = [];
        $handle = fopen($archivoCsv, 'r');

        if ($handle) {
            fgetcsv($handle, 0, ';'); // headers

            while (($row = fgetcsv($handle, 0, ';')) !== false) {
                $movimientos[] = [
                    $row[6] ?? '',
                    $row[7] === 'SI' ? 'Descargar Documento' : '',
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
    }

    return null;
}
