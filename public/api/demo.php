<?php
/**
 * Vista /demo que usa arquitectura MVC personalizada (Entity/Repository/Controller)
 *
 * IMPORTANTE: Este archivo NO usa APIs HTTP internas.
 * Consulta directamente la base de datos usando los repositorios.
 * Las APIs en public/api/ deben usarse SOLO para comunicación externa.
 */

// Cargar autoloader de las clases del proyecto
require_once __DIR__ . '/../src/autoload.php';

use App\Repository\CausaRepository;
use App\Repository\MovimientoRepository;
use App\Repository\EbookRepository;
use App\Repository\PDFRepository;

// Inicializar repositorios
$causaRepository = new CausaRepository();
$movimientoRepository = new MovimientoRepository();
$ebookRepository = new EbookRepository();
$pdfRepository = new PDFRepository();

$dbError = null;

// === ENDPOINT INTERNO: Detalle de causa ===
// Responde con JSON para AJAX interno del mismo archivo
if (isset($_GET['action']) && $_GET['action'] === 'detalle_causa') {
    header('Content-Type: application/json; charset=utf-8');

    $rit = $_GET['rit'] ?? null;
    if (!$rit) {
        http_response_code(400);
        echo json_encode(['error' => 'RIT requerido']);
        exit;
    }

    try {
        // Usar repositorios en lugar de PDO directo
        $causa = $causaRepository->findByRit($rit);

        if (!$causa) {
            http_response_code(404);
            echo json_encode(['error' => 'Causa no encontrada']);
            exit;
        }

        // Obtener movimientos con info de PDFs
        $movimientos = $movimientoRepository->findByRit($rit, true);

        // Obtener cuadernos
        $cuadernos = $movimientoRepository->getCuadernosByRit($rit);

        // Obtener ebook
        $ebook = $ebookRepository->findByRit($rit);

        // Preparar respuesta
        $response = [
            'causa' => [
                'rit' => $causa->getRit(),
                'caratulado' => $causa->getCaratulado(),
                'tribunal' => $causa->getTribunalNombre(),
                'fechaIngreso' => $causa->getFechaIngreso(),
                'estado' => $causa->getEstado() ?: 'EN_TRAMITE',
                'etapa' => $causa->getEtapa()
            ],
            'movimientos' => array_map(function($mov) {
                return $mov->toArray();
            }, $movimientos),
            'cuadernos' => $cuadernos,
            'totalPdfs' => $causa->getTotalPdfs(),
            'tieneEbook' => !empty($ebook),
            'ebook' => $ebook ? [
                'nombre' => $ebook->getNombreArchivo(),
                'ruta' => $ebook->getRutaRelativa()
            ] : null
        ];

        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        exit;

    } catch (\Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error de base de datos: ' . $e->getMessage()]);
        exit;
    }
}

// === ENDPOINT INTERNO: Descargar PDF ===
if (isset($_GET['action']) && $_GET['action'] === 'descargar_pdf') {
    $rit = $_GET['rit'] ?? null;
    $folio = $_GET['folio'] ?? null;
    $color = $_GET['color'] ?? 'azul';

    if (!$rit || !$folio) {
        http_response_code(400);
        die('Faltan parámetros: rit y folio');
    }

    try {
        // Usar repositorio en lugar de PDO directo
        $pdf = $pdfRepository->findByRitFolioTipo($rit, $folio, $color);

        if (!$pdf || !$pdf->getContenidoBase64()) {
            http_response_code(404);
            die('PDF no encontrado en base de datos');
        }

        // Servir PDF
        header('Content-Type: application/pdf');
        header('Content-Disposition: inline; filename="' . $pdf->getNombreArchivo() . '"');
        header('Content-Length: ' . $pdf->getTamanoBytes());
        echo base64_decode($pdf->getContenidoBase64());
        exit;

    } catch (\Exception $e) {
        http_response_code(500);
        die('Error de base de datos: ' . $e->getMessage());
    }
}

// === RENDERIZADO HTML (SSR) ===
// Cargar causas guardadas usando repositorio
try {
    $causasGuardadas = $causaRepository->findAll();

    // Verificar si tienen ebook (agregar flag)
    $causasData = array_map(function($causa) use ($ebookRepository) {
        $ebook = $ebookRepository->findByRit($causa->getRit());
        $causaArray = $causa->toArray();
        $causaArray['tiene_ebook'] = !empty($ebook);
        return $causaArray;
    }, $causasGuardadas);

} catch (\Exception $e) {
    $causasData = [];
    $dbError = $e->getMessage();
}

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demo - Sistema Legal (Entity/Repository Pattern)</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #4f46e5;
            --primary-dark: #3730a3;
            --success: #10b981;
            --bg-page: #f8fafc;
            --bg-card: #ffffff;
            --bg-header: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%);
            --bg-sidebar: #1e1b4b;
            --text-primary: #1e293b;
            --text-secondary: #64748b;
            --text-muted: #94a3b8;
            --border-color: #e2e8f0;
            --border-light: #f1f5f9;
            --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
            --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: var(--bg-page);
            color: var(--text-primary);
            font-size: 14px;
            line-height: 1.6;
        }

        .pjud-header {
            background: var(--bg-header);
            color: white;
            padding: 0;
            box-shadow: var(--shadow-lg);
            position: sticky;
            top: 0;
            z-index: 1000;
        }
        .header-top {
            background: rgba(0,0,0,0.15);
            padding: 8px 0;
            font-size: 12px;
        }
        .header-top .container {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header-main { padding: 15px 0; }
        .header-main .container {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .logo-icon {
            width: 50px;
            height: 50px;
            background: rgba(255,255,255,0.2);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }
        .logo-text h1 {
            font-size: 22px;
            font-weight: 700;
            margin: 0;
        }
        .logo-text span {
            font-size: 12px;
            opacity: 0.9;
        }
        .user-badge {
            background: rgba(255,255,255,0.15);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .nav-tabs-pjud {
            background: rgba(0,0,0,0.1);
            padding: 0 20px;
        }
        .nav-tabs-pjud .nav-link {
            color: rgba(255,255,255,0.8);
            border: none;
            padding: 12px 20px;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s;
        }
        .nav-tabs-pjud .nav-link.active {
            color: white;
            background: rgba(255,255,255,0.2);
            border-bottom: 3px solid white;
        }
        .main-container {
            padding: 25px;
            max-width: 1400px;
            margin: 0 auto;
        }
        .pjud-breadcrumb {
            background: var(--bg-card);
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: var(--shadow-sm);
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13px;
        }
        .results-card {
            background: var(--bg-card);
            border-radius: 12px;
            box-shadow: var(--shadow-md);
            overflow: hidden;
            margin-bottom: 25px;
        }
        .results-card-header {
            background: var(--primary);
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .results-badge {
            background: rgba(255,255,255,0.2);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
        }
        .table-pjud {
            width: 100%;
            border-collapse: collapse;
        }
        .table-pjud thead {
            background: var(--bg-page);
        }
        .table-pjud th {
            padding: 12px 15px;
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: var(--text-secondary);
            border-bottom: 2px solid var(--border-color);
        }
        .table-pjud td {
            padding: 12px 15px;
            border-bottom: 1px solid var(--border-light);
            font-size: 13px;
        }
        .table-pjud tbody tr:hover {
            background: rgba(79, 70, 229, 0.03);
        }
        .action-icons {
            display: flex;
            gap: 8px;
        }
        .action-btn {
            width: 32px;
            height: 32px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            font-size: 14px;
        }
        .action-btn.btn-detail {
            background: #3b82f6;
            color: white;
        }
        .action-btn.btn-pdf-blue {
            background: #0ea5e9;
            color: white;
        }
        .action-btn.btn-pdf-red {
            background: #ef4444;
            color: white;
        }
        .action-btn.btn-ebook {
            background: #10b981;
            color: white;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status-badge.en-tramite {
            background: #dbeafe;
            color: #1d4ed8;
        }
        .status-badge.terminada {
            background: #dcfce7;
            color: #166534;
        }
        .alert-success-custom {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 13px;
        }
        .alert-danger-custom {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 13px;
        }
        .pjud-footer {
            background: var(--bg-sidebar);
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            margin-top: 40px;
        }
        .modal-pjud .modal-content {
            border: none;
            border-radius: 12px;
        }
        .modal-pjud .modal-header {
            background: var(--primary);
            color: white;
            border: none;
            padding: 15px 20px;
        }
        .modal-pjud .modal-title {
            font-size: 16px;
            font-weight: 600;
        }
        .modal-pjud .close {
            color: white;
            opacity: 0.8;
        }
        .detail-section {
            padding: 20px;
            border-bottom: 1px solid var(--border-color);
        }
        .detail-section h5 {
            color: var(--primary);
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 15px;
        }
        .detail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .detail-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--text-muted);
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .detail-value {
            font-size: 14px;
            color: var(--text-primary);
            font-weight: 500;
        }
        .movements-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }
        .movements-table th {
            background: var(--bg-page);
            padding: 10px 12px;
            text-align: left;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: var(--text-secondary);
            border-bottom: 2px solid var(--border-color);
        }
        .movements-table td {
            padding: 10px 12px;
            border-bottom: 1px solid var(--border-light);
        }
        .folio-badge {
            background: var(--primary);
            color: white;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
        }
        .etapa-tag {
            background: #e0e7ff;
            color: #4338ca;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
        }
        .badge-info {
            background: #0ea5e9;
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            margin-right: 10px;
        }
    </style>
</head>
<body>
    <header class="pjud-header">
        <div class="header-top">
            <div class="container">
                <span><i class="fas fa-phone-alt"></i> Soporte: +56 2 1234 5678</span>
                <span><i class="fas fa-clock"></i> <?= date('d/m/Y H:i:s') ?></span>
            </div>
        </div>
        <div class="header-main">
            <div class="container">
                <div class="logo-section">
                    <div class="logo-icon">
                        <i class="fas fa-balance-scale"></i>
                    </div>
                    <div class="logo-text">
                        <h1>Sistema Legal</h1>
                        <span>Consulta de Causas Judiciales</span>
                    </div>
                </div>
                <div class="user-section">
                    <div class="user-badge">
                        <i class="fas fa-user-circle"></i>
                        <span>Modo Demo</span>
                    </div>
                </div>
            </div>
        </div>
        <nav class="nav-tabs-pjud">
            <div class="container">
                <ul class="nav nav-tabs border-0">
                    <li class="nav-item">
                        <a class="nav-link active" href="#"><i class="fas fa-search"></i> Consulta Causas</a>
                    </li>
                </ul>
            </div>
        </nav>
    </header>

    <main class="main-container">
        <div class="pjud-breadcrumb">
            <i class="fas fa-home"></i>
            <a href="#">Inicio</a>
            <span>/</span>
            <span>Demo - Arquitectura Entity/Repository</span>
        </div>

        <?php if ($dbError): ?>
        <div class="alert-danger-custom">
            <i class="fas fa-exclamation-triangle"></i>
            <strong>Error de conexión:</strong> <?= htmlspecialchars($dbError) ?>
        </div>
        <?php else: ?>
        <div class="alert-success-custom">
            <i class="fas fa-check-circle"></i>
            <strong>Sistema operativo:</strong>
            <span class="badge-info">Arquitectura Entity/Repository</span>
            <span class="badge-info">Sin APIs HTTP internas</span>
            <span class="badge-info">Consultas directas a MySQL</span>
            Causas cargadas: <?= count($causasData) ?>
        </div>
        <?php endif; ?>

        <!-- Causas Guardadas -->
        <div class="results-card">
            <div class="results-card-header" style="background: #10b981;">
                <h3><i class="fas fa-database"></i> Causas en Base de Datos (via Repositorios)</h3>
                <span class="results-badge"><?= count($causasData) ?> causa(s)</span>
            </div>
            <div style="overflow-x: auto;">
                <table class="table-pjud">
                    <thead>
                        <tr>
                            <th style="width: 100px;">Acciones</th>
                            <th style="width: 120px;">RIT/Rol</th>
                            <th>Caratulado</th>
                            <th style="width: 200px;">Tribunal</th>
                            <th style="width: 100px;">Fecha Ingreso</th>
                            <th style="width: 100px;">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($causasData as $causa): ?>
                        <tr>
                            <td>
                                <div class="action-icons">
                                    <button class="action-btn btn-detail"
                                            title="Ver detalle"
                                            onclick="verDetalle('<?= htmlspecialchars($causa['rit']) ?>')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <?php if ($causa['tiene_ebook']): ?>
                                    <button class="action-btn btn-ebook" title="Tiene eBook">
                                        <i class="fas fa-book"></i>
                                    </button>
                                    <?php endif; ?>
                                    <?php if ($causa['total_pdfs'] > 0): ?>
                                    <button class="action-btn btn-pdf-blue"
                                            title="<?= $causa['total_pdfs'] ?> PDF(s)">
                                        <i class="fas fa-file-pdf"></i>
                                    </button>
                                    <?php endif; ?>
                                </div>
                            </td>
                            <td><strong><?= htmlspecialchars($causa['rit']) ?></strong></td>
                            <td><?= htmlspecialchars($causa['caratulado'] ?: '-') ?></td>
                            <td><?= htmlspecialchars($causa['tribunal_nombre'] ?: '-') ?></td>
                            <td><?= htmlspecialchars($causa['fecha_ingreso'] ?: '-') ?></td>
                            <td>
                                <?php
                                $estado = $causa['estado'] ?: 'EN_TRAMITE';
                                $estadoClass = ($estado === 'EN_TRAMITE') ? 'en-tramite' : 'terminada';
                                $estadoText = ($estado === 'EN_TRAMITE') ? 'En Trámite' : 'Terminada';
                                ?>
                                <span class="status-badge <?= $estadoClass ?>">
                                    <?= $estadoText ?>
                                </span>
                            </td>
                        </tr>
                        <?php endforeach; ?>

                        <?php if (empty($causasData)): ?>
                        <tr>
                            <td colspan="6" class="text-center py-4">
                                <i class="fas fa-database" style="font-size: 40px; color: #ccc; display: block; margin-bottom: 15px;"></i>
                                <p style="color: #999;">No hay causas en la base de datos</p>
                            </td>
                        </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </main>

    <!-- Modal Detalle -->
    <div class="modal fade modal-pjud" id="modalDetalle" tabindex="-1">
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-folder-open"></i>
                        Detalle de Causa <span id="modalRit"></span>
                    </h5>
                    <button type="button" class="close" data-dismiss="modal">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="detail-section">
                        <h5><i class="fas fa-info-circle"></i> Información General</h5>
                        <div class="detail-grid">
                            <div>
                                <div class="detail-label">RIT/Rol</div>
                                <div class="detail-value" id="detailRit">-</div>
                            </div>
                            <div>
                                <div class="detail-label">Caratulado</div>
                                <div class="detail-value" id="detailCaratulado">-</div>
                            </div>
                            <div>
                                <div class="detail-label">Tribunal</div>
                                <div class="detail-value" id="detailTribunal">-</div>
                            </div>
                            <div>
                                <div class="detail-label">Fecha de Ingreso</div>
                                <div class="detail-value" id="detailFechaIngreso">-</div>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h5><i class="fas fa-list"></i> Historial de Movimientos</h5>
                        <div style="max-height: 420px; overflow: auto;">
                            <table class="movements-table">
                                <thead>
                                    <tr>
                                        <th style="width: 60px;">Folio</th>
                                        <th style="width: 100px;">Documentos</th>
                                        <th style="width: 95px;">Fecha</th>
                                        <th style="width: 100px;">Etapa</th>
                                        <th style="width: 110px;">Trámite</th>
                                        <th>Descripción</th>
                                        <th style="width: 60px;">Foja</th>
                                    </tr>
                                </thead>
                                <tbody id="movimientosBody">
                                    <tr>
                                        <td colspan="7" class="text-center">Cargando...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <footer class="pjud-footer">
        <p>
            <i class="fas fa-code"></i> <strong>Arquitectura: Entity/Repository Pattern (NO Symfony/Doctrine)</strong> |
            Consultas directas a MySQL (sin APIs HTTP internas) |
            &copy; 2024-2026
        </p>
    </footer>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        /**
         * Ver detalle de causa
         * IMPORTANTE: Consulta al mismo archivo demo.php (endpoint interno), NO a API HTTP externa
         */
        function verDetalle(rit) {
            fetch('<?= $_SERVER['PHP_SELF'] ?>?action=detalle_causa&rit=' + encodeURIComponent(rit))
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        alert('Error: ' + data.error);
                        return;
                    }

                    // Llenar modal
                    document.getElementById('modalRit').textContent = data.causa.rit;
                    document.getElementById('detailRit').textContent = data.causa.rit;
                    document.getElementById('detailCaratulado').textContent = data.causa.caratulado || '-';
                    document.getElementById('detailTribunal').textContent = data.causa.tribunal || '-';
                    document.getElementById('detailFechaIngreso').textContent = data.causa.fechaIngreso || '-';

                    // Renderizar movimientos
                    const tbody = document.getElementById('movimientosBody');
                    tbody.innerHTML = data.movimientos.map(mov => `
                        <tr>
                            <td><span class="folio-badge">${mov.folio || '-'}</span></td>
                            <td>
                                <div style="display:flex;gap:6px;">
                                    ${mov.tiene_pdf_azul ? `
                                        <button class="action-btn btn-pdf-blue"
                                                style="width:26px;height:26px;font-size:12px;"
                                                onclick="abrirPDF('${data.causa.rit}', '${mov.folio}', 'azul')"
                                                title="PDF Principal">
                                            <i class="fas fa-file-pdf"></i>
                                        </button>
                                    ` : ''}
                                    ${mov.tiene_pdf_rojo ? `
                                        <button class="action-btn btn-pdf-red"
                                                style="width:26px;height:26px;font-size:12px;"
                                                onclick="abrirPDF('${data.causa.rit}', '${mov.folio}', 'rojo')"
                                                title="PDF Anexo">
                                            <i class="fas fa-file-pdf"></i>
                                        </button>
                                    ` : ''}
                                    ${!mov.tiene_pdf_azul && !mov.tiene_pdf_rojo ? '<span style="color:#999;font-size:11px;">Sin docs</span>' : ''}
                                </div>
                            </td>
                            <td>${mov.fecha || '-'}</td>
                            <td>${mov.etapa ? `<span class="etapa-tag">${mov.etapa}</span>` : ''}</td>
                            <td>${mov.tramite || '-'}</td>
                            <td>${mov.descripcion || '-'}</td>
                            <td style="text-align:center;">${mov.foja || '-'}</td>
                        </tr>
                    `).join('');

                    $('#modalDetalle').modal('show');
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error al cargar detalle');
                });
        }

        /**
         * Abrir PDF
         * IMPORTANTE: Consulta al mismo archivo demo.php (endpoint interno), NO a API HTTP externa
         */
        function abrirPDF(rit, folio, color) {
            const url = '<?= $_SERVER['PHP_SELF'] ?>?action=descargar_pdf&rit=' +
                        encodeURIComponent(rit) +
                        '&folio=' + encodeURIComponent(folio) +
                        '&color=' + encodeURIComponent(color);
            window.open(url, '_blank');
        }
    </script>
</body>
</html>
