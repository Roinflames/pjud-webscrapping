<?php
/**
 * Template para visualizar movimientos del PJUD
 * 
 * Uso en Symfony:
 * 1. Copiar este archivo a: templates/scraping/movimientos.html.twig (adaptar a Twig)
 * 2. O usar directamente en un controlador Symfony como vista PHP
 * 
 * Datos esperados en $resultado:
 * - $resultado['movimientos']: Array de movimientos
 * - $resultado['cabecera']: Información de la causa
 * - $resultado['rit']: RIT de la causa
 */

// Estructura de datos esperada:
// $resultado = [
//     'rit' => '16707-2019',
//     'cabecera' => [
//         'caratulado' => 'Nombre de la causa',
//         'juzgado' => '1° Juzgado Civil de Santiago'
//     ],
//     'movimientos' => [
//         [
//             'indice' => 1,
//             'fecha' => '15/01/2024',
//             'tipo_movimiento' => 'Ingreso',
//             'descripcion' => 'Se ingresó la causa',
//             'folio' => '1',
//             'tiene_pdf' => true,
//             'pdf_principal' => 'archivo.pdf',
//             'pdf_anexo' => null
//         ]
//     ]
// ];
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Movimientos - <?= htmlspecialchars($resultado['rit'] ?? 'N/A') ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    <style>
        body {
            background-color: #f5f5f5;
            font-family: Arial, sans-serif;
        }
        .container-pjud {
            max-width: 1400px;
            margin: 20px auto;
            background: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header-pjud {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .header-pjud h1 {
            margin: 0;
            font-size: 24px;
        }
        .info-causa {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .info-causa h4 {
            margin-bottom: 10px;
            color: #333;
        }
        .info-causa p {
            margin: 5px 0;
            color: #666;
        }
        .table-pjud {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .table-pjud thead {
            background: #667eea;
            color: white;
        }
        .table-pjud th {
            padding: 12px;
            text-align: left;
            font-weight: 600;
            border: 1px solid #5568d3;
        }
        .table-pjud td {
            padding: 10px 12px;
            border: 1px solid #dee2e6;
        }
        .table-pjud tbody tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .table-pjud tbody tr:hover {
            background-color: #e9ecef;
        }
        .badge-folio {
            background: #667eea;
            color: white;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
        }
        .pdf-icon {
            color: #2196F3;
            font-size: 18px;
            cursor: pointer;
            margin: 0 5px;
        }
        .pdf-icon.anexo {
            color: #f44336;
        }
        .pdf-icon:hover {
            opacity: 0.7;
        }
        .descripcion-movimiento {
            max-width: 400px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .modal-pdf {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.8);
        }
        .modal-content-pdf {
            background-color: white;
            margin: 5% auto;
            padding: 20px;
            width: 90%;
            height: 80%;
            border-radius: 5px;
        }
        .close-modal {
            color: #aaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }
        .close-modal:hover {
            color: black;
        }
        .pdf-viewer {
            width: 100%;
            height: calc(100% - 50px);
            border: none;
        }
        .alert-info {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            color: #0c5460;
            padding: 12px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container-pjud">
        <div class="header-pjud">
            <h1><i class="fa fa-gavel"></i> Movimientos de la Causa</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Poder Judicial de Chile - Oficina Judicial Virtual</p>
        </div>

        <?php if (isset($resultado['cabecera']) && !empty($resultado['cabecera'])): ?>
        <div class="info-causa">
            <h4><i class="fa fa-info-circle"></i> Información de la Causa</h4>
            <p><strong>RIT:</strong> <?= htmlspecialchars($resultado['rit'] ?? 'N/A') ?></p>
            <?php if (isset($resultado['cabecera']['caratulado'])): ?>
            <p><strong>Caratulado:</strong> <?= htmlspecialchars($resultado['cabecera']['caratulado']) ?></p>
            <?php endif; ?>
            <?php if (isset($resultado['cabecera']['juzgado'])): ?>
            <p><strong>Juzgado:</strong> <?= htmlspecialchars($resultado['cabecera']['juzgado']) ?></p>
            <?php endif; ?>
            <?php if (isset($resultado['fecha_scraping'])): ?>
            <p><strong>Fecha de Consulta:</strong> <?= date('d/m/Y H:i:s', strtotime($resultado['fecha_scraping'])) ?></p>
            <?php endif; ?>
        </div>
        <?php endif; ?>

        <?php if (empty($resultado['movimientos'])): ?>
        <div class="alert alert-info">
            <i class="fa fa-info-circle"></i> No se encontraron movimientos para esta causa.
        </div>
        <?php else: ?>
        <div class="table-responsive">
            <table class="table table-bordered table-striped table-hover table-pjud">
                <thead>
                    <tr>
                        <th>Folio</th>
                        <th>Documentos</th>
                        <th>Fecha</th>
                        <th>Etapa</th>
                        <th>Trámite</th>
                        <th>Descripción del Trámite</th>
                        <th>Foja</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($resultado['movimientos'] as $movimiento): ?>
                    <tr>
                        <td>
                            <span class="badge-folio"><?= htmlspecialchars($movimiento['folio'] ?? $movimiento['indice'] ?? '') ?></span>
                        </td>
                        <td>
                            <?php if (!empty($movimiento['pdf_principal'])): ?>
                            <i class="fa fa-file-pdf-o pdf-icon" 
                               title="Ver PDF Principal"
                               onclick="verPDF('<?= htmlspecialchars($movimiento['pdf_principal']) ?>', '<?= htmlspecialchars(base64_encode($pdfs[$movimiento['pdf_principal']] ?? '')) ?>')"></i>
                            <?php endif; ?>
                            <?php if (!empty($movimiento['pdf_anexo'])): ?>
                            <i class="fa fa-file-pdf-o pdf-icon anexo" 
                               title="Ver PDF Anexo"
                               onclick="verPDF('<?= htmlspecialchars($movimiento['pdf_anexo']) ?>', '<?= htmlspecialchars(base64_encode($pdfs[$movimiento['pdf_anexo']] ?? '')) ?>')"></i>
                            <?php endif; ?>
                            <?php if (empty($movimiento['pdf_principal']) && empty($movimiento['pdf_anexo'])): ?>
                            <span style="color: #999; font-size: 12px;">Sin documentos</span>
                            <?php endif; ?>
                        </td>
                        <td><?= htmlspecialchars($movimiento['fecha'] ?? '') ?></td>
                        <td><?= htmlspecialchars($movimiento['etapa'] ?? $movimiento['subtipo_movimiento'] ?? '') ?></td>
                        <td><?= htmlspecialchars($movimiento['tramite'] ?? $movimiento['tipo_movimiento'] ?? '') ?></td>
                        <td class="descripcion-movimiento" title="<?= htmlspecialchars($movimiento['descripcion'] ?? '') ?>">
                            <?= htmlspecialchars($movimiento['descripcion'] ?? '') ?>
                        </td>
                        <td><?= htmlspecialchars($movimiento['foja'] ?? '') ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php endif; ?>
    </div>

    <!-- Modal para visualizar PDFs -->
    <div id="modalPDF" class="modal-pdf">
        <div class="modal-content-pdf">
            <span class="close-modal" onclick="cerrarPDF()">&times;</span>
            <h4 id="tituloPDF"></h4>
            <iframe id="pdfViewer" class="pdf-viewer"></iframe>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        function verPDF(nombreArchivo, base64Content) {
            if (!base64Content) {
                alert('El PDF no está disponible');
                return;
            }
            
            // Crear blob desde base64
            const byteCharacters = atob(base64Content);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            // Mostrar en modal
            document.getElementById('tituloPDF').textContent = nombreArchivo;
            document.getElementById('pdfViewer').src = url;
            document.getElementById('modalPDF').style.display = 'block';
        }
        
        function cerrarPDF() {
            document.getElementById('modalPDF').style.display = 'none';
            const iframe = document.getElementById('pdfViewer');
            iframe.src = '';
        }
        
        // Cerrar modal al hacer clic fuera
        window.onclick = function(event) {
            const modal = document.getElementById('modalPDF');
            if (event.target == modal) {
                cerrarPDF();
            }
        }
    </script>
</body>
</html>