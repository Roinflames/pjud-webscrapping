<?php
/**
 * Script para importar PDFs reales desde archivos al directorio de outputs
 * y guardarlos en la base de datos
 */

require_once __DIR__ . '/../src/autoload.php';

use App\Config\Database;
use App\Repository\PDFRepository;
use App\Repository\CausaRepository;
use App\Repository\MovimientoRepository;

$pdo = Database::getConnection();
$pdfRepo = new PDFRepository();
$causaRepo = new CausaRepository();
$movRepo = new MovimientoRepository();

// Directorios donde buscar PDFs
$directorios = [
    __DIR__ . '/../outputs/pdf',
    __DIR__ . '/../../src/outputs/pdf',
    __DIR__ . '/../../src/outputs'
];

$rit = $_GET['rit'] ?? 'C-16707-2019';
$importados = 0;
$errores = [];

echo "<h2>Importando PDFs reales para RIT: $rit</h2>";

// Buscar PDFs en los directorios
$pdfsEncontrados = [];
foreach ($directorios as $dir) {
    if (!is_dir($dir)) continue;
    
    $archivos = glob($dir . "/*{$rit}*.pdf");
    foreach ($archivos as $archivo) {
        $nombreArchivo = basename($archivo);
        
        // Extraer información del nombre del archivo
        // Formato esperado: {rit}_mov_{indice}_{tipo}.pdf
        if (preg_match('/(\d+)_(\d+)_mov_(\d+)_([PR])\.pdf/', $nombreArchivo, $matches)) {
            $indice = (int)$matches[3];
            $tipo = $matches[4] === 'P' ? 'PRINCIPAL' : 'ANEXO';
            
            $pdfsEncontrados[] = [
                'archivo' => $archivo,
                'nombre' => $nombreArchivo,
                'indice' => $indice,
                'tipo' => $tipo
            ];
        }
    }
}

if (empty($pdfsEncontrados)) {
    echo "<p style='color:orange;'>⚠️ No se encontraron PDFs reales en los directorios de outputs.</p>";
    echo "<p>Los PDFs deben estar en formato: {rit}_mov_{indice}_{P|R}.pdf</p>";
    echo "<p>Directorios buscados:</p><ul>";
    foreach ($directorios as $dir) {
        echo "<li>" . (is_dir($dir) ? "✅" : "❌") . " $dir</li>";
    }
    echo "</ul>";
    exit;
}

echo "<p>📄 Encontrados " . count($pdfsEncontrados) . " PDFs</p>";

// Obtener causa
$causa = $causaRepo->findByRit($rit);
if (!$causa) {
    echo "<p style='color:red;'>❌ Causa no encontrada en BD</p>";
    exit;
}

$causaId = $causa->getId();
echo "<p>✅ Causa encontrada: ID $causaId</p>";

// Importar cada PDF
foreach ($pdfsEncontrados as $pdfInfo) {
    try {
        $archivo = $pdfInfo['archivo'];
        $nombreArchivo = $pdfInfo['nombre'];
        $indice = $pdfInfo['indice'];
        $tipo = $pdfInfo['tipo'];
        
        // Leer archivo y convertir a base64
        $contenido = file_get_contents($archivo);
        if (!$contenido) {
            throw new Exception("No se pudo leer el archivo");
        }
        
        $base64 = base64_encode($contenido);
        $tamanoBytes = strlen($contenido);
        
        // Buscar movimiento por indice
        $movimientos = $movRepo->findByRit($rit);
        $movimientoId = null;
        
        foreach ($movimientos as $mov) {
            if ($mov->getIndice() == $indice || $mov->getFolio() == (string)$indice) {
                // Obtener ID del movimiento desde BD
                $stmt = $pdo->prepare("SELECT id FROM movimientos WHERE rit = ? AND (indice = ? OR folio = ?) LIMIT 1");
                $stmt->execute([$rit, $indice, $indice]);
                $movRow = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($movRow) {
                    $movimientoId = $movRow['id'];
                    break;
                }
            }
        }
        
        // Guardar PDF en BD
        $stmt = $pdo->prepare("
            INSERT INTO pdfs (causa_id, movimiento_id, rit, tipo, nombre_archivo, contenido_base64, tamano_bytes, descargado, fecha_descarga)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())
            ON DUPLICATE KEY UPDATE
                contenido_base64 = VALUES(contenido_base64),
                tamano_bytes = VALUES(tamano_bytes),
                descargado = 1,
                fecha_descarga = NOW()
        ");
        
        $stmt->execute([
            $causaId,
            $movimientoId,
            $rit,
            $tipo,
            $nombreArchivo,
            $base64,
            $tamanoBytes
        ]);
        
        $importados++;
        echo "<p style='color:green;'>✅ Importado: $nombreArchivo (Indice: $indice, Tipo: $tipo, Tamaño: " . round($tamanoBytes/1024, 2) . " KB)</p>";
        
    } catch (Exception $e) {
        $errores[] = "$nombreArchivo: " . $e->getMessage();
        echo "<p style='color:red;'>❌ Error importando $nombreArchivo: " . $e->getMessage() . "</p>";
    }
}

echo "<hr>";
echo "<h3>Resumen</h3>";
echo "<p>✅ Importados: $importados</p>";
if (!empty($errores)) {
    echo "<p>❌ Errores: " . count($errores) . "</p>";
    echo "<ul>";
    foreach ($errores as $error) {
        echo "<li>$error</li>";
    }
    echo "</ul>";
}

echo "<p><a href='descargar_pdf.php?rit=$rit&folio=12&color=rojo'>Probar descarga de PDF</a></p>";
