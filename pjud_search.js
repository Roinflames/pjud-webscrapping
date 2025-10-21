// pjud_search.js
const { chromium } = require('playwright');

(async () => {
  const CONFIG = {
    rit: "7606-2022",
    competencia: "3", // Civil
    corte: "90",
    tribunal: "276",
    tipoCausa: "C"
  };

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Paso 1
    console.log("🌐 Ingresando al PJUD...");
    await page.goto('https://oficinajudicialvirtual.pjud.cl/home/index.php', { waitUntil: 'domcontentloaded' });
    // Paso 2
    console.log("🖱️ Entrando a 'Consulta causas'...");
    await page.click('text=Consulta causas');
    await page.waitForSelector('#competencia');

    console.log("📝 Llenando formulario...");
    await page.selectOption('#competencia', CONFIG.competencia);
    await page.selectOption('#conCorte', CONFIG.corte);
    await page.selectOption('#conTribunal', CONFIG.tribunal);
    await page.selectOption('#conTipoCausa', CONFIG.tipoCausa);

    const [rol, año] = CONFIG.rit.split('-');
    await page.fill('#conRolCausa', rol);
    await page.fill('#conEraCausa', año);

    console.log("🔍 Buscando...");
    await page.click('input[value="Buscar"], button:has-text("Buscar")');
    // Paso 3
    await page.waitForSelector('a[title="Detalle de la causa"]');
    console.log("🖱️ Abriendo detalle...");
    await page.click('a[title="Detalle de la causa"]');

    await page.waitForSelector('#modalDetalleCivil', { state: 'visible' });
    console.log("✅ Detalle cargado correctamente.");

    console.log("📘 Buscando el enlace de descarga de Ebook...");

    // Paso 4
    // Esperar a que aparezca el formulario
    await page.waitForSelector('form[action*="newebookcivil.php"]', { timeout: 5000 });

    // Detectar y manejar el evento de descarga
    const [download] = await Promise.all([
      page.waitForEvent('download'), // Espera el inicio de la descarga
      page.click('form[action*="newebookcivil.php"] a[title="Descargar Ebook"]') // Simula el clic
    ]);

    // Guardar el archivo localmente
    const downloadPath = await download.path();
    const savePath = `./ebook_${Date.now()}.pdf`;
    await download.saveAs(savePath);

    console.log(`✅ Ebook descargado en: ${savePath}`);

    // Siguientes pasos

  } catch (err) {
    console.error("❌ Error durante la ejecución:", err);
  } finally {
    console.log("🧭 Cierra el navegador manualmente cuando termines.");
    await browser.close();
  }
})();
