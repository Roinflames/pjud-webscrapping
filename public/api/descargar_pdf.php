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

    // Buscar el movimiento
    $stmt = $pdo->prepare("
        SELECT
            m.id,
            m.rit,
            m.folio,
            m.pdf_azul,
            m.pdf_rojo,
            p.contenido_base64,
            p.nombre_archivo,
            p.tamano_bytes
        FROM movimientos m
        LEFT JOIN pdfs p ON m.id = p.movimiento_id
        WHERE m.rit = :rit AND m.folio = :folio
        LIMIT 1
    ");
    $stmt->execute(['rit' => $rit, 'folio' => $folio]);
    $mov = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$mov) {
        http_response_code(404);
        die('Movimiento no encontrado');
    }

    // Verificar qué PDF se solicita
    $nombrePdf = ($color === 'rojo') ? $mov['pdf_rojo'] : $mov['pdf_azul'];

    if (!$nombrePdf) {
        http_response_code(404);
        die('PDF no disponible para este color');
    }

    // Si hay contenido en base64, servirlo
    if ($mov['contenido_base64']) {
        header('Content-Type: application/pdf');
        header('Content-Disposition: inline; filename="' . $nombrePdf . '"');
        header('Content-Length: ' . $mov['tamano_bytes']);
        echo base64_decode($mov['contenido_base64']);
        exit;
    }

    // Si no hay contenido, generar un PDF de prueba
    http_response_code(404);
    echo "PDF '$nombrePdf' registrado pero sin contenido en base de datos.\n";
    echo "RIT: $rit, Folio: $folio, Color: $color\n";
    echo "\nPara subir el contenido, use:\n";
    echo "UPDATE pdfs SET contenido_base64 = 'BASE64_AQUI' WHERE movimiento_id = {$mov['id']};\n";

} catch (PDOException $e) {
    http_response_code(500);
    die('Error de base de datos: ' . $e->getMessage());
}
