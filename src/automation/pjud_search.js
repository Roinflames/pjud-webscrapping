// pjud_search_from_json.js
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  // === LEER JSON ===
  const jsonPath = '../config/pjud_config.json';
  if (!fs.existsSync(jsonPath)) {
    console.error(`[ERROR] ❌ No se encontró el archivo ${jsonPath}`);
    process.exit(1);
  }
  const CONFIG = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Paso 1: Ingreso
    console.log("🌐 Ingresando al PJUD...");
    await page.goto(process.env.OJV_URL, { waitUntil: 'domcontentloaded' });

    // Paso 2: Consulta causas
    console.log("🖱️ Entrando a 'Consulta causas'...");
    await page.click('text=Consulta causas');
    await page.waitForSelector('#competencia');

    console.log("📝 Llenando formulario con datos del JSON...");
    await page.selectOption('#competencia', CONFIG.competencia);
    await page.selectOption('#conCorte', CONFIG.corte);
    await page.selectOption('#conTribunal', CONFIG.tribunal);
    await page.selectOption('#conTipoCausa', CONFIG.tipoCausa);

    const [rol, año] = CONFIG.rit.split('-');
    await page.fill('#conRolCausa', rol);
    await page.fill('#conEraCausa', año);

    console.log("🔍 Buscando...");
    await page.click('input[value="Buscar"], button:has-text("Buscar")');

    // Paso 3: Abrir detalle
    await page.waitForSelector('a[title="Detalle de la causa"]');
    console.log("🖱️ Abriendo detalle...");
    await page.click('a[title="Detalle de la causa"]');

    await page.waitForSelector('#modalDetalleCivil', { state: 'visible' });
    console.log("✅ Detalle cargado correctamente.");

    // Paso 4: Descargar eBook
    console.log("📘 Buscando el enlace de descarga de Ebook...");
    await page.waitForSelector('form[action*="newebookcivil.php"]', { timeout: 5000 });

    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.click('form[action*="newebookcivil.php"] a[title="Descargar Ebook"]')
    ]);

    await newPage.waitForLoadState('networkidle');

    const pdfUrl = newPage.url();
    console.log(`📄 URL del eBook detectada: ${pdfUrl}`);

    const response = await newPage.request.get(pdfUrl);
    const buffer = await response.body();

    const savePath = `../assets/ebook/ebook_${CONFIG.rit.replace('-', '_')}_${Date.now()}.pdf`;
    fs.writeFileSync(savePath, buffer);

    console.log(`✅ Ebook descargado correctamente en: ${savePath}`);

    await newPage.close();

  } catch (err) {
    console.error("❌ Error durante la ejecución:", err);
  } finally {
    console.log("🧭 Cierra el navegador manualmente cuando termines.");
    await browser.close();
  }
})();
