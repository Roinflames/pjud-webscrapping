<?php
header('Content-Type: application/json; charset=utf-8');

$dbHost = getenv('DB_HOST') ?: 'localhost';
$dbName = getenv('DB_NAME') ?: 'codi_ejamtest';
$dbUser = getenv('DB_USER') ?: 'root';
$dbPass = getenv('DB_PASS') ?: '';

try {
    $pdo = new PDO(
        "mysql:host={$dbHost};dbname={$dbName};charset=utf8",
        $dbUser,
        $dbPass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 3
        ]
    );

    // Obtener todas las causas con información resumida
    $stmt = $pdo->query("
        SELECT
            c.id,
            c.rit,
            c.caratulado,
            c.tribunal_nombre,
            c.fecha_ingreso,
            c.estado,
            c.total_movimientos,
            c.total_pdfs
        FROM causas c
        ORDER BY c.created_at DESC
    ");

    $causas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Formatear datos para compatibilidad con frontend del puerto 8000
    $causasFormateadas = [];
    $folio = 20212; // Folio inicial para demo

    foreach ($causas as $causa) {
        // Extraer información del cliente desde el caratulado
        $partes = explode('/', $causa['caratulado']);
        $demandante = isset($partes[0]) ? trim($partes[0]) : 'Promotora CMR Falabella';
        $demandado = isset($partes[1]) ? trim($partes[1]) : '';

        $causasFormateadas[] = [
            'id' => $causa['id'],
            'rit' => $causa['rit'],
            'folio' => $folio++,
            'cliente' => $demandado ?: 'Sin información',
            'rut' => '8.462.961-8', // Dato fijo para demo
            'abogado' => 'Tatiana Gonzalez', // Dato fijo para demo
            'juzgado' => $demandante,
            'tribunal_nombre' => $causa['tribunal_nombre'],
            'fecha_ingreso' => $causa['fecha_ingreso'],
            'estado' => $causa['estado'],
            'total_movimientos' => $causa['total_movimientos'],
            'total_pdfs' => $causa['total_pdfs']
        ];
    }

    echo json_encode([
        'success' => true,
        'causas' => $causasFormateadas,
        'total' => count($causasFormateadas)
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error de base de datos: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
