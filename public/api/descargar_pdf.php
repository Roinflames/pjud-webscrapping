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

$dbHost = getenv('DB_HOST') ?: 'localhost';
$dbName = getenv('DB_NAME') ?: 'codi_ejamtest';
$dbUser = getenv('DB_USER') ?: 'root';
$dbPass = getenv('DB_PASS') ?: '';

try {
    $pdo = new PDO(
        "mysql:host={$dbHost};dbname={$dbName};charset=utf8",
        $dbUser,
        $dbPass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Determinar tipo de PDF según color
    $tipoPdf = ($color === 'rojo') ? 'ANEXO' : 'PRINCIPAL';
    
    // Buscar el PDF directamente desde la tabla pdfs
    $stmt = $pdo->prepare("
        SELECT
            p.contenido_base64,
            p.nombre_archivo,
            p.tamano_bytes,
            p.tipo,
            m.folio,
            m.rit
        FROM pdfs p
        INNER JOIN movimientos m ON p.movimiento_id = m.id
        WHERE m.rit = :rit AND m.folio = :folio AND p.tipo = :tipo
        LIMIT 1
    ");
    $stmt->execute([
        'rit' => $rit, 
        'folio' => $folio,
        'tipo' => $tipoPdf
    ]);
    $pdf = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$pdf) {
        http_response_code(404);
        die('PDF no encontrado para este movimiento y tipo');
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
