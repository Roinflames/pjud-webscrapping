// src/automation/pjud_search_from_json.js
require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const logDir = path.resolve(__dirname, '../../logs');
  const ebookDir = path.resolve(__dirname, '../assets/ebook');
  const jsonPath = path.resolve(__dirname, '../config/pjud_config.json');

  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  if (!fs.existsSync(ebookDir)) fs.mkdirSync(ebookDir, { recursive: true });

  if (!fs.existsSync(jsonPath)) {
    console.error(`[ERROR] ❌ No se encontró el archivo de configuración: ${jsonPath}`);
    process.exit(1);
  }

  const CONFIG = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const now = Date.now();
  const screenshotPath = path.join(logDir, `pjud_error_${now}.png`);
  const htmlPath = path.join(logDir, `pjud_error_${now}.html`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🌐 Ingresando al PJUD...');
    await page.goto(process.env.OJV_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('✅ Página cargada:', page.url());

    // Paso 1: Entrar a "Consulta causas"
    console.log("🖱️ Entrando a 'Consulta causas'...");
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}),
      page.click('text=Consulta causas').catch(() => console.warn('⚠️ No se pudo hacer clic en "Consulta causas"')),
    ]);

    // Verificar que el formulario esté visible
    const competencia = await page.waitForSelector('#competencia', { timeout: 15000 }).catch(() => null);
    if (!competencia) {
      console.error('❌ No se encontró el selector #competencia. Guardando captura...');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      fs.writeFileSync(htmlPath, await page.content());
      console.error(`📸 Screenshot: ${screenshotPath}\n🧾 HTML: ${htmlPath}`);
      process.exit(1);
    }

    console.log('📝 Llenando formulario con datos del JSON...');

    await page.selectOption('#competencia', CONFIG.competencia).catch(() => console.warn('⚠️ Competencia no encontrada'));
    await page.selectOption('#conCorte', CONFIG.corte).catch(() => console.warn('⚠️ Corte no encontrada'));
    await page.selectOption('#conTribunal', CONFIG.tribunal).catch(() => console.warn('⚠️ Tribunal no encontrado'));
    await page.selectOption('#conTipoCausa', CONFIG.tipoCausa).catch(() => console.warn('⚠️ Tipo de causa no encontrado'));

    const [rol, año] = CONFIG.rit.split('-');
    await page.fill('#conRolCausa', rol || '').catch(() => {});
    await page.fill('#conEraCausa', año || '').catch(() => {});

    console.log("🔍 Buscando...");
    await page.click('input[value="Buscar"], button:has-text("Buscar")').catch(() => {});

    // Paso 3: Abrir detalle
    await page.waitForSelector('a[title="Detalle de la causa"]', { timeout: 20000 });
    console.log("🖱️ Abriendo detalle...");
    await Promise.all([
      page.waitForSelector('#modalDetalleCivil, #modalDetalleLaboral', { timeout: 15000 }),
      page.click('a[title="Detalle de la causa"]').catch(() => {}),
    ]);
    console.log("✅ Detalle cargado correctamente.");

    // Paso 4: Descargar eBook
    console.log("📘 Buscando enlace de descarga de eBook...");
    await page.waitForSelector('form[action*="newebookcivil.php"] a[title*="Ebook"]', { timeout: 8000 });

    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.click('form[action*="newebookcivil.php"] a[title*="Ebook"]').catch(() => {}),
    ]);

    await newPage.waitForLoadState('networkidle');
    const pdfUrl = newPage.url();
    console.log(`📄 URL del eBook detectada: ${pdfUrl}`);

    const response = await newPage.request.get(pdfUrl);
    const buffer = await response.body();

    const fileName = `ebook_${CONFIG.rit.replace('-', '_')}_${now}.pdf`;
    const savePath = path.join(ebookDir, fileName);
    fs.writeFileSync(savePath, buffer);

    console.log(`✅ Ebook descargado correctamente en: ${savePath}`);

    await newPage.close();

  } catch (err) {
    console.error('💥 Error durante la ejecución:', err);
    try {
      await page.screenshot({ path: screenshotPath, fullPage: true });
      fs.writeFileSync(htmlPath, await page.content());
      console.error(`📸 Captura: ${screenshotPath}\n🧾 HTML: ${htmlPath}`);
    } catch (e) {
      console.error('⚠️ No se pudo generar evidencia visual del error:', e);
    }
  } finally {
    console.log('🧭 Cierra el navegador manualmente cuando termines.');
    await browser.close();
  }
})();
