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

    // LOGIN
    await page.goto(process.env.LEGALFLOW_URL, { waitUntil: 'domcontentloaded' });
    await page.fill('#email', process.env.LEGALFLOW_USER);
    await page.fill('#password', process.env.LEGALFLOW_PASS);
    await page.click('.btn-login');
    await page.waitForSelector('#side-menu', { timeout: 10000 });
    console.log('✅ Login exitoso');

    // NAVEGAR A CASOS
    await page.click('a[href*="/casos"]');
    await page.waitForSelector('a[href*="/casos/create"]', { timeout: 15000 });
    console.log('✅ Sección Casos abierta');

    // ABRIR NUEVO CASO
    await page.locator('a[href*="/casos/create"]').click();
    await page.waitForSelector('#referencia_caso', { timeout: 20000 });
    console.log('✅ Formulario de Nuevo Caso abierto');

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
