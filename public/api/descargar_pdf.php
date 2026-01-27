<?php
/**
 * Endpoint para servir PDFs desde MySQL
 * NO usar archivos, TODO desde base de datos
 */

$rit = $_GET['rit'] ?? null;
$folio = $_GET['folio'] ?? null;
$color = $_GET['color'] ?? 'azul'; // azul o rojo

if (!$rit || !$folio) {
    http_response_code(400);
    die('Faltan parámetros: rit y folio son requeridos');
}

// Cargar .env manualmente (buscar en raíz del proyecto)
$envFile = realpath(__DIR__ . '/../../.env') ?: realpath(__DIR__ . '/../.env');
if ($envFile && file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value, '"\'');
        if (!getenv($key)) {
            putenv("{$key}={$value}");
            $_ENV[$key] = $value;
        }
    }
}

$dbHost = getenv('DB_HOST') ?: 'localhost';
$dbPort = getenv('DB_PORT') ?: '3306';
$dbName = getenv('DB_NAME') ?: 'codi_ejamtest';
$dbUser = getenv('DB_USER') ?: 'root';
$dbPass = getenv('DB_PASS') ?: '';

try {
    $pdo = new PDO(
        "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8",
        $dbUser,
        $dbPass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Determinar tipo de PDF según color
    $tipoPdf = ($color === 'rojo') ? 'ANEXO' : 'PRINCIPAL';
    
    // Buscar el PDF directamente desde la tabla pdfs
    // Como los PDFs pueden tener movimiento_id NULL, buscamos por nombre de archivo
    // Formato esperado: C_3030_2017_mov_54_azul.pdf o C_3030_2017_mov_54_rojo.pdf
    $ritClean = str_replace('-', '_', $rit);
    $colorSuffix = ($color === 'rojo') ? 'rojo' : 'azul';
    $nombreEsperado = "{$ritClean}_mov_{$folio}_{$colorSuffix}.pdf";
    
    $stmt = $pdo->prepare("
        SELECT
            p.contenido_base64,
            p.nombre_archivo,
            p.tamano_bytes,
            p.tipo,
            p.rit
        FROM pdfs p
        WHERE p.rit = :rit 
          AND p.tipo = :tipo
          AND p.nombre_archivo = :nombre
        LIMIT 1
    ");
    
    $stmt->execute([
        'rit' => $rit, 
        'tipo' => $tipoPdf,
        'nombre' => $nombreEsperado
    ]);
    $pdf = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$pdf) {
        http_response_code(404);
        // Mensaje más descriptivo
        $mensaje = "PDF no encontrado para RIT: $rit, Folio: $folio, Color: $color (Tipo: $tipoPdf)";
        $mensaje .= "\n\nNota: No todos los movimientos tienen PDF rojo (anexo). Verifica que el movimiento tenga un PDF de este tipo.";
        die($mensaje);
    }

    // Si hay contenido en base64, servirlo
    if ($pdf['contenido_base64']) {
        $pdfContent = base64_decode($pdf['contenido_base64'], true);
        
        // Verificar que la decodificación fue exitosa
        if ($pdfContent === false) {
            http_response_code(500);
            die('Error decodificando PDF desde base64');
        }
        
        // Verificar que es un PDF válido (debe empezar con %PDF)
        if (substr($pdfContent, 0, 4) !== '%PDF') {
            http_response_code(500);
            die('El contenido no es un PDF válido. Puede ser un PDF de prueba. Ejecuta el scraper para descargar PDFs reales.');
        }
        
        header('Content-Type: application/pdf');
        header('Content-Disposition: inline; filename="' . $pdf['nombre_archivo'] . '"');
        if ($pdf['tamano_bytes']) {
            header('Content-Length: ' . $pdf['tamano_bytes']);
        }
        // No cachear
        header('Cache-Control: no-cache, must-revalidate');
        header('Pragma: no-cache');
        
        echo $pdfContent;
        exit;
    }

    // Si no hay contenido
    http_response_code(404);
    echo "PDF registrado pero sin contenido en base de datos.\n";
    echo "RIT: $rit, Folio: $folio, Color: $color, Tipo: $tipoPdf\n";

} catch (PDOException $e) {
    http_response_code(500);
    die('Error de base de datos: ' . $e->getMessage());
}
