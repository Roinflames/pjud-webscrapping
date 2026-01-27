<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Contrato – CRM</title>
<meta name="viewport" content="width=device-width, initial-scale=1">

<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

<style>
body { background:#f5f6f8; font-size:14px; }
.sidebar { width:230px; background:#1f2937; color:#fff; min-height:100vh; position:fixed; }
.sidebar a { color:#cbd5e1; text-decoration:none; display:block; padding:10px 20px; }
.sidebar a:hover { background:#374151; color:white; }
.topbar { background:white; padding:15px 25px; border-bottom:1px solid #ddd; font-size:18px; font-weight:600; }
.main { margin-left:230px; }
.card { border:none; border-radius:6px; }
.table th { font-weight:600; }
.actions button { margin-right:3px; }
</style>
</head>

<body>

<div class="d-flex">

    <!-- SIDEBAR -->
    <div class="sidebar">
        <h5 class="p-3 border-bottom">CRM</h5>
        <a href="#">Panel</a>
        <a href="#">Agendas</a>
        <a href="#">Usuarios</a>
        <a href="#" class="bg-primary text-white">Contrato</a>
        <a href="#">Recaudación</a>
        <a href="#">Cobranza</a>
        <a href="#">Reportes</a>
        <a href="#">Salir</a>
    </div>

    <!-- MAIN -->
    <div class="main flex-fill">

        <div class="topbar">Contrato</div>

        <div class="container-fluid p-4">

            <!-- FILTROS -->
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row g-3 align-items-end">
                        <div class="col-md-2">
                            <label class="form-label">Compañía</label>
                            <select class="form-select">
                                <option>Todos</option>
                                <option>CMR Falabella</option>
                            </select>
                        </div>

                        <div class="col-md-2">
                            <label class="form-label">Folio</label>
                            <input class="form-control" value="20212">
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Cliente</label>
                            <input class="form-control" value="Carlos Domingo Gutierrez Ramos">
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">RIT</label>
                            <input class="form-control">
                        </div>

                        <div class="col-md-1">
                            <button class="btn btn-primary w-100">🔍</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TABLA -->
            <div class="card">
                <div class="card-body">

                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>RIT</th>
                                <th>Folio</th>
                                <th>Cliente</th>
                                <th>Rut</th>
                                <th>Abogado</th>
                                <th>Juzgado</th>
                                <th>Tribunal</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr data-rit="C-16707-2019">
                                <td>C-16707-2019</td>
                                <td>20212</td>
                                <td>Carlos Domingo Gutierrez Ramos</td>
                                <td>8.462.961-8</td>
                                <td>Tatiana Gonzalez</td>
                                <td>Promotora CMR Falabella</td>
                                <td>27 Juzgado Civil de Santiago</td>
                                <td class="actions">
                                    <button class="btn btn-sm btn-warning">⬇</button>
                                    <button class="btn btn-sm btn-primary btn-ver-causa"
                                            data-bs-toggle="modal"
                                            data-bs-target="#modalDetalleCivil">👁</button>
                                    <button class="btn btn-sm btn-success">📄</button>
                                    <button class="btn btn-sm btn-danger">✖</button>
                                </td>
                            </tr>
                            <tr data-rit="C-13786-2018">
                                <td>C-13786-2018</td>
                                <td>20213</td>
                                <td>Prueba Scraping</td>
                                <td>12.345.678-9</td>
                                <td>Test Abogado</td>
                                <td>Promotora CMR Falabella</td>
                                <td>1 Juzgado Civil de Santiago</td>
                                <td class="actions">
                                    <button class="btn btn-sm btn-warning">⬇</button>
                                    <button class="btn btn-sm btn-primary btn-ver-causa"
                                            data-bs-toggle="modal"
                                            data-bs-target="#modalDetalleCivil">👁</button>
                                    <button class="btn btn-sm btn-success">📄</button>
                                    <button class="btn btn-sm btn-danger">✖</button>
                                </td>
                            </tr>
                        </tbody>

                    </table>

                </div>
            </div>

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

        <!-- DATOS PRINCIPALES -->
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

            <!-- TAB HISTORIA -->
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

            <!-- LOS OTROS TABS -->
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

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

<script>
// Manejar clicks en botones de ver causa
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.btn-ver-causa').forEach(btn => {
        btn.addEventListener('click', function() {
            const tr = this.closest('tr');
            const rit = tr.dataset.rit;
            if (rit) {
                buscarCausa(rit);
            }
        });
    });
});

async function buscarCausa(rit) {
    const res = await fetch(`api/causa.php?rol=${encodeURIComponent(rit)}`);
    const data = await res.json();
    const tbody = document.querySelector('#tablaHistoria tbody');
    tbody.innerHTML = '';

    if (!Array.isArray(data)) {
        if (data.error == 'Archivo de resultados no encontrado') {
            tbody.innerHTML = '';
            return;
        }
        alert('Formato de datos inválido');
        return;
    }

    /* CABECERA - buscar la fila que contiene el RIT */
    let cab = null;
    let startIndex = 0;

    // Buscar la cabecera (fila que contiene el RIT en posición 1)
    for (let i = 0; i < Math.min(data.length, 5); i++) {
        const row = data[i];
        if (row && row[1] && typeof row[1] === 'string' && row[1].match(/^C?-?\d+-\d{4}$/)) {
            cab = row;
            startIndex = i + 1;
            break;
        }
    }

    // Fallback si no encuentra cabecera con RIT
    if (!cab) {
        cab = data[1] || data[0] || [];
        startIndex = 2;
    }

    document.getElementById('m_rol').textContent = cab?.[1] || '-';
    document.getElementById('m_fing').textContent = cab?.[2] || '-';
    document.getElementById('m_promotora').textContent = cab?.[3] || '-';
    document.getElementById('m_tribunal').textContent = cab?.[4] || '-';

    document.getElementById('m_estadm').textContent = 'Archivada';
    document.getElementById('m_proc').textContent = 'Ejecutivo Obligación de Dar';
    document.getElementById('m_ubic').textContent = 'Archivada Digital';
    document.getElementById('m_estproc').textContent = 'Concluido';
    document.getElementById('m_etapa').textContent = 'Terminada';

    /* HISTORIA */
    const ritParts = rit.split('-');
    const rolNum = ritParts[1];
    const anio = ritParts[2];

    // Filtrar solo filas de movimientos (tienen folio numérico o vacío en posición 0)
    const movimientos = data.slice(startIndex).filter(row => {
        // Excluir filas de partes (AB.DTE, DDO., DTE.)
        if (row[0] && ['AB.DTE', 'DDO.', 'DTE.'].includes(row[0])) return false;
        // Excluir filas de paginación
        if (row[0] && row[0].includes('Total de registros')) return false;
        return true;
    });

    movimientos.slice(0, 15).forEach(row => {
        const folio = row[0];
        const tienePdf = row[1] === 'Descargar Documento';
        const etapa = row[3];
        const tramite = row[4];
        const desc = row[5];
        const fecha = row[6];
        const foja = row[7];

        const pdfUrl = folio
            ? `/outputs/${rolNum}_${anio}_doc_${folio}.pdf`
            : null;

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
