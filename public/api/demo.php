<?php
/**
 * Vista /demo que consulta directamente MySQL (sin usar APIs HTTP internas)
 * Las APIs en public/api/ deben usarse SOLO para comunicación externa
 *
 * Este archivo usa SSR (Server-Side Rendering) y consultas directas a BD
 */

// Cargar variables de entorno
$dbHost = getenv('DB_HOST') ?: 'localhost';
$dbName = getenv('DB_NAME') ?: 'codi_ejamtest';
$dbUser = getenv('DB_USER') ?: 'root';
$dbPass = getenv('DB_PASS') ?: '';

// Conectar a MySQL directamente
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
} catch (PDOException $e) {
    die("Error de conexión a base de datos: " . $e->getMessage());
}

// === ENDPOINT INTERNO: Detalle de causa ===
// Si se solicita detalle de causa via AJAX interno, responder con JSON
if (isset($_GET['action']) && $_GET['action'] === 'detalle_causa') {
    header('Content-Type: application/json; charset=utf-8');

    $rit = $_GET['rit'] ?? null;
    if (!$rit) {
        http_response_code(400);
        echo json_encode(['error' => 'RIT requerido']);
        exit;
    }

    try {
        // Consultar causa
        $stmt = $pdo->prepare("SELECT * FROM causas WHERE rit = :rit LIMIT 1");
        $stmt->execute(['rit' => $rit]);
        $causa = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$causa) {
            http_response_code(404);
            echo json_encode(['error' => 'Causa no encontrada']);
            exit;
        }

        // Consultar movimientos
        $stmt = $pdo->prepare("
            SELECT
                m.*,
                (SELECT COUNT(*) FROM pdfs p WHERE p.movimiento_id = m.id AND p.tipo = 'azul') > 0 as tiene_pdf_azul,
                (SELECT COUNT(*) FROM pdfs p WHERE p.movimiento_id = m.id AND p.tipo = 'rojo') > 0 as tiene_pdf_rojo
            FROM movimientos m
            WHERE m.rit = :rit
            ORDER BY m.folio ASC
        ");
        $stmt->execute(['rit' => $rit]);
        $movimientos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Consultar cuadernos
        $stmt = $pdo->prepare("
            SELECT DISTINCT id_cuaderno, nombre
            FROM movimientos
            WHERE rit = :rit AND id_cuaderno IS NOT NULL
            ORDER BY id_cuaderno
        ");
        $stmt->execute(['rit' => $rit]);
        $cuadernos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Consultar ebook
        $stmt = $pdo->prepare("SELECT * FROM ebooks WHERE rit = :rit LIMIT 1");
        $stmt->execute(['rit' => $rit]);
        $ebook = $stmt->fetch(PDO::FETCH_ASSOC);

        // Preparar respuesta
        $response = [
            'causa' => [
                'rit' => $causa['rit'],
                'caratulado' => $causa['caratulado'],
                'tribunal' => $causa['tribunal_nombre'],
                'fechaIngreso' => $causa['fecha_ingreso'],
                'estado' => $causa['estado'] ?: 'EN_TRAMITE',
                'etapa' => $causa['etapa']
            ],
            'movimientos' => array_map(function($mov) {
                return [
                    'folio' => $mov['folio'],
                    'fecha' => $mov['fecha'],
                    'etapa' => $mov['etapa'],
                    'tramite' => $mov['tramite'],
                    'descripcion' => $mov['descripcion'],
                    'foja' => $mov['foja'],
                    'id_pagina' => $mov['id_pagina'],
                    'id_cuaderno' => $mov['id_cuaderno'],
                    'cuaderno_nombre' => $mov['nombre'],
                    'tiene_pdf_azul' => (bool)$mov['tiene_pdf_azul'],
                    'tiene_pdf_rojo' => (bool)$mov['tiene_pdf_rojo']
                ];
            }, $movimientos),
            'cuadernos' => $cuadernos,
            'totalPdfs' => $causa['total_pdfs'] ?? 0,
            'tieneEbook' => !empty($ebook),
            'ebook' => $ebook ? [
                'nombre' => $ebook['nombre_archivo'],
                'ruta' => $ebook['ruta_relativa']
            ] : null
        ];

        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        exit;

    } catch (PDOException $e) {
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
        // Buscar PDF en base de datos
        $stmt = $pdo->prepare("
            SELECT p.contenido_base64, p.nombre_archivo, p.tamano_bytes
            FROM pdfs p
            JOIN movimientos m ON p.movimiento_id = m.id
            WHERE m.rit = :rit AND m.folio = :folio AND p.tipo = :color
            LIMIT 1
        ");
        $stmt->execute(['rit' => $rit, 'folio' => $folio, 'color' => $color]);
        $pdf = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$pdf || !$pdf['contenido_base64']) {
            http_response_code(404);
            die('PDF no encontrado en base de datos');
        }

        // Servir PDF
        header('Content-Type: application/pdf');
        header('Content-Disposition: inline; filename="' . $pdf['nombre_archivo'] . '"');
        header('Content-Length: ' . $pdf['tamano_bytes']);
        echo base64_decode($pdf['contenido_base64']);
        exit;

    } catch (PDOException $e) {
        http_response_code(500);
        die('Error de base de datos: ' . $e->getMessage());
    }
}

// === RENDERIZADO HTML (SSR) ===
// Cargar causas guardadas desde MySQL
try {
    $stmt = $pdo->query("
        SELECT
            rit,
            caratulado,
            tribunal_nombre,
            fecha_ingreso,
            estado,
            total_pdfs,
            (SELECT COUNT(*) FROM ebooks e WHERE e.rit = causas.rit) > 0 as tiene_ebook
        FROM causas
        ORDER BY created_at DESC
        LIMIT 50
    ");
    $causasGuardadas = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    $causasGuardadas = [];
    $dbError = $e->getMessage();
}

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Consulta de Causas - Sistema Legal</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        /* Reusando los mismos estilos del demo.html original */
        :root {
            --primary: #4f46e5;
            --primary-dark: #3730a3;
            --primary-light: #818cf8;
            --secondary: #0ea5e9;
            --secondary-dark: #0284c7;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --info: #06b6d4;
            --bg-page: #f8fafc;
            --bg-card: #ffffff;
            --bg-header: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%);
            --bg-sidebar: #1e1b4b;
            --text-primary: #1e293b;
            --text-secondary: #64748b;
            --text-muted: #94a3b8;
            --text-light: #f8fafc;
            --border-color: #e2e8f0;
            --border-light: #f1f5f9;
            --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
            --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
            --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
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
            letter-spacing: -0.5px;
        }
        .logo-text span {
            font-size: 12px;
            opacity: 0.9;
            font-weight: 400;
        }
        .user-section {
            display: flex;
            align-items: center;
            gap: 20px;
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
            border-radius: 0;
            transition: all 0.2s;
        }
        .nav-tabs-pjud .nav-link:hover {
            color: white;
            background: rgba(255,255,255,0.1);
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
        .search-card {
            background: var(--bg-card);
            border-radius: 12px;
            box-shadow: var(--shadow-md);
            overflow: hidden;
            margin-bottom: 25px;
        }
        .search-card-header {
            background: var(--primary);
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .search-card-header h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .search-card-body { padding: 25px; }
        .form-row-pjud {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .form-group-pjud {
            display: flex;
            flex-direction: column;
        }
        .form-group-pjud label {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        .form-control-pjud {
            padding: 10px 14px;
            border: 2px solid var(--border-color);
            border-radius: 8px;
            font-size: 14px;
            transition: all 0.2s;
            background: white;
        }
        .form-control-pjud:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
        .btn-row {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            padding-top: 15px;
            border-top: 1px solid var(--border-color);
        }
        .btn-pjud {
            padding: 10px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: none;
        }
        .btn-pjud-primary {
            background: var(--primary);
            color: white;
        }
        .btn-pjud-primary:hover {
            background: var(--primary-dark);
            transform: translateY(-1px);
            box-shadow: var(--shadow-md);
        }
        .btn-pjud-secondary {
            background: var(--bg-page);
            color: var(--text-secondary);
            border: 2px solid var(--border-color);
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
            letter-spacing: 0.5px;
            color: var(--text-secondary);
            border-bottom: 2px solid var(--border-color);
        }
        .table-pjud td {
            padding: 12px 15px;
            border-bottom: 1px solid var(--border-light);
            font-size: 13px;
            vertical-align: middle;
        }
        .table-pjud tbody tr {
            transition: background 0.15s;
        }
        .table-pjud tbody tr:hover {
            background: rgba(79, 70, 229, 0.03);
        }
        .action-icons {
            display: flex;
            gap: 8px;
            align-items: center;
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
        .action-btn.btn-detail:hover {
            background: #2563eb;
            transform: scale(1.1);
        }
        .action-btn.btn-pdf-blue {
            background: #0ea5e9;
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
            letter-spacing: 0.3px;
        }
        .status-badge.en-tramite {
            background: #dbeafe;
            color: #1d4ed8;
        }
        .status-badge.terminada {
            background: #dcfce7;
            color: #166534;
        }
        .pjud-footer {
            background: var(--bg-sidebar);
            color: var(--text-light);
            padding: 20px;
            text-align: center;
            font-size: 12px;
            margin-top: 40px;
        }
        .alert-info-custom {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            color: #0c5460;
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 13px;
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
        .modal-backdrop.show { opacity: 0.5; }
        .modal-pjud .modal-content {
            border: none;
            border-radius: 12px;
            overflow: hidden;
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
            text-shadow: none;
        }
        .modal-pjud .modal-body {
            padding: 0;
            max-height: 70vh;
            overflow-y: auto;
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
        .detail-item {
            display: flex;
            flex-direction: column;
        }
        .detail-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
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
            position: sticky;
            top: 0;
        }
        .movements-table td {
            padding: 10px 12px;
            border-bottom: 1px solid var(--border-light);
            vertical-align: middle;
        }
        .folio-badge {
            display: inline-block;
            background: var(--primary);
            color: white;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            min-width: 30px;
            text-align: center;
        }
        .etapa-tag {
            display: inline-block;
            background: #e0e7ff;
            color: #4338ca;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
        }
        .documentos-cell {
            display: flex;
            gap: 6px;
            align-items: center;
        }
        .action-btn.btn-pdf-red {
            background: #ef4444;
            color: white;
        }
    </style>
</head>
<body>
    <header class="pjud-header">
        <div class="header-top">
            <div class="container">
                <span><i class="fas fa-phone-alt"></i> Soporte: +56 2 1234 5678</span>
                <span><i class="fas fa-clock"></i> Última actualización: <?= date('d/m/Y H:i:s') ?></span>
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
                        <span>Modo Invitado</span>
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
            <a href="#">Consultas</a>
            <span>/</span>
            <span>Consulta de Causas</span>
        </div>

        <?php if (!empty($dbError)): ?>
        <div class="alert-info-custom">
            <i class="fas fa-exclamation-triangle"></i>
            <strong>Error de conexión:</strong> <?= htmlspecialchars($dbError) ?>
        </div>
        <?php else: ?>
        <div class="alert-success-custom">
            <i class="fas fa-check-circle"></i>
            <strong>Sistema operativo:</strong> Conectado a MySQL directamente (sin usar APIs HTTP internas).
            Causas cargadas: <?= count($causasGuardadas) ?>
        </div>
        <?php endif; ?>

        <!-- Formulario de Búsqueda -->
        <div class="search-card">
            <div class="search-card-header">
                <h3><i class="fas fa-search"></i> Búsqueda de Causas</h3>
                <span class="badge badge-light">Civil</span>
            </div>
            <div class="search-card-body">
                <form id="searchForm" method="GET">
                    <div class="form-row-pjud">
                        <div class="form-group-pjud">
                            <label>RIT / Rol</label>
                            <input type="text" class="form-control-pjud" name="search_rit" placeholder="Ej: C-3030-2017" required>
                        </div>
                    </div>
                    <div class="btn-row">
                        <button type="submit" class="btn-pjud btn-pjud-primary">
                            <i class="fas fa-search"></i> Buscar
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Causas Guardadas en Sistema -->
        <div class="results-card">
            <div class="results-card-header" style="background: #10b981;">
                <h3><i class="fas fa-database"></i> Causas Guardadas en Sistema (MySQL)</h3>
                <span class="results-badge"><?= count($causasGuardadas) ?> causa(s)</span>
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
                        <?php foreach ($causasGuardadas as $causa): ?>
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

                        <?php if (empty($causasGuardadas)): ?>
                        <tr>
                            <td colspan="6" class="text-center py-4">
                                <i class="fas fa-database" style="font-size: 40px; color: #ccc; margin-bottom: 15px; display: block;"></i>
                                <p style="color: #999; margin: 0;">No hay causas en la base de datos</p>
                            </td>
                        </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </main>

    <!-- Modal Detalle de Causa -->
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
                            <div class="detail-item">
                                <span class="detail-label">RIT/Rol</span>
                                <span class="detail-value" id="detailRit">-</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Caratulado</span>
                                <span class="detail-value" id="detailCaratulado">-</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Tribunal</span>
                                <span class="detail-value" id="detailTribunal">-</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Fecha de Ingreso</span>
                                <span class="detail-value" id="detailFechaIngreso">-</span>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h5><i class="fas fa-list"></i> Historial de Movimientos Procesales</h5>
                        <div class="table-wrapper" style="max-height: 420px; overflow: auto;">
                            <table class="movements-table">
                                <thead>
                                    <tr>
                                        <th style="width: 60px;">Folio</th>
                                        <th style="width: 100px;">Documentos</th>
                                        <th style="width: 95px;">Fecha</th>
                                        <th style="width: 100px;">Etapa</th>
                                        <th style="width: 110px;">Trámite</th>
                                        <th>Descripción del Trámite</th>
                                        <th style="width: 60px;">Foja</th>
                                    </tr>
                                </thead>
                                <tbody id="movimientosBody">
                                    <tr>
                                        <td colspan="7" class="text-center">Seleccione una causa para ver movimientos</td>
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
            <i class="fas fa-shield-alt"></i> Sistema de Consulta de Causas |
            <strong>Consulta directa a MySQL (sin APIs HTTP internas)</strong> |
            &copy; 2024-2026
        </p>
    </footer>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // ====================================================================
        // IMPORTANTE: Este JavaScript ya NO hace llamadas a APIs HTTP externas
        // Todas las consultas son internas al mismo archivo demo.php
        // ====================================================================

        /**
         * Ver detalle de causa (consulta interna, mismo archivo)
         */
        function verDetalle(rit) {
            // Consultar detalle usando el mismo archivo demo.php con parámetro action
            fetch('<?= $_SERVER['PHP_SELF'] ?>?action=detalle_causa&rit=' + encodeURIComponent(rit))
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        alert('Error: ' + data.error);
                        return;
                    }

                    // Llenar modal con datos
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
                                <div class="documentos-cell">
                                    ${mov.tiene_pdf_azul ? `
                                        <button class="action-btn btn-pdf-blue"
                                                style="width:26px;height:26px;font-size:12px;"
                                                onclick="abrirPDF('${data.causa.rit}', ${mov.folio}, 'azul')"
                                                title="Ver PDF Principal">
                                            <i class="fas fa-file-pdf"></i>
                                        </button>
                                    ` : ''}
                                    ${mov.tiene_pdf_rojo ? `
                                        <button class="action-btn btn-pdf-red"
                                                style="width:26px;height:26px;font-size:12px;"
                                                onclick="abrirPDF('${data.causa.rit}', ${mov.folio}, 'rojo')"
                                                title="Ver PDF Anexo">
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

                    // Mostrar modal
                    $('#modalDetalle').modal('show');
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error al cargar detalle de la causa');
                });
        }

        /**
         * Abrir PDF (consulta interna, mismo archivo)
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
