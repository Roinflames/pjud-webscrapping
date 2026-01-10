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
            <button id="btnBuscar" class="btn btn-primary"
                    onclick="buscarCausa()"
                    data-bs-toggle="modal"
                    data-bs-target="#modalDetalleCivil">
                Buscar
            </button>

            <button id="btnLimpiar" class="btn btn-warning">Limpiar</button>
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
    // 'C-16707-2019'
    const libroInput = document.getElementById('libro').value;
    const anioInput = document.getElementById('anio').value;
    const rolInput = libroInput + "-" + document.getElementById('rol').value + "-" + anioInput;

    const res = await fetch(`api/causa.php?rol=${encodeURIComponent(rolInput)}`);
    const data = await res.json();
    const tbody = document.querySelector('#tablaHistoria tbody');
    tbody.innerHTML = '';
    console.log(data);

    if (!Array.isArray(data)) {

    if (data.error == 'Archivo de resultados no encontrado') {
        tbody.innerHTML = '';
        return
    }
        alert('Formato de datos inválido');
        return;
    }

    /* ======================
       CABECERA
    ====================== */
    const cab = data[0];

    document.getElementById('m_rol').textContent = cab[1];
    document.getElementById('m_fing').textContent = cab[2];
    document.getElementById('m_promotora').textContent = cab[3];
    document.getElementById('m_tribunal').textContent = cab[4];

    document.getElementById('m_estadm').textContent = 'Archivada';
    document.getElementById('m_proc').textContent = 'Ejecutivo Obligación de Dar';
    document.getElementById('m_ubic').textContent = 'Archivada Digital';
    document.getElementById('m_estproc').textContent = 'Concluido';
    document.getElementById('m_etapa').textContent = 'Terminada';

    /* ======================
       HISTORIA
    ====================== */

    data.slice(2, 17).forEach(row => {
        const folio = row[0];
        const tienePdf = row[1] === 'Descargar Documento';
        const etapa = row[3];
        const tramite = row[4];
        const desc = row[5];
        const fecha = row[6];
        const foja = row[7];

        const pdfUrl = folio
            ? `/outputs/16707_2019_doc_${folio}.pdf`
            : null;
        console.log(pdfUrl);
        
        tbody.innerHTML += `
            <tr>
                <td>${folio || '-'}</td>
                <td>
                    ${
                      tienePdf && pdfUrl
                      ? `<a href="${pdfUrl}" target="_blank" class="btn btn-sm btn-outline-primary">Ver PDF</a>`
                      : ''
                    }
                </td>
                <td>${folio || '-'}</td>
                <td>${etapa || '-'}</td>
                <td>${tramite || '-'}</td>
                <td>${desc || '-'}</td>
                <td>${fecha || '-'}</td>
                <td>${foja || '-'}</td>
                <td></td>
            </tr>
        `;
    });
}
</script>

</body>
</html>
