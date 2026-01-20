/**
 * MÓDULO: Crear Evento de Scraping Específico
 * 
 * Módulo reutilizable para que el ERP solicite scraping mediante eventos
 * 
 * Uso:
 *   import { CrearEventoScraping } from './modules/crear-evento-scraping.js';
 *   const eventoCreator = new CrearEventoScraping({ apiBase: '/api/erp' });
 *   eventoCreator.render('#mi-contenedor');
 */

class CrearEventoScraping {
  constructor(options = {}) {
    this.apiBase = options.apiBase || '/api/erp';
    this.container = null;
    this.onEventoCreado = options.onEventoCreado || null;
  }

  /**
   * Renderizar el módulo
   */
  render(containerSelector) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) {
      throw new Error(`Contenedor no encontrado: ${containerSelector}`);
    }

    this.container.innerHTML = this.getHTML();
    this.attachEventListeners();
  }

  /**
   * Obtener HTML del módulo
   */
  getHTML() {
    return `
      <div class="pjud-module-crear-evento">
        <div class="card">
          <div class="card-header bg-success text-white">
            <h5 class="mb-0"><i class="fa fa-plus-circle"></i> Solicitar Scraping Específico</h5>
          </div>
          <div class="card-body">
            <form id="form-crear-evento-scraping">
              <div class="row">
                <div class="col-md-6">
                  <div class="form-group">
                    <label>RIT <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="evento-rit" 
                           placeholder="Ej: C-12345-2020" required>
                    <small class="form-text text-muted">Formato: TIPO-ROL-AÑO</small>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="form-group">
                    <label>Competencia</label>
                    <input type="number" class="form-control" id="evento-competencia" 
                           placeholder="Ej: 3">
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="form-group">
                    <label>Corte</label>
                    <input type="number" class="form-control" id="evento-corte" 
                           placeholder="Ej: 90">
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col-md-3">
                  <div class="form-group">
                    <label>Tribunal</label>
                    <input type="number" class="form-control" id="evento-tribunal" 
                           placeholder="ID Tribunal">
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="form-group">
                    <label>Tipo Causa</label>
                    <select class="form-control" id="evento-tipo-causa">
                      <option value="C" selected>Civil (C)</option>
                      <option value="L">Laboral (L)</option>
                      <option value="E">Ejecutivo (E)</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="form-group">
                    <label>Abogado ID</label>
                    <input type="number" class="form-control" id="evento-abogado-id" 
                           placeholder="ID del abogado">
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="form-group">
                    <label>Prioridad</label>
                    <select class="form-control" id="evento-prioridad">
                      <option value="5" selected>Normal (5)</option>
                      <option value="1">Baja (1)</option>
                      <option value="3">Media (3)</option>
                      <option value="7">Alta (7)</option>
                      <option value="10">Urgente (10)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col-md-12">
                  <div class="form-group">
                    <label>Metadatos Adicionales (JSON)</label>
                    <textarea class="form-control" id="evento-metadata" rows="3" 
                              placeholder='{"nota": "Causa importante", "cliente_id": 123}'></textarea>
                    <small class="form-text text-muted">Opcional: Información adicional en formato JSON</small>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <button type="submit" class="btn btn-success">
                  <i class="fa fa-paper-plane"></i> Crear Evento de Scraping
                </button>
                <button type="button" class="btn btn-secondary ml-2" onclick="window.eventoCreator?.limpiarFormulario()">
                  <i class="fa fa-times"></i> Limpiar
                </button>
              </div>

              <div id="evento-mensaje" class="mt-3"></div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Adjuntar event listeners
   */
  attachEventListeners() {
    window.eventoCreator = this;

    const form = document.getElementById('form-crear-evento-scraping');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.crearEvento();
      });
    }
  }

  /**
   * Crear evento de scraping
   */
  async crearEvento() {
    const mensajeDiv = document.getElementById('evento-mensaje');
    
    // Obtener datos del formulario
    const datos = {
      rit: document.getElementById('evento-rit').value.trim(),
      competencia_id: document.getElementById('evento-competencia').value || null,
      corte_id: document.getElementById('evento-corte').value || null,
      tribunal_id: document.getElementById('evento-tribunal').value || null,
      tipo_causa: document.getElementById('evento-tipo-causa').value,
      abogado_id: document.getElementById('evento-abogado-id').value || null,
      prioridad: parseInt(document.getElementById('evento-prioridad').value),
      metadata: this.parseMetadata(document.getElementById('evento-metadata').value)
    };

    // Validar RIT
    if (!datos.rit) {
      this.mostrarMensaje('Por favor ingresa un RIT', 'danger');
      return;
    }

    // Mostrar loading
    mensajeDiv.innerHTML = `
      <div class="alert alert-info">
        <div class="spinner-border spinner-border-sm mr-2" role="status"></div>
        Creando evento de scraping...
      </div>
    `;

    try {
      const response = await fetch(`${this.apiBase}/eventos/crear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
      });

      const resultado = await response.json();

      if (response.ok && resultado.success) {
        this.mostrarMensaje(`
          <strong>✅ Evento creado exitosamente!</strong><br>
          ID del evento: <strong>${resultado.evento_id}</strong><br>
          <small>El scraping se procesará según la prioridad establecida.</small>
        `, 'success');

        // Limpiar formulario
        this.limpiarFormulario();

        // Callback si existe
        if (this.onEventoCreado) {
          this.onEventoCreado(resultado);
        }
      } else {
        throw new Error(resultado.error || resultado.mensaje || 'Error desconocido');
      }

    } catch (error) {
      console.error('Error creando evento:', error);
      this.mostrarMensaje(`
        <strong>❌ Error al crear evento</strong><br>
        ${error.message}
      `, 'danger');
    }
  }

  /**
   * Parsear metadata JSON
   */
  parseMetadata(text) {
    if (!text || !text.trim()) return null;
    try {
      return JSON.parse(text);
    } catch (e) {
      return { raw: text };
    }
  }

  /**
   * Mostrar mensaje
   */
  mostrarMensaje(mensaje, tipo = 'info') {
    const mensajeDiv = document.getElementById('evento-mensaje');
    mensajeDiv.innerHTML = `<div class="alert alert-${tipo}">${mensaje}</div>`;
    
    // Auto-ocultar después de 5 segundos si es éxito
    if (tipo === 'success') {
      setTimeout(() => {
        mensajeDiv.innerHTML = '';
      }, 5000);
    }
  }

  /**
   * Limpiar formulario
   */
  limpiarFormulario() {
    document.getElementById('evento-rit').value = '';
    document.getElementById('evento-competencia').value = '';
    document.getElementById('evento-corte').value = '';
    document.getElementById('evento-tribunal').value = '';
    document.getElementById('evento-tipo-causa').value = 'C';
    document.getElementById('evento-abogado-id').value = '';
    document.getElementById('evento-prioridad').value = '5';
    document.getElementById('evento-metadata').value = '';
    document.getElementById('evento-mensaje').innerHTML = '';
  }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CrearEventoScraping };
}

window.CrearEventoScraping = CrearEventoScraping;
