/**
 * Diagnóstico profundo del modal PJUD
 * Inspecciona el JavaScript real del sitio para entender por qué AJAX no se dispara
 */

const { firefox } = require('playwright');

async function diagnoseModal() {
  console.log('🔬 DIAGNÓSTICO PROFUNDO DEL MODAL PJUD\n');

  const browser = await firefox.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0'
  });

  const page = await context.newPage();

  try {
    // 1. Navegar
    console.log('📍 Navegando a PJUD...');
    await page.goto('https://oficinajudicialvirtual.pjud.cl/indexN.php#702', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForTimeout(3000);

    // Cerrar modal inicial si aparece
    try {
      const closeButton = await page.locator('#close-modal, button:has-text("Cerrar"), .close').first();
      if (await closeButton.isVisible({ timeout: 3000 })) {
        console.log('   Cerrando modal inicial...');
        await closeButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      console.log('   (No modal inicial o ya cerrado)');
    }

    // Navegar a la sección de consulta
    try {
      await page.click('text=Consulta causas', { timeout: 10000 });
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('   (Ya en sección de consulta)');
    }

    // 2. Llenar formulario
    console.log('📝 Llenando formulario (C-213-2023, Santiago Civil)...');
    await page.selectOption('#competencia', '3');
    await page.waitForTimeout(500);
    await page.selectOption('#conCorte', '90');
    await page.waitForTimeout(500);
    await page.selectOption('#conTipoCausa', 'C');
    await page.waitForTimeout(500);
    await page.fill('#conRolCausa', '213');
    await page.fill('#conEraCausa', '2023');

    console.log('🔍 Buscando...');
    await page.click('button:has-text("Buscar")');
    await page.waitForTimeout(5000);

    // 3. CAPTURAR TODO EL JAVASCRIPT RELEVANTE
    console.log('\n📜 EXTRAYENDO CÓDIGO JAVASCRIPT DEL SITIO...\n');

    const jsAnalysis = await page.evaluate(() => {
      const results = {
        functions: {},
        globals: {},
        bootstrap: {},
        jquery: {}
      };

      // Buscar función detalleCausaCivil
      if (typeof window.detalleCausaCivil === 'function') {
        results.functions.detalleCausaCivil = window.detalleCausaCivil.toString();
      } else {
        results.functions.detalleCausaCivil = 'NOT FOUND';
      }

      // Buscar función detalleCausaLaboral
      if (typeof window.detalleCausaLaboral === 'function') {
        results.functions.detalleCausaLaboral = window.detalleCausaLaboral.toString();
      }

      // Buscar función verDocumento (para PDFs)
      if (typeof window.verDocumento === 'function') {
        results.functions.verDocumento = window.verDocumento.toString();
      }

      // Verificar jQuery y Bootstrap
      results.jquery.exists = typeof window.$ !== 'undefined';
      results.jquery.version = window.jQuery ? window.jQuery.fn.jquery : 'N/A';
      results.bootstrap.exists = typeof window.bootstrap !== 'undefined' || (window.$ && typeof window.$.fn.modal !== 'undefined');

      // Capturar event listeners del modal
      const modal = document.querySelector('#modalDetalleCivil');
      if (modal) {
        results.bootstrap.modalExists = true;
        results.bootstrap.modalClasses = modal.className;
        results.bootstrap.modalDataAttributes = Array.from(modal.attributes)
          .filter(attr => attr.name.startsWith('data-'))
          .map(attr => ({ name: attr.name, value: attr.value }));
      }

      // Buscar enlaces con onclick
      const firstRow = document.querySelector('table tbody tr');
      if (firstRow) {
        const link = firstRow.querySelector('a[onclick*="detalleCausaCivil"]');
        if (link) {
          results.globals.firstLinkOnclick = link.getAttribute('onclick');
          results.globals.firstLinkHref = link.getAttribute('href');

          // Extraer el token del onclick
          const onclickStr = link.getAttribute('onclick');
          const tokenMatch = onclickStr.match(/detalleCausaCivil\(['"]([^'"]+)['"]\)/);
          if (tokenMatch) {
            results.globals.extractedToken = tokenMatch[1];
          }
        }
      }

      // Capturar TODOS los scripts en la página
      results.scripts = Array.from(document.querySelectorAll('script'))
        .map(script => ({
          src: script.src || 'inline',
          hasContent: script.innerHTML.length > 0,
          contentPreview: script.innerHTML.substring(0, 500)
        }));

      return results;
    });

    console.log('✅ Análisis de JavaScript:\n');
    console.log(JSON.stringify(jsAnalysis, null, 2));

    // 4. INTERCEPTAR TODAS LAS PETICIONES DE RED
    console.log('\n\n📡 CONFIGURANDO INTERCEPCIÓN DE RED...\n');

    const networkRequests = [];
    page.on('request', request => {
      networkRequests.push({
        type: 'request',
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      });
    });

    page.on('response', response => {
      networkRequests.push({
        type: 'response',
        url: response.url(),
        status: response.status(),
        headers: response.headers()
      });
    });

    // 5. CLICK EN LA LUPA Y OBSERVAR
    console.log('🖱️  HACIENDO CLICK EN LA LUPA...\n');

    await page.click('table tbody tr:first-child a[onclick*="detalleCausaCivil"]');

    console.log('⏳ Esperando 10 segundos para observar actividad de red...\n');
    await page.waitForTimeout(10000);

    // 6. ANALIZAR PETICIONES DE RED
    console.log('📊 PETICIONES DE RED CAPTURADAS:\n');

    const relevantRequests = networkRequests.filter(req =>
      req.url.includes('detalle') ||
      req.url.includes('movimiento') ||
      req.url.includes('causa') ||
      req.url.includes('ajax') ||
      req.url.includes('php')
    );

    if (relevantRequests.length === 0) {
      console.log('❌ NO SE DETECTARON PETICIONES AJAX RELEVANTES');
      console.log('   Esto confirma que el click no dispara el backend\n');
    } else {
      console.log('✅ Peticiones relevantes encontradas:');
      console.log(JSON.stringify(relevantRequests, null, 2));
    }

    // 7. INSPECCIONAR ESTADO DEL MODAL
    console.log('\n\n🔍 INSPECCIONANDO ESTADO DEL MODAL...\n');

    const modalState = await page.evaluate(() => {
      const modal = document.querySelector('#modalDetalleCivil');
      if (!modal) return { error: 'Modal no encontrado' };

      return {
        isVisible: modal.offsetParent !== null,
        display: window.getComputedStyle(modal).display,
        classes: modal.className,
        innerHTML: modal.innerHTML.substring(0, 1000),
        tablesCount: modal.querySelectorAll('table').length,
        firstTable: modal.querySelector('table') ? {
          rowCount: modal.querySelector('table tbody').querySelectorAll('tr').length,
          innerHTML: modal.querySelector('table').innerHTML.substring(0, 500)
        } : null
      };
    });

    console.log('Estado del modal:');
    console.log(JSON.stringify(modalState, null, 2));

    // 8. INTENTAR MÉTODOS ALTERNATIVOS
    console.log('\n\n🔧 INTENTANDO MÉTODOS ALTERNATIVOS...\n');

    // Método 1: Ejecutar detalleCausaCivil directamente con el token extraído
    if (jsAnalysis.globals.extractedToken) {
      console.log(`   Método 1: Ejecutar detalleCausaCivil("${jsAnalysis.globals.extractedToken}")...`);

      const networkBefore = networkRequests.length;

      await page.evaluate((token) => {
        if (typeof window.detalleCausaCivil === 'function') {
          window.detalleCausaCivil(token);
          return true;
        }
        return false;
      }, jsAnalysis.globals.extractedToken);

      await page.waitForTimeout(5000);

      const networkAfter = networkRequests.length;
      console.log(`   → ${networkAfter - networkBefore} nuevas peticiones de red`);
    }

    // Método 2: Disparar evento Bootstrap modal manualmente
    console.log('\n   Método 2: Disparar evento Bootstrap modal...');

    await page.evaluate(() => {
      const modal = document.querySelector('#modalDetalleCivil');
      if (window.$ && typeof window.$.fn.modal !== 'undefined') {
        $(modal).modal('show');
        return true;
      }
      return false;
    });

    await page.waitForTimeout(3000);

    // Screenshot final
    await page.screenshot({ path: './diagnose_modal_final.png', fullPage: true });
    console.log('\n📸 Screenshot guardado: diagnose_modal_final.png');

    // 9. GUARDAR REPORTE COMPLETO
    const report = {
      timestamp: new Date().toISOString(),
      jsAnalysis,
      networkRequests: relevantRequests,
      modalState,
      totalNetworkActivity: networkRequests.length,
      conclusion: relevantRequests.length === 0
        ? 'El click NO dispara peticiones AJAX. Posible causa: evento preventdefault, token inválido, o función bloqueada por anti-bot.'
        : 'Se detectaron peticiones AJAX. Problema puede ser en el procesamiento de respuesta.'
    };

    require('fs').writeFileSync('./diagnose_modal_report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Reporte completo guardado: diagnose_modal_report.json');

    console.log('\n⏸️  Pausa para inspección manual (60 segundos)...');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('❌ Error durante diagnóstico:', error.message);
    await page.screenshot({ path: './diagnose_error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n✅ Diagnóstico completado');
  }
}

diagnoseModal().catch(console.error);
