require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  const now = Date.now();
  const logDir = path.resolve(__dirname, '../logs'); // <-- ajusta según dónde está tu script
  const ssPath = path.join(logDir, `error_${now}.png`);
  const htmlPath = path.join(logDir, `error_${now}.html`);

  try {
    console.log('🚀 Iniciando proceso de creación de caso...');

    // Función para mejorar estilos visuales
    const injectCustomStyles = async (page) => {
      // Inyectar CSS
      await page.addStyleTag({
        content: `
          /* Mejorar fondos de productos y elementos */
          .tab-content,
          .tab-pane {
            background-color: #ffffff !important;
          }
          
          /* Fondos de pestañas */
          .nav-tabs,
          .nav-tabs .nav-link {
            background-color: transparent !important;
          }
          
          .nav-tabs .nav-link.active {
            background-color: #ffffff !important;
            border-bottom-color: #ffffff !important;
          }
          
          /* Fondos de productos y contenedores */
          .form-outline,
          .form-control,
          .select2-container,
          .select2-selection,
          .select2-dropdown {
            background-color: #ffffff !important;
          }
          
          /* Tablas */
          .table,
          .table tbody tr,
          .table thead tr {
            background-color: #ffffff !important;
          }
          
          .table-striped tbody tr:nth-of-type(odd) {
            background-color: #f8f9fa !important;
          }
          
          /* Contenedores principales */
          .row,
          .col,
          .col-12,
          .col-md-4,
          .col-lg-4,
          .col-md-6,
          .col-lg-6 {
            background-color: transparent !important;
          }
          
          /* Select2 dropdown */
          .select2-results__option {
            background-color: #ffffff !important;
          }
          
          .select2-results__option--highlighted {
            background-color: #007bff !important;
            color: #ffffff !important;
          }
          
          /* Badges y labels */
          .badge,
          .label {
            background-color: transparent !important;
          }
          
          /* Botones */
          .btn {
            background-color: #007bff !important;
          }
          
          /* Modal backgrounds */
          .modal-content {
            background-color: #ffffff !important;
          }
          
          /* Inputs y textareas */
          input[type="text"],
          input[type="email"],
          input[type="number"],
          input[type="date"],
          textarea,
          select {
            background-color: #ffffff !important;
            color: #212529 !important;
          }
          
          /* Overlay y backdrop */
          .modal-backdrop {
            background-color: rgba(0, 0, 0, 0.5) !important;
          }
          
          /* Cards y paneles */
          .card,
          .panel {
            background-color: #ffffff !important;
          }
          
          /* Asegurar que el body tenga fondo blanco */
          body {
            background-color: #f5f5f5 !important;
          }
          
          /* Contenedor principal del formulario */
          #createUsersForm,
          form {
            background-color: transparent !important;
          }
          
          /* Secciones con divisores */
          .section-divider {
            background-color: transparent !important;
          }
          
          /* Tag container */
          #tag-container3,
          .tag-container {
            background-color: #ffffff !important;
          }
          
          /* Tabla de actividades */
          #tablaActividades tr {
            background-color: #ffffff !important;
          }
          
          #tablaActividades tr:nth-child(even) {
            background-color: #f8f9fa !important;
          }
          
          /* Productos y elementos específicos que pueden tener fondo negro */
          [class*="product"],
          [id*="product"],
          [class*="item"],
          [id*="item"],
          .product-item,
          .product-card,
          .item-card,
          .list-item {
            background-color: #ffffff !important;
          }
          
          /* Contenedores de productos */
          .products-container,
          .items-container,
          .product-list,
          .item-list {
            background-color: transparent !important;
          }
          
          /* Asegurar que todos los elementos dentro de pestañas tengan fondo adecuado */
          .tab-pane * {
            background-color: inherit !important;
          }
          
          .tab-pane .form-control,
          .tab-pane .form-outline,
          .tab-pane input,
          .tab-pane select,
          .tab-pane textarea {
            background-color: #ffffff !important;
          }
          
          /* Elementos específicos de Select2 que pueden tener fondo negro */
          .select2-search__field {
            background-color: #ffffff !important;
            color: #212529 !important;
          }
          
          /* Contenedores de tags */
          .tag-input {
            background-color: #ffffff !important;
          }
          
          /* Override cualquier fondo negro explícito */
          [style*="background-color: black"],
          [style*="background-color:#000"],
          [style*="background-color:rgb(0,0,0)"],
          [style*="background-color:rgba(0,0,0"] {
            background-color: #ffffff !important;
          }
        `
      });
      
      // Agregar listener para cambios de pestañas
      await page.evaluate(() => {
        // Función para aplicar estilos a elementos nuevos
        const applyStylesToNewElements = () => {
          const style = document.createElement('style');
          style.id = 'custom-background-fix';
          style.textContent = `
            .tab-content, .tab-pane { background-color: #ffffff !important; }
            .nav-tabs .nav-link.active { background-color: #ffffff !important; }
            .form-outline, .form-control, .select2-container, .select2-selection { background-color: #ffffff !important; }
            .table, .table tbody tr { background-color: #ffffff !important; }
            input, textarea, select { background-color: #ffffff !important; color: #212529 !important; }
            [class*="product"], [id*="product"], [class*="item"], [id*="item"] { background-color: #ffffff !important; }
          `;
          
          // Remover estilo anterior si existe
          const existingStyle = document.getElementById('custom-background-fix');
          if (existingStyle) {
            existingStyle.remove();
          }
          
          document.head.appendChild(style);
        };
        
        // Aplicar estilos inicialmente
        applyStylesToNewElements();
        
        // Observer para detectar cambios en el DOM
        const observer = new MutationObserver(() => {
          applyStylesToNewElements();
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        // Listener para cambios de pestañas
        const tabButtons = document.querySelectorAll('[data-bs-toggle="tab"]');
        tabButtons.forEach(button => {
          button.addEventListener('shown.bs.tab', () => {
            setTimeout(applyStylesToNewElements, 100);
          });
        });
      });
      
      console.log('✅ Estilos personalizados inyectados para mejorar fondos');
    };

    // LOGIN
    await page.goto(process.env.LEGALFLOW_URL, { waitUntil: 'domcontentloaded' });
    
    // Inyectar estilos después de cargar la página
    await injectCustomStyles(page);
    
    await page.fill('#email', process.env.LEGALFLOW_USER);
    await page.fill('#password', process.env.LEGALFLOW_PASS);
    await page.click('.btn-login');
    await page.waitForSelector('#side-menu', { timeout: 10000 });
    console.log('✅ Login exitoso');
    
    // Re-inyectar estilos después del login por si hay cambios en el DOM
    await injectCustomStyles(page);

    // NAVEGAR A CASOS
    await page.click('a[href*="/casos"]');
    await page.waitForSelector('a[href*="/casos/create"]', { timeout: 15000 });
    console.log('✅ Sección Casos abierta');

    // ABRIR NUEVO CASO
    await page.locator('a[href*="/casos/create"]').click();
    await page.waitForSelector('#referencia_caso', { timeout: 20000 });
    console.log('✅ Formulario de Nuevo Caso abierto');
    
    // Inyectar estilos nuevamente después de abrir el formulario
    await injectCustomStyles(page);

    // LEER DATOS DEL JSON
    const requestData = JSON.parse(fs.readFileSync('../config/pjud_config.json', 'utf-8'));

    // CAMPOS BÁSICOS
    await page.fill('#referencia_caso', requestData.cliente || '');
    await page.fill('#descripcion_caso', `Caso relacionado con folio ${requestData.folio || ''}`);
    await page.fill('#asunto_caso', requestData.caratulado || '');
    await page.fill('#referencia_demandante', requestData.cliente || '');

    // FECHAS
    const today = new Date().toISOString().split('T')[0];
    for (const sel of ['#fechai', '#fechait']) {
      await page.evaluate(({ sel, val }) => {
        const el = document.querySelector(sel);
        if (!el) return;
        el.removeAttribute('readonly');
        el.removeAttribute('disabled');
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, { sel, val: today });
    }

    console.log('⚠️ Saltando selección de abogados (manual)');

    // OTROS CAMPOS
    if (requestData.TipoCobro?.CobroFijo) await page.check('#cobrofijo').catch(() => {});
    if (requestData.TipoCobro?.CobroPorcentaje) await page.check('#cobroporciento').catch(() => {});
    await page.fill('#bill_input', requestData.folio || '').catch(() => {});

    // CUANTÍA
    const cuantiaValue = (requestData.Cuantia ?? 0).toString();
    await page.waitForSelector('#cuantia', { timeout: 10000 });
    await page.fill('#cuantia', cuantiaValue);
    await page.focus('#cuantia');
    await page.evaluate(() => {
      const el = document.querySelector('#cuantia');
      if (!el) return;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('blur', { bubbles: true }));
    });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    console.log(`[INFO] ✅ Cuantía rellenada con valor: ${cuantiaValue}`);

    // OBSERVACIONES
    const observacionesText = requestData.Observaciones || '';
    await page.waitForSelector('#observaciones', { state: 'attached', timeout: 8000 });
    await page.fill('#observaciones', observacionesText);
    await page.focus('#observaciones');
    await page.evaluate(() => {
      const el = document.querySelector('#observaciones');
      if (!el) return;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('blur', { bubbles: true }));
    });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);

    // Verificación final
    const finalObs = await page.$eval('#observaciones', el => el.value);
    if ((finalObs || '').trim() !== observacionesText.trim()) {
      console.warn('⚠️ Observaciones incompletas, reintentando con type()');
      await page.click('#observaciones');
      await page.fill('#observaciones', '');
      await page.type('#observaciones', observacionesText, { delay: 10 });
    }
    console.log('✅ Observaciones rellenado correctamente');

    await page.waitForTimeout(1500);

    // --- SELECTS DEPENDIENTES ROBUSTOS ---
    // 1️⃣ Competencia
    await page.selectOption('#competencia', '3'); // Civil
    console.log('✅ Competencia seleccionada: Civil');

    // 2️⃣ Esperar que corte se actualice
    await page.waitForFunction(() => {
      const select = document.querySelector('#corte');
      return select && Array.from(select.options).some(o => o.text.includes('Santiago'));
    }, { timeout: 5000 });

    // Seleccionar Corte Santiago
    await page.evaluate(() => {
      const select = document.querySelector('#corte');
      const option = Array.from(select.options).find(o => o.text.includes('Santiago'));
      if (option) {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        select.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    console.log('✅ Corte seleccionada: Santiago');

    // TRIBUNAL
    // Seleccionar tribunal específico: 18° Juzgado Civil de Santiago
    await page.evaluate(() => {
    const select = document.querySelector('#tribunal_id');
    if (!select) return;

    // Buscar opción que incluya exactamente "18° Juzgado Civil de Santiago"
    const option = Array.from(select.options).find(o => o.text.includes('18° Juzgado Civil de Santiago'));
    
    if (option) {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        select.dispatchEvent(new Event('input', { bubbles: true }));
    }
    });

    console.log('✅ Tribunal seleccionado: 18° Juzgado Civil de Santiago');

    // RIT
    if (requestData.rit) {
      const [rol, anio] = requestData.rit.split('-');
      await page.fill('#rol_pjud', rol || '').catch(() => {});
      await page.fill('#anio_pjud', anio || '').catch(() => {});
    }

    // ETAPAS Y ESTADOS
    // await Promise.all([
    //   page.selectOption('#etapa_procesal', { label: 'Etapa inicial' }).catch(() => {}),
    //   page.selectOption('#estado_caso', { label: 'En trámite' }).catch(() => {}),
    //   page.selectOption('#estado_casoi', { label: 'Tramitación' }).catch(() => {}),
    //   page.selectOption('#tipo_caso', { label: 'Civil' }).catch(() => {}),
    // ]);

    // GUARDAR
    await page.click('#btnguardar');
    await page.waitForURL('**/edit/**', { timeout: 20000 });
    console.log('✅ Formulario guardado y redirigido a la página de edición');
    
    // Inyectar estilos en la página de edición también
    await injectCustomStyles(page);

    const caseUrl = page.url();
    console.log('\n🧭 URL del nuevo caso creado:\n👉', caseUrl, '\n');

    console.log('🔓 Navegador permanecerá abierto para inspección manual.');
    await page.waitForTimeout(99999999);
    await browser.close();

  } catch (err) {
    console.error('💥 Error principal:', err);

    const now = Date.now();
    const ssPath = path.join(logDir, `error_${now}.png`);
    const htmlPath = path.join(logDir, `error_${now}.html`);

    try {
      await page.screenshot({ path: ssPath, fullPage: true });
      fs.writeFileSync(htmlPath, await page.content());
      console.error(`📸 Screenshot: ${ssPath}`);
      console.error(`📝 HTML: ${htmlPath}`);
    } catch (sErr) {
      console.error('⚠️ Error al guardar logs:', sErr);
    }

    await browser.close();
    process.exit(1);
  }
})();
