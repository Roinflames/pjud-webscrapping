/**
 * MÓDULO: Visualización de Casos PJUD
 * 
 * Módulo reutilizable para integrar en ERP
 * Proporciona componentes UI modulares con Bootstrap 4.6
 * 
 * Uso:
 *   import { VisualizacionCasos } from './modules/visualizacion-casos.js';
 *   const viewer = new VisualizacionCasos({ apiBase: '/api/mvp' });
 *   viewer.render('#mi-contenedor');
 */

class VisualizacionCasos {
  constructor(options = {}) {
    this.apiBase = options.apiBase || '/api/mvp';
    this.container = null;
    this.causas = [];
    this.filtros = {
      rit: '',
      abogado_id: '',
      valida: true,
      conMovimientos: false,
      competencia: '',
      tribunal: '',
      tipoCausa: ''
    };
    this.onMovimientosClick = options.onMovimientosClick || this.defaultOnMovimientosClick.bind(this);
  }

  /**
   * Renderizar el módulo en un contenedor
   */
  render(containerSelector) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) {
      throw new Error(`Contenedor no encontrado: ${containerSelector}`);
    }

    this.container.innerHTML = this.getHTML();
    this.attachEventListeners();
    this.cargarCausas();
  }

  /**
   * Obtener HTML del módulo
   */
  getHTML() {
    return `
      <div class="pjud-module-visualizacion-casos">
        <!-- Panel de Filtros -->
        <div class="card mb-3">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0"><i class="fa fa-filter"></i> Filtros</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-3">
                <div class="form-group">
                  <label>Buscar por RIT</label>
                  <input type="text" class="form-control" id="filtro-rit" 
                         placeholder="Ej: C-12345-2020" value="${this.filtros.rit}">
                </div>
              </div>
              <div class="col-md-3">
                <div class="form-group">
                  <label>Abogado ID</label>
                  <input type="number" class="form-control" id="filtro-abogado-id" 
                         placeholder="ID del abogado" value="${this.filtros.abogado_id}">
                </div>
              </div>
              <div class="col-md-2">
                <div class="form-group">
                  <label>Competencia</label>
                  <input type="text" class="form-control" id="filtro-competencia" 
                         placeholder="Ej: 3" value="${this.filtros.competencia}">
                </div>
              </div>
              <div class="col-md-2">
                <div class="form-group">
                  <label>Tribunal</label>
                  <input type="text" class="form-control" id="filtro-tribunal" 
                         placeholder="ID Tribunal" value="${this.filtros.tribunal}">
                </div>
              </div>
              <div class="col-md-2">
                <div class="form-group">
                  <label>&nbsp;</label>
                  <button class="btn btn-primary btn-block" onclick="window.pjudModule?.aplicarFiltros()">
                    <i class="fa fa-search"></i> Buscar
                  </button>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-md-12">
                <div class="form-check form-check-inline">
                  <input class="form-check-input" type="checkbox" id="filtro-validas" 
                         ${this.filtros.valida ? 'checked' : ''}>
                  <label class="form-check-label" for="filtro-validas">
                    Solo causas válidas
                  </label>
                </div>
                <div class="form-check form-check-inline">
                  <input class="form-check-input" type="checkbox" id="filtro-con-movimientos" 
                         ${this.filtros.conMovimientos ? 'checked' : ''}>
                  <label class="form-check-label" for="filtro-con-movimientos">
                    Solo con movimientos
                  </label>
                </div>
                <button class="btn btn-sm btn-secondary float-right" onclick="window.pjudModule?.limpiarFiltros()">
                  <i class="fa fa-times"></i> Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabla de Causas -->
        <div class="card">
          <div class="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
            <h5 class="mb-0"><i class="fa fa-list"></i> Causas 
              <span id="contador-causas" class="badge badge-light ml-2">-</span>
            </h5>
            <button class="btn btn-sm btn-light" onclick="window.pjudModule?.recargar()">
              <i class="fa fa-refresh"></i> Actualizar
            </button>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover table-striped mb-0">
                <thead class="thead-dark">
                  <tr>
                    <th>RIT</th>
                    <th>Caratulado</th>
                    <th>Competencia</th>
                    <th>Tribunal</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Abogado ID</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody id="tabla-causas-body">
                  <tr>
                    <td colspan="8" class="text-center py-4">
                      <div class="spinner-border text-primary" role="status">
                        <span class="sr-only">Cargando...</span>
                      </div>
                      <p class="mt-2 text-muted">Cargando causas...</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Adjuntar event listeners
   */
  attachEventListeners() {
    // Exponer métodos globalmente para que los onclick funcionen
    window.pjudModule = this;

    // Enter en filtros
    ['filtro-rit', 'filtro-abogado-id', 'filtro-competencia', 'filtro-tribunal'].forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            this.aplicarFiltros();
          }
        });
      }
    });
  }

  /**
   * Aplicar filtros
   */
  aplicarFiltros() {
    this.filtros.rit = document.getElementById('filtro-rit').value.trim();
    this.filtros.abogado_id = document.getElementById('filtro-abogado-id').value.trim();
    this.filtros.competencia = document.getElementById('filtro-competencia').value.trim();
    this.filtros.tribunal = document.getElementById('filtro-tribunal').value.trim();
    this.filtros.valida = document.getElementById('filtro-validas').checked;
    this.filtros.conMovimientos = document.getElementById('filtro-con-movimientos').checked;

    this.cargarCausas();
  }

  /**
   * Limpiar filtros
   */
  limpiarFiltros() {
    document.getElementById('filtro-rit').value = '';
    document.getElementById('filtro-abogado-id').value = '';
    document.getElementById('filtro-competencia').value = '';
    document.getElementById('filtro-tribunal').value = '';
    document.getElementById('filtro-validas').checked = true;
    document.getElementById('filtro-con-movimientos').checked = false;

    this.filtros = {
      rit: '',
      abogado_id: '',
      valida: true,
      conMovimientos: false,
      competencia: '',
      tribunal: '',
      tipoCausa: ''
    };

    this.cargarCausas();
  }

  /**
   * Recargar causas
   */
  recargar() {
    this.cargarCausas(true);
  }

  /**
   * Cargar causas desde la API
   */
  async cargarCausas(forzarRecarga = false) {
    const tbody = document.getElementById('tabla-causas-body');
    const contador = document.getElementById('contador-causas');

    try {
      // Construir query params
      const params = new URLSearchParams({
        limite: 1000,
        offset: 0
      });

      if (this.filtros.valida) {
        params.append('valida', 'true');
      }

      if (this.filtros.conMovimientos) {
        params.append('conMovimientos', 'true');
      }

      if (this.filtros.competencia) {
        params.append('competencia', this.filtros.competencia);
      }

      if (this.filtros.tribunal) {
        params.append('tribunal', this.filtros.tribunal);
      }

      if (this.filtros.tipoCausa) {
        params.append('tipoCausa', this.filtros.tipoCausa);
      }

      // Mostrar loading
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-3">
            <div class="spinner-border spinner-border-sm text-primary" role="status">
              <span class="sr-only">Cargando...</span>
            </div>
            <span class="ml-2">Cargando causas...</span>
          </td>
        </tr>
      `;

      const response = await fetch(`${this.apiBase}/causas?${params.toString()}`);
      const data = await response.json();

      this.causas = data.causas || [];

      // Aplicar filtros locales (RIT y abogado_id que no están en la API)
      let causasFiltradas = this.causas;

      if (this.filtros.rit) {
        const ritNormalizado = this.filtros.rit.toUpperCase().replace(/[^A-Z0-9-]/g, '');
        causasFiltradas = causasFiltradas.filter(c => {
          const cRit = (c.rit || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
          return cRit.includes(ritNormalizado);
        });
      }

      if (this.filtros.abogado_id) {
        causasFiltradas = causasFiltradas.filter(c => {
          return c.abogado_id && String(c.abogado_id) === String(this.filtros.abogado_id);
        });
      }

      // Renderizar tabla
      this.renderTabla(causasFiltradas);
      contador.textContent = causasFiltradas.length;

    } catch (error) {
      console.error('Error cargando causas:', error);
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-danger py-3">
            <i class="fa fa-exclamation-triangle"></i> Error al cargar causas: ${error.message}
          </td>
        </tr>
      `;
    }
  }

  /**
   * Renderizar tabla de causas
   */
  renderTabla(causas) {
    const tbody = document.getElementById('tabla-causas-body');

    if (causas.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-muted py-4">
            No se encontraron causas que coincidan con los filtros
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = causas.map(causa => {
      const estadoBadge = this.getEstadoBadge(causa);
      const acciones = this.getAcciones(causa);

      return `
        <tr>
          <td><strong>${causa.rit || '-'}</strong></td>
          <td>${this.truncate(causa.caratulado || '-', 40)}</td>
          <td>${causa.competencia || '-'}</td>
          <td>${causa.tribunal || '-'}</td>
          <td>${causa.tipoCausa || '-'}</td>
          <td>${estadoBadge}</td>
          <td>${causa.abogado_id || '-'}</td>
          <td>${acciones}</td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Obtener badge de estado
   */
  getEstadoBadge(causa) {
    if (causa.tieneMovimientos) {
      return '<span class="badge badge-success">Procesada</span>';
    } else if (causa.valida) {
      return '<span class="badge badge-warning">Pendiente</span>';
    } else {
      return '<span class="badge badge-danger">Inválida</span>';
    }
  }

  /**
   * Obtener botones de acciones
   */
  getAcciones(causa) {
    if (causa.tieneMovimientos) {
      return `
        <button class="btn btn-sm btn-success" onclick="window.pjudModule?.verMovimientos('${causa.rit}')" 
                title="Ver movimientos">
          <i class="fa fa-list"></i> Movimientos
        </button>
      `;
    } else if (causa.valida) {
      return `
        <button class="btn btn-sm btn-primary" onclick="window.pjudModule?.ejecutarScraping('${causa.rit}')" 
                title="Ejecutar scraping">
          <i class="fa fa-play"></i> Procesar
        </button>
      `;
    } else {
      return '<span class="text-muted small">Datos incompletos</span>';
    }
  }

  /**
   * Ver movimientos de un RIT
   */
  async verMovimientos(rit) {
    this.onMovimientosClick(rit);
  }

  /**
   * Handler por defecto para ver movimientos
   */
  defaultOnMovimientosClick(rit) {
    // Crear modal dinámicamente si no existe
    let modal = document.getElementById('modalMovimientosPJUD');
    if (!modal) {
      modal = this.crearModalMovimientos();
      document.body.appendChild(modal);
    }

    // Cargar movimientos
    this.cargarMovimientosEnModal(rit);
    
    // Mostrar modal
    $(modal).modal('show');
  }

  /**
   * Crear modal de movimientos
   */
  crearModalMovimientos() {
    const modal = document.createElement('div');
    modal.id = 'modalMovimientosPJUD';
    modal.className = 'modal fade';
    modal.setAttribute('tabindex', '-1');
    modal.innerHTML = `
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title"><i class="fa fa-list"></i> Movimientos Procesales - <span id="modal-rit-titulo"></span></h5>
            <button type="button" class="close text-white" data-dismiss="modal">
              <span>&times;</span>
            </button>
          </div>
          <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
            <div id="modal-movimientos-body" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="sr-only">Cargando...</span>
              </div>
              <p class="mt-2 text-muted">Cargando movimientos...</p>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Cerrar</button>
          </div>
        </div>
      </div>
    `;
    return modal;
  }

  /**
   * Cargar movimientos en el modal
   */
  async cargarMovimientosEnModal(rit) {
    const titulo = document.getElementById('modal-rit-titulo');
    const body = document.getElementById('modal-movimientos-body');

    if (titulo) titulo.textContent = rit;

    try {
      const response = await fetch(`${this.apiBase}/movimientos/${rit}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();

      if (data.movimientos && data.movimientos.length > 0) {
        body.innerHTML = this.renderMovimientos(data);
      } else {
        body.innerHTML = `
          <div class="alert alert-info">
            <i class="fa fa-info-circle"></i> No se encontraron movimientos para este RIT.
            <br><small>Ejecuta scraping primero para obtener los movimientos.</small>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error cargando movimientos:', error);
      body.innerHTML = `
        <div class="alert alert-danger">
          <i class="fa fa-exclamation-triangle"></i> Error al cargar movimientos: ${error.message}
        </div>
      `;
    }
  }

  /**
   * Renderizar movimientos
   */
  renderMovimientos(data) {
    const movimientos = data.movimientos || [];
    
    return `
      <div class="table-responsive">
        <table class="table table-striped table-hover">
          <thead class="thead-dark">
            <tr>
              <th>Folio</th>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Documentos</th>
            </tr>
          </thead>
          <tbody>
            ${movimientos.map(mov => `
              <tr>
                <td><span class="badge badge-secondary">${mov.folio || mov.indice || '-'}</span></td>
                <td>${mov.fecha || '-'}</td>
                <td><strong>${mov.tipo_movimiento || '-'}</strong></td>
                <td>${this.truncate(mov.descripcion || '-', 60)}</td>
                <td>
                  ${mov.pdf_principal_nombre ? `
                    <button class="btn btn-sm btn-primary" 
                            onclick="window.open('/api/scraping/pdf/${rit}/${mov.pdf_principal_nombre}', '_blank')"
                            title="PDF Principal">
                      <i class="fa fa-file-pdf-o"></i> Azul
                    </button>
                  ` : ''}
                  ${mov.pdf_anexo_nombre ? `
                    <button class="btn btn-sm btn-danger" 
                            onclick="window.open('/api/scraping/pdf/${rit}/${mov.pdf_anexo_nombre}', '_blank')"
                            title="PDF Anexo">
                      <i class="fa fa-file-pdf-o"></i> Rojo
                    </button>
                  ` : ''}
                  ${!mov.pdf_principal_nombre && !mov.pdf_anexo_nombre ? '<span class="text-muted small">-</span>' : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Ejecutar scraping (placeholder)
   */
  async ejecutarScraping(rit) {
    if (confirm(`¿Deseas ejecutar scraping para el RIT: ${rit}?`)) {
      alert('Funcionalidad de scraping pendiente de implementar');
    }
  }

  /**
   * Truncar texto
   */
  truncate(text, maxLength) {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VisualizacionCasos };
}

// Exponer globalmente para uso directo en HTML
window.VisualizacionCasos = VisualizacionCasos;
