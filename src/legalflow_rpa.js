require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // LOGIN
    await page.goto(process.env.LEGALFLOW_URL);
    await page.fill('#email', process.env.LEGALFLOW_USER);
    await page.fill('#password', process.env.LEGALFLOW_PASS);
    await page.click('.btn-login');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#side-menu', { timeout: 10000 });
    console.log('✅ Login exitoso');

    // NAVEGAR A CASOS
    await page.click('a[href*="/casos"]');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('a[href*="/casos/create"]', { timeout: 15000 });
    console.log('✅ Sección Casos abierta');

    // ABRIR NUEVO CASO
    await page.locator('a[href*="/casos/create"]').click();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#referencia_caso', { timeout: 30000 });
    console.log('✅ Formulario de Nuevo Caso abierto');

    // LEER DATOS DEL JSON
    const requestData = JSON.parse(fs.readFileSync('./pjud_config.json', 'utf-8'));

    // LLENAR FORMULARIO (campos simples)
    await page.fill('#referencia_caso', requestData.cliente || '');
    await page.fill('#descripcion_caso', `Caso relacionado con folio ${requestData.folio || ''}`);
    await page.fill('#asunto_caso', requestData.caratulado || '');
    await page.fill('#referencia_demandante', requestData.cliente || '');

    // Fechas (usar fill si es input tipo date)
    const today = new Date().toISOString().split('T')[0];
    try {
      await page.fill('#fechai', today);
      await page.fill('#fechait', today);
    } catch (e) {
      // Fallback a evaluate si el input necesita eventos
      await page.evaluate(({ sel, val }) => {
        const el = document.querySelector(sel);
        if (el) {
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, { sel: '#fechai', val: today });
      await page.evaluate(({ sel, val }) => {
        const el = document.querySelector(sel);
        if (el) {
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, { sel: '#fechait', val: today });
    }

    console.log('⚠️ Saltando Abogado Principal y Abogados Colaboradores');

    // Otros campos
    if (requestData.TipoCobro?.CobroFijo) await page.check('#cobrofijo').catch(() => {});
    if (requestData.TipoCobro?.CobroPorcentaje) await page.check('#cobroporciento').catch(() => {});
    await page.fill('#bill_input', requestData.folio || '').catch(() => {});
    await page.fill('#cuantia', requestData.Cuantia?.toString() || '').catch(() => {});

    // ----- Observaciones (textarea) -----
    const observacionesText = requestData.Observaciones || '';

    async function safeFillTextarea(selector, text, attempts = 3) {
      for (let i = 0; i < attempts; i++) {
        try {
          console.log(`🔁 Intento ${i+1} de rellenar ${selector}`);
          // esperar visible
          await page.waitForSelector(selector, { state: 'visible', timeout: 8000 });

          // asegurar que esté en viewport
          await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (el) {
              el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' });
            }
          }, selector);

          // Quitar readonly/disabled si existiera (con precaución)
          await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (!el) return;
            if (el.hasAttribute('readonly')) el.removeAttribute('readonly');
            if (el.hasAttribute('disabled')) el.removeAttribute('disabled');
          }, selector);

          // click para asegurar foco
          await page.click(selector, { timeout: 3000 });

          // intentar fill (rápido)
          await page.fill(selector, text, { timeout: 5000 });
          // confirmar eventos
          await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (el) {
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }, selector);

          // chequeo simple: leer valor desde página
          const current = await page.$eval(selector, el => el.value);
          if ((current || '').trim() === (text || '').trim()) {
            console.log('✅ Observaciones rellenado con fill correctamente');
            return;
          } else {
            // si fill no dejó el texto completo, intentar type
            await page.click(selector);
            await page.fill(selector, ''); // limpiar
            await page.type(selector, text, { delay: 20 });
            const afterType = await page.$eval(selector, el => el.value);
            if ((afterType || '').trim() === (text || '').trim()) {
              console.log('✅ Observaciones rellenado con type correctamente');
              return;
            }
          }
        } catch (err) {
          console.warn('⚠️ Intento fallido:', err.message?.slice(0,200));
          // esperar un poco antes de reintentar
          await page.waitForTimeout(800);
        }
      }

      // Si después de los intentos no funcionó: guardar screenshot para diagnóstico y lanzar error
      const screenshotPath = path.join(process.cwd(), `error_observaciones_${Date.now()}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      throw new Error(`No se pudo rellenar ${selector}. Screenshot guardado en ${screenshotPath}`);
    }

    // Ejecutar safeFillTextarea
    await safeFillTextarea('#observaciones', observacionesText);

    // ----- Fin Observaciones -----

    // Datos PJUD
    await page.selectOption('#competencia', { value: requestData.competencia }).catch(() => {});
    await page.waitForTimeout(500);
    await page.selectOption('#corte', { value: requestData.corte }).catch(() => {});
    await page.waitForTimeout(500);
    await page.selectOption('#tribunal_id', { value: requestData.tribunal }).catch(() => {});

    if (requestData.rit) {
      const [rol, anio] = requestData.rit.split('-');
      await page.fill('#rol_pjud', rol || '').catch(() => {});
      await page.fill('#anio_pjud', anio || '').catch(() => {});
    }

    await page.selectOption('#etapa_procesal', { label: 'Etapa inicial' }).catch(() => {});
    await page.selectOption('#estado_caso', { label: 'En trámite' }).catch(() => {});
    await page.selectOption('#estado_casoi', { label: 'Tramitación' }).catch(() => {});
    await page.selectOption('#tipo_caso', { label: 'Civil' }).catch(() => {});

    // GUARDAR
    await page.click('#btnguardar');
    await page.waitForURL('**/edit/**', { timeout: 30000 });
    console.log('✅ Formulario guardado y redirigido a la página de edición');

    const caseUrl = page.url();
    console.log('\n🧭 URL del nuevo caso creado:\n👉', caseUrl, '\n');

    console.log('🔓 Navegador permanecerá abierto para inspección manual.');
    await page.waitForTimeout(99999999);
    await browser.close();
  } catch (err) {
    console.error('💥 Error principal:', err);
    // por seguridad: guardar screenshot y html para diagnosticar
    const now = Date.now();
    const ss = `error_${now}.png`;
    const html = `error_${now}.html`;
    try { await page.screenshot({ path: ss, fullPage: true }); } catch(e) {}
    try { fs.writeFileSync(html, await page.content()); } catch(e) {}
    console.error(`Screenshot: ${ss}  HTML: ${html}`);
    await browser.close();
    process.exit(1);
  }
})();
