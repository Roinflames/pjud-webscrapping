<?php
/**
 * Script para importar eBooks desde el filesystem a la base de datos
 * Busca archivos *_ebook.pdf en los directorios de outputs
 */

// Cargar .env manualmente
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

$rit = $_GET['rit'] ?? null;

try {
    $pdo = new PDO(
        "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8",
        $dbUser,
        $dbPass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Directorios donde buscar eBooks (desde public/api/)
    $baseDir = realpath(__DIR__ . '/../..');
    $directorios = [
        $baseDir . '/src/outputs/pdf',
        $baseDir . '/src/outputs/ebooks',
        $baseDir . '/public/outputs/pdf',
        $baseDir . '/public/outputs/ebooks',
    ];

    $ebooksEncontrados = [];
    $ritFiltro = $rit ? str_replace('-', '_', $rit) : null;

    foreach ($directorios as $dir) {
        $dirReal = realpath($dir);
        if (!$dirReal || !is_dir($dirReal)) continue;

        $archivos = glob($dirReal . '/*_ebook.pdf');
        foreach ($archivos as $archivo) {
            $nombreArchivo = basename($archivo);
            
            // Si se especificó un RIT, filtrar por ese RIT
            if ($ritFiltro && strpos($nombreArchivo, $ritFiltro) !== 0) {
                continue;
            }

            // Extraer RIT del nombre: C_3030_2017_ebook.pdf -> C-3030-2017
            if (preg_match('/^([A-Z])_(\d+)_(\d{4})_ebook\.pdf$/i', $nombreArchivo, $matches)) {
                $ritExtraido = "{$matches[1]}-{$matches[2]}-{$matches[3]}";
                
                // Evitar duplicados
                if (isset($ebooksEncontrados[$ritExtraido])) {
                    continue;
                }

                $ebooksEncontrados[$ritExtraido] = [
                    'rit' => $ritExtraido,
                    'nombre_archivo' => $nombreArchivo,
                    'ruta' => $archivo,
                    'tamano_bytes' => filesize($archivo),
                ];
            }
        }
    }

    if (empty($ebooksEncontrados)) {
        header('Content-Type: application/json');
        echo json_encode([
            'mensaje' => 'No se encontraron eBooks para importar',
            'rit_filtro' => $rit,
            'directorios_buscados' => $directorios
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    $importados = 0;
    $errores = [];

    foreach ($ebooksEncontrados as $ritEbook => $datos) {
        try {
            // Obtener causa_id
            $stmt = $pdo->prepare('SELECT id FROM causas WHERE rit = ? LIMIT 1');
            $stmt->execute([$ritEbook]);
            $causa = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$causa) {
                $errores[] = "Causa no encontrada para RIT: $ritEbook";
                continue;
            }

            $causaId = $causa['id'];

            // Leer archivo y convertir a base64
            $contenidoBase64 = base64_encode(file_get_contents($datos['ruta']));

            // Insertar o actualizar en BD
            $stmt = $pdo->prepare("
                INSERT INTO ebooks (
                    causa_id, rit, nombre_archivo, ruta_relativa, 
                    tamano_bytes, contenido_base64, descargado, fecha_descarga
                ) VALUES (?, ?, ?, ?, ?, ?, 1, NOW())
                ON DUPLICATE KEY UPDATE
                    nombre_archivo = VALUES(nombre_archivo),
                    ruta_relativa = VALUES(ruta_relativa),
                    tamano_bytes = VALUES(tamano_bytes),
                    contenido_base64 = VALUES(contenido_base64),
                    descargado = 1,
                    fecha_descarga = NOW()
            ");

            $rutaRelativa = str_replace(realpath(__DIR__ . '/../..'), '', $datos['ruta']);
            $rutaRelativa = ltrim($rutaRelativa, '/');

            $stmt->execute([
                $causaId,
                $ritEbook,
                $datos['nombre_archivo'],
                $rutaRelativa,
                $datos['tamano_bytes'],
                $contenidoBase64
            ]);

            $importados++;
            echo "✅ Importado eBook: {$datos['nombre_archivo']} para RIT: $ritEbook\n";

        } catch (PDOException $e) {
            $errores[] = "Error importando {$datos['nombre_archivo']}: " . $e->getMessage();
        }
    }

    header('Content-Type: application/json');
    echo json_encode([
        'importados' => $importados,
        'total_encontrados' => count($ebooksEncontrados),
        'errores' => $errores,
        'rit_filtro' => $rit
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    http_response_code(500);
    die('Error de base de datos: ' . $e->getMessage());
}
