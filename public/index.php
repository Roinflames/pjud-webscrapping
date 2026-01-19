<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Consulta Unificada - Réplica</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .tab-container { border: 1px solid #ccc; border-top: none; padding: 20px; background: white; }
        .verde-tab { background-color: #5cb85c !important; color: white !important; }
        .info-box { background: #d9edf7; padding: 12px; font-size: 18px; font-weight: bold; }
        .alerta { background: #dff0d8; padding: 15px; border-radius: 5px; margin-top: 15px; }
    </style>
</head>

<body class="bg-light">

<div class="container mt-4">

    <!-- <div class="card mb-4">
        <div class="card-header bg-info text-white">
            Archivos Disponibles en /public/outputs
        </div>
        <div class="list-group list-group-flush">
            <?php
            $outputDir = __DIR__ . '/outputs';
            if (is_dir($outputDir)) {
                $files = array_diff(scandir($outputDir), ['.', '..']);
                if (empty($files)) {
                    echo '<div class="list-group-item">No se encontraron archivos.</div>';
                } else {
                    foreach ($files as $file) {
                        $filePath = 'outputs/' . htmlspecialchars($file);
                        echo '<a href="' . $filePath . '" class="list-group-item list-group-item-action" download>' . htmlspecialchars($file) . '</a>';
                    }
                }
            } else {
                echo '<div class="list-group-item text-danger">Error: Directorio de salidas no encontrado.</div>';
            }
            ?>
        </div>
    </div> -->

    <h5 class="mb-3">
        <a href="#" class="text-success">Consulta de Causas</a> / Consulta Unificada
    </h5>

    <!-- TABS -->
    <ul class="nav nav-tabs">
        <li class="nav-item">
            <a class="nav-link active verde-tab" href="#">Búsqueda por RIT</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" href="#">Búsqueda por Nombre</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" href="#">Búsqueda por Fecha</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" href="#">Búsqueda por Rut Persona Jurídica</a>
        </li>
    </ul>

    <div class="tab-container">

        <!-- FILA 1 -->
        <div class="row mb-3">
            <div class="col-md-4">
                <label class="form-label">Competencia</label>
                <select id="competencia" class="form-select">
                    <option>Corte Suprema</option>
                    <option>Corte Apelaciones</option>
                    <option>Civil</option>
                </select>
            </div>

            <div class="col-md-4">
                <label class="form-label">Corte</label>
                <select id="corte" class="form-select">
                    <option>Todos</option>
                    <option>C.A. de Santiago</option>
                </select>
            </div>

            <div class="col-md-4">
                <label class="form-label">Tribunal</label>
                <select id="tribunal" class="form-select">
                    <option>Todos</option>
                    <option>18º Juzgado Civil de Santiago</option>
                </select>
            </div>
        </div>

        <!-- FILA 2 -->
        <div class="row mb-3">
            <div class="col-md-4">
                <label class="form-label">Libro/Tipo</label>
                <select id="libro" class="form-select">
                    <option>C</option>
                </select>
            </div>

            <div class="col-md-2">
                <label class="form-label">Rol</label>
                <input id="rol" type="text" class="form-control" placeholder="Ej: 16707">
            </div>

            <div class="col-md-2">
                <label class="form-label">Año</label>
                <input id="anio" type="text" class="form-control" placeholder="2019">
            </div>
        </div>

        <!-- BOTONES -->
        <div class="d-flex gap-2 mb-3">
            <!-- onclick ejecuta JS y data-bs-... abre el modal (requiere bootstrap JS) -->
            <button id="btnBuscar"
                    class="btn btn-primary"
                    onclick="buscarCausa()">
                Buscar
            </button>


            <button id="btnLimpiar" class="btn btn-warning" onclick="limpiarFormulario()">Limpiar</button>
        </div>

        <!-- BLOQUE DE VALORES -->
        <div class="row text-center info-box">
            <div class="col-md-4">VALOR RECUSACIÓN: $10.852</div>
            <div class="col-md-4">DICIEMBRE 2025</div>
            <div class="col-md-4">VALOR SUSPENSIÓN: $34.771</div>
        </div>

        <!-- MENSAJE FINAL -->
        <div class="alerta mt-3">
            Recuerde que las causas reservadas no se muestran en la consulta unificada,
            y según el tipo de reserva, podrá acceder a ellas ingresando con su usuario
            y contraseña a la opción “<strong>Mis Causas</strong>”. Para conocer los tipos de reserva,
            <a href="#" class="btn btn-sm btn-primary">pinchar aquí</a>
        </div>

    </div>
</div>

<!-- Modal Detalle Causa Civil -->
<div class="modal fade" id="modalDetalleCivil" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-xl modal-dialog-scrollable">
    <div class="modal-content">

      <div class="modal-header">
        <h5 class="modal-title">Detalle Causa Civil</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
      </div>

      <div class="modal-body">

        <!-- DATOS PRINCIPALES (se rellenan dinámicamente en buscarCausa) -->
        <div class="row mb-3">
          <div class="col-md-4"><strong>ROL:</strong> <span id="m_rol">-</span></div>
          <div class="col-md-4"><strong>F. Ing.:</strong> <span id="m_fing">-</span></div>
          <div class="col-md-4"><strong>Promotora:</strong> <span id="m_promotora">-</span></div>
        </div>

        <div class="row mb-3">
          <div class="col-md-4"><strong>Est. Adm.:</strong> <span id="m_estadm" class="text-danger">-</span></div>
          <div class="col-md-4"><strong>Proc.:</strong> <span id="m_proc">-</span></div>
          <div class="col-md-4"><strong>Ubicación:</strong> <span id="m_ubic">-</span></div>
        </div>

        <div class="row mb-3">
          <div class="col-md-4"><strong>Estado Proc.:</strong> <span id="m_estproc">-</span></div>
          <div class="col-md-4"><strong>Etapa:</strong> <span id="m_etapa">-</span></div>
          <div class="col-md-4"><strong>Tribunal:</strong> <span id="m_tribunal">-</span></div>
        </div>

        <hr>

        <!-- CUADERNO -->
        <h6><strong>Historia Causa Cuaderno</strong></h6>
        <select id="m_cuaderno" class="form-select w-25 mb-3">
            <option>1 - Principal</option>
        </select>

        <!-- TABS -->
        <ul class="nav nav-tabs mb-3">
            <li class="nav-item">
                <a class="nav-link active" data-bs-toggle="tab" href="#tabHistoria">Historia</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#tabLitigantes">Litigantes</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#tabNotif">Notificaciones</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#tabEscritos">Escritos por Resolver</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" href="#tabExhortos">Exhortos</a>
            </li>
        </ul>

        <div class="tab-content">

            <!-- TAB HISTORIA (tabla con trámites) -->
            <div class="tab-pane fade show active" id="tabHistoria">
                <div class="table-responsive">
                  <table id="tablaHistoria" class="table table-bordered table-striped">
                    <thead class="table-primary">
                      <tr>
                        <th>Folio</th><th>Doc.</th><th>Anexo</th><th>Etapa</th><th>Trámite</th>
                        <th>Desc. Trámite</th><th>Fec. Trámite</th><th>Foja</th><th>Georef.</th>
                      </tr>
                    </thead>
                    <tbody>
                      <!-- filas dinamicas -->
                    </tbody>
                  </table>
                </div>
            </div>

            <!-- LOS OTROS TABS (vacíos por ahora) -->
            <div class="tab-pane fade" id="tabLitigantes">Contenido litigantes...</div>
            <div class="tab-pane fade" id="tabNotif">Contenido notificaciones...</div>
            <div class="tab-pane fade" id="tabEscritos">Contenido escritos...</div>
            <div class="tab-pane fade" id="tabExhortos">Contenido exhortos...</div>

        </div>

      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
      </div>

    </div>
  </div>
</div>

<!-- Bootstrap JS (bundle incluye Popper) - REQUERIDO para modals -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

<script>
async function buscarCausa() {

    limpiarModalDetalleCivil();

    const libro = document.getElementById('libro').value;
    const rol   = document.getElementById('rol').value;
    const anio  = document.getElementById('anio').value;

    if (!rol || !anio) {
        alert('Debe ingresar Rol y Año');
        return;
    }

    const rit = `${libro}-${rol}-${anio}`;

    let res, data;

    try {
        res = await fetch(`api/causa.php?rol=${encodeURIComponent(rit)}`);
        data = await res.json();
    } catch (e) {
        alert('Error de conexión');
        return;
    }

    // ❌ No existe la causa
    if (!Array.isArray(data) || data.length === 0) {
        limpiarModalDetalleCivil();
        alert('Causa no encontrada');
        return;
    }

    /* ======================
       CABECERA
    ====================== */
    const cab = data[0];

    document.getElementById('m_rol').textContent        = cab[1] ?? '-';
    document.getElementById('m_fing').textContent       = cab[2] ?? '-';
    document.getElementById('m_promotora').textContent  = cab[3] ?? '-';
    document.getElementById('m_tribunal').textContent   = cab[4] ?? '-';

    document.getElementById('m_estadm').textContent     = cab[5] ?? '-';
    document.getElementById('m_proc').textContent       = cab[6] ?? '-';
    document.getElementById('m_ubic').textContent       = cab[7] ?? '-';
    document.getElementById('m_estproc').textContent    = cab[8] ?? '-';
    document.getElementById('m_etapa').textContent      = cab[9] ?? '-';

    /* ======================
       HISTORIA
    ====================== */
    const tbody = document.querySelector('#tablaHistoria tbody');
    tbody.innerHTML = '';

    for (let i = 2; i < data.length; i++) {

        const row = data[i];

        // Corte al comenzar sección litigantes
        if (['DDO.', 'AB.DTE', 'DTE.'].includes(row[0])) break;

        const folio   = row[0] ?? '-';
        const etapa   = row[3] ?? '-';
        const tramite = row[4] ?? '-';
        const desc    = row[5] ?? '-';
        const fecha   = row[6] ?? '-';
        const foja    = row[7] ?? '-';

        const pdfUrl = folio !== '-'
            ? `/outputs/${rit.replace(/-/g, '_')}_doc_${folio}.pdf`
            : null;

        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td>${folio}</td>
                <td>
                    ${pdfUrl ? `<a href="${pdfUrl}" target="_blank" class="btn btn-sm btn-outline-primary">Ver PDF</a>` : ''}
                </td>
                <td>${folio}</td>
                <td>${etapa}</td>
                <td>${tramite}</td>
                <td>${desc}</td>
                <td>${fecha}</td>
                <td>${foja}</td>
                <td></td>
            </tr>
        `);
    }

    /* ======================
       ABRIR MODAL (solo aquí)
    ====================== */
    new bootstrap.Modal(
        document.getElementById('modalDetalleCivil')
    ).show();
}
</script>

<script>
function limpiarModalDetalleCivil() {

  // TEXTOS PRINCIPALES
  const spans = [
    'm_rol', 'm_fing', 'm_promotora',
    'm_estadm', 'm_proc', 'm_ubic',
    'm_estproc', 'm_etapa', 'm_tribunal'
  ];

  spans.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '-';
  });

  // LIMPIAR SELECT CUADERNO
  const cuaderno = document.getElementById('m_cuaderno');
  if (cuaderno) {
    cuaderno.innerHTML = '<option value="">-</option>';
  }

  // LIMPIAR TABLA HISTORIA
  const tbodyHistoria = document.querySelector('#tablaHistoria tbody');
  if (tbodyHistoria) {
    tbodyHistoria.innerHTML = '';
  }

  // LIMPIAR CONTENIDO DE LOS OTROS TABS
  document.getElementById('tabLitigantes').innerHTML = '';
  document.getElementById('tabNotif').innerHTML = '';
  document.getElementById('tabEscritos').innerHTML = '';
  document.getElementById('tabExhortos').innerHTML = '';

}
</script>

<script>
// --- INICIO: Funcionalidad para buscar con la tecla Enter ---
function handleEnterKey(event) {
    // Si la tecla presionada es 'Enter'
    if (event.key === 'Enter') {
        // Prevenir la acción por defecto (como recargar la página si estuviera en un formulario)
        event.preventDefault();
        // Simular un clic en el botón de búsqueda para reutilizar toda su funcionalidad
        document.getElementById('btnBuscar').click();
    }
}

// Asignar el detector de eventos a los campos de Rol y Año
document.getElementById('rol').addEventListener('keydown', handleEnterKey);
document.getElementById('anio').addEventListener('keydown', handleEnterKey);
// --- FIN: Funcionalidad para buscar con la tecla Enter ---

// --- INICIO: Funcionalidad para el botón Limpiar ---
function limpiarFormulario() {
    // Limpiar campos de texto
    document.getElementById('rol').value = '';
    document.getElementById('anio').value = '';

    // Restablecer los menús desplegables a la primera opción
    document.getElementById('competencia').selectedIndex = 0;
    document.getElementById('corte').selectedIndex = 0;
    document.getElementById('tribunal').selectedIndex = 0;
    document.getElementById('libro').selectedIndex = 0;
}
// --- FIN: Funcionalidad para el botón Limpiar ---
</script>


</body>
</html>
