// pjud_search.js
const { chromium } = require('playwright');
const fs = require('fs');

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
    // Paso 1: Ingreso
    console.log("🌐 Ingresando al PJUD...");
    await page.goto('https://oficinajudicialvirtual.pjud.cl/home/index.php', { waitUntil: 'domcontentloaded' });

    // Paso 2: Consulta causas
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

    // Paso 3: Abrir detalle
    await page.waitForSelector('a[title="Detalle de la causa"]');
    console.log("🖱️ Abriendo detalle...");
    await page.click('a[title="Detalle de la causa"]');

    await page.waitForSelector('#modalDetalleCivil', { state: 'visible' });
    console.log("✅ Detalle cargado correctamente.");

    // Paso 4: Descargar eBook
    console.log("📘 Buscando el enlace de descarga de Ebook...");
    await page.waitForSelector('form[action*="newebookcivil.php"]', { timeout: 5000 });

    // Interceptar la nueva pestaña (target="_blank")
    const [newPage] = await Promise.all([
      context.waitForEvent('page'), // Espera a que se abra la nueva pestaña
      page.click('form[action*="newebookcivil.php"] a[title="Descargar Ebook"]')
    ]);

    // Esperar que cargue completamente
    await newPage.waitForLoadState('networkidle');

    // Obtener la URL real del PDF
    const pdfUrl = newPage.url();
    console.log(`📄 URL del eBook detectada: ${pdfUrl}`);

    // Descargar el PDF usando el mismo contexto
    const response = await newPage.request.get(pdfUrl);
    const buffer = await response.body();

    // Guardar el archivo localmente
    const savePath = `./ebook_${CONFIG.rit.replace('-', '_')}_${Date.now()}.pdf`;
    fs.writeFileSync(savePath, buffer);

    console.log(`✅ Ebook descargado correctamente en: ${savePath}`);

    // Cerrar la pestaña del PDF
    await newPage.close();

  } catch (err) {
    console.error("❌ Error durante la ejecución:", err);
  } finally {
    console.log("🧭 Cierra el navegador manualmente cuando termines.");
    await browser.close();
  }
})();