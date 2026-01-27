<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Contrato – CRM</title>
<meta name="viewport" content="width=device-width, initial-scale=1">

<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">

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

                        <tbody id="tablaCausas">
                            <!-- Cargado dinámicamente desde MySQL via AJAX -->
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
        <select id="m_cuaderno" class="form-select w-25 mb-3" onchange="filtrarPorCuaderno()">
            <option value="">Todos los cuadernos</option>
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
// Cargar causas desde MySQL
document.addEventListener('DOMContentLoaded', function() {
    cargarCausas();
});

async function cargarCausas() {
    try {
        const res = await fetch('api/listar_causas.php');
        const data = await res.json();

        if (!data.success) {
            console.error('Error al cargar causas:', data.error);
            return;
        }

        const tbody = document.getElementById('tablaCausas');
        tbody.innerHTML = '';

        data.causas.forEach(causa => {
            const tr = document.createElement('tr');
            tr.dataset.rit = causa.rit;
            tr.innerHTML = `
                <td>${causa.rit}</td>
                <td>${causa.folio || '-'}</td>
                <td>${causa.cliente || '-'}</td>
                <td>${causa.rut || '-'}</td>
                <td>${causa.abogado || '-'}</td>
                <td>${causa.juzgado || '-'}</td>
                <td>${causa.tribunal_nombre}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-warning">⬇</button>
                    <button class="btn btn-sm btn-primary btn-ver-causa"
                            data-bs-toggle="modal"
                            data-bs-target="#modalDetalleCivil">👁</button>
                    <button class="btn btn-sm btn-success">📄</button>
                    <button class="btn btn-sm btn-danger">✖</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Agregar event listeners a los botones
        document.querySelectorAll('.btn-ver-causa').forEach(btn => {
            btn.addEventListener('click', function() {
                const tr = this.closest('tr');
                const rit = tr.dataset.rit;
                if (rit) {
                    buscarCausa(rit);
                }
            });
        });
    } catch (error) {
        console.error('Error cargando causas:', error);
    }
}

// Variables globales para filtrado
let todosLosMovimientos = [];
let movimientosActuales = [];
let cuadernosDisponibles = [];
let ritActual = '';

async function buscarCausa(rit) {
    ritActual = rit;
    const res = await fetch(`api/causa.php?rol=${encodeURIComponent(rit)}`);
    const respuesta = await res.json();
    const tbody = document.querySelector('#tablaHistoria tbody');
    tbody.innerHTML = '';

    // Usar formato nuevo con movimientos estructurados
    if (respuesta.movimientos && Array.isArray(respuesta.movimientos)) {
        todosLosMovimientos = respuesta.movimientos;
        movimientosActuales = [...todosLosMovimientos];

        // Cargar cuadernos en el select
        cuadernosDisponibles = respuesta.cuadernos || [{id: '1', nombre: 'Principal', total_movimientos: todosLosMovimientos.length}];
        const selectCuaderno = document.getElementById('m_cuaderno');
        selectCuaderno.innerHTML = '<option value="">Todos los cuadernos</option>';
        cuadernosDisponibles.forEach(cuad => {
            selectCuaderno.innerHTML += `<option value="${cuad.id}">${cuad.id} - ${cuad.nombre} (${cuad.total_movimientos})</option>`;
        });

        // Mostrar info de cabecera
        if (respuesta.causa) {
            document.getElementById('m_rol').textContent = respuesta.causa.rit || '-';
            document.getElementById('m_fing').textContent = respuesta.causa.fecha_ingreso || '-';
            document.getElementById('m_promotora').textContent = respuesta.causa.caratulado || '-';
            document.getElementById('m_tribunal').textContent = respuesta.causa.tribunal || '-';
            document.getElementById('m_estadm').textContent = respuesta.causa.estado || 'SIN_INFORMACION';
            document.getElementById('m_proc').textContent = 'Ejecutivo Obligación de Dar';
            document.getElementById('m_ubic').textContent = 'Archivada Digital';
            document.getElementById('m_estproc').textContent = respuesta.causa.estado || 'Concluido';
            document.getElementById('m_etapa').textContent = respuesta.causa.etapa || 'Terminada';
        }

        renderizarMovimientos();
    } else {
        // Fallback a formato legacy
        const data = respuesta.legacy || respuesta;
        if (!Array.isArray(data)) {
            alert('Formato de datos inválido');
            return;
        }
        renderizarFormatoLegacy(data, rit);
    }
}

function filtrarPorCuaderno() {
    const cuadernoSeleccionado = document.getElementById('m_cuaderno').value;
    if (!cuadernoSeleccionado) {
        movimientosActuales = [...todosLosMovimientos];
    } else {
        movimientosActuales = todosLosMovimientos.filter(m => m.cuaderno_id === cuadernoSeleccionado);
    }
    renderizarMovimientos();
}

function renderizarMovimientos() {
    const tbody = document.querySelector('#tablaHistoria tbody');
    tbody.innerHTML = '';

    const ritParts = ritActual.split('-');
    const rolNum = ritParts[1];
    const anio = ritParts[2];

    movimientosActuales.forEach(mov => {
        const folio = mov.folio || mov.indice || '-';
        const etapa = mov.etapa || '-';
        const tramite = mov.tramite || '-';
        const desc = mov.descripcion || '-';
        const fecha = mov.fecha || '-';
        const foja = mov.foja || '-';
        const tienePdfAzul = mov.tiene_pdf_azul || false;
        const tienePdfRojo = mov.tiene_pdf_rojo || false;

        let docCol = '<div style="display:flex;gap:4px;align-items:center;">';
        if (tienePdfAzul) {
            const urlAzul = `api/descargar_pdf.php?rit=${encodeURIComponent(ritActual)}&folio=${encodeURIComponent(folio)}&color=azul`;
            docCol += `<a href="${urlAzul}" target="_blank" class="pdf-link" style="color:#0ea5e9;font-size:18px;text-decoration:none;" title="Ver PDF Principal (Azul)" onclick="event.preventDefault(); abrirPDF('${urlAzul}'); return false;">
                <i class="fa fa-file-pdf-o" style="color:#0ea5e9;"></i>
            </a>`;
        }
        if (tienePdfRojo) {
            const urlRojo = `api/descargar_pdf.php?rit=${encodeURIComponent(ritActual)}&folio=${encodeURIComponent(folio)}&color=rojo`;
            docCol += `<a href="${urlRojo}" target="_blank" class="pdf-link" style="color:#ef4444;font-size:18px;text-decoration:none;" title="Ver PDF Anexo (Rojo)" onclick="event.preventDefault(); abrirPDF('${urlRojo}'); return false;">
                <i class="fa fa-file-pdf-o" style="color:#ef4444;"></i>
            </a>`;
        }
        if (!tienePdfAzul && !tienePdfRojo) {
            docCol = '<span style="color:#999;font-size:12px;">Sin documentos</span>';
        }
        docCol += '</div>';

        tbody.innerHTML += `
            <tr data-cuaderno="${mov.cuaderno_id || '1'}">
                <td>${folio}</td>
                <td>${docCol}</td>
                <td>${folio}</td>
                <td>${etapa}</td>
                <td>${tramite}</td>
                <td>${desc}</td>
                <td>${fecha}</td>
                <td>${foja}</td>
                <td></td>
            </tr>
        `;
    });
}

function renderizarFormatoLegacy(data, rit) {
    const tbody = document.querySelector('#tablaHistoria tbody');
    let cab = null;
    let startIndex = 0;

    for (let i = 0; i < Math.min(data.length, 5); i++) {
        const row = data[i];
        if (row && row[1] && typeof row[1] === 'string' && row[1].match(/^C?-?\d+-\d{4}$/)) {
            cab = row;
            startIndex = i + 1;
            break;
        }
    }

    if (!cab) {
        cab = data[1] || data[0] || [];
        startIndex = 2;
    }

    document.getElementById('m_rol').textContent = cab?.[1] || '-';
    document.getElementById('m_fing').textContent = cab?.[2] || '-';
    document.getElementById('m_promotora').textContent = cab?.[3] || '-';
    document.getElementById('m_tribunal').textContent = cab?.[4] || '-';

    const ritParts = rit.split('-');
    const rolNum = ritParts[1];
    const anio = ritParts[2];

    const movimientos = data.slice(startIndex).filter(row => {
        if (row[0] && ['AB.DTE', 'DDO.', 'DTE.'].includes(row[0])) return false;
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

        tbody.innerHTML += `
            <tr>
                <td>${folio || '-'}</td>
                <td>${tienePdf ? '<button class="btn btn-sm btn-primary">📄</button>' : '-'}</td>
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

// Función para abrir PDF en nueva ventana/modal
function abrirPDF(url) {
    // Abrir en nueva ventana
    const ventana = window.open(url, '_blank', 'width=800,height=600,scrollbars=yes');
    if (!ventana) {
        // Si el popup está bloqueado, abrir en la misma ventana
        window.location.href = url;
    }
}

// Función alternativa para mostrar PDF en modal (similar al poder judicial)
function verPDFEnModal(url, nombreArchivo) {
    // Crear modal si no existe
    let modal = document.getElementById('modalPDF');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalPDF';
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Visualizador de PDF</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" style="padding:0;">
                        <iframe id="pdfFrame" src="" style="width:100%;height:80vh;border:none;"></iframe>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Cargar PDF en el iframe
    const iframe = document.getElementById('pdfFrame');
    iframe.src = url;
    
    // Mostrar modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}
</script>

</body>
</html>
