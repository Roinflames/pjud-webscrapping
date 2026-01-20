  console.log('🚨 INDEX.JS EJECUTÁNDOSE');
  require('dotenv').config();
  const fs = require('fs');
  const path = require('path');

  const { startBrowser } = require('./browser');
  const { loadConfig } = require('./config');
  const { downloadEbook } = require('./ebook');
  const { fillForm, openDetalle } = require('./form');
  const { closeModalIfExists } = require('./navigation');
  // const { extractTable } = require('./table');
  const { extractTableAsArray } = require('./table');

  const { saveErrorEvidence } = require('./utils');

  (async () => {
    const logDir = path.resolve(__dirname, 'logs');
    const ebookDir = path.resolve(__dirname, 'assets/ebook');
    const jsonPath = path.resolve(__dirname, 'config/pjud_config.json');

    [logDir, ebookDir].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    if (!fs.existsSync(jsonPath)) {
      console.error(`[ERROR] ❌ No se encontró configuración: ${jsonPath}`);
      process.exit(1);
    }

    const CONFIG = loadConfig();

    // Verificar que existe OJV_URL
    if (!process.env.OJV_URL) {
      console.error('❌ ERROR: No se encontró OJV_URL en .env');
      console.log('💡 Ejecuta: node setup-env.js');
      console.log('   O crea manualmente un archivo .env con:');
      console.log('   OJV_URL=https://oficinajudicialvirtual.pjud.cl/indexN.php');
      process.exit(1);
    }

    const screenshotPath = path.join(logDir, `pjud_error_${Date.now()}.png`);
    const htmlPath = path.join(logDir, `pjud_error_${Date.now()}.html`);

    console.log('🌐 URL configurada:', process.env.OJV_URL);
    const { browser, context, page } = await startBrowser(process.env.OJV_URL);

    try {
      console.log('🌐 Página cargada:', page.url());
      console.log('📄 Título:', await page.title());

      // Verificar que la página no esté en blanco
      const bodyContent = await page.evaluate(() => document.body.innerText);
      if (!bodyContent || bodyContent.trim().length === 0) {
        throw new Error('La página está en blanco. Verifica la URL y la conexión.');
      }
      console.log('✅ Página tiene contenido');

      await closeModalIfExists(page);
      
      // Verificar URL actual - puede haber redirección a home/index.php
      const currentUrl = page.url();
      console.log('📍 URL actual después de cargar:', currentUrl);
      
      // Si estamos en home/index.php, necesitamos establecer sesión de invitado
      if (currentUrl.includes('home/index.php')) {
        console.log('🔐 Estableciendo sesión de invitado para "Consulta causas"...');
        
        // Ejecutar la función JavaScript que establece la sesión
        await page.evaluate(async () => {
          const accesoConsultaCausas = 'CC';
          const response = await fetch('../includes/sesion-invitado.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `nombreAcceso=${accesoConsultaCausas}`
          });
          
          // Establecer localStorage y sessionStorage
          localStorage.setItem('InitSitioOld', '0');
          localStorage.setItem('InitSitioNew', '1');
          localStorage.setItem('logged-in', 'true');
          sessionStorage.setItem('logged-in', 'true');
          
          return response.ok;
        });
        
        await page.waitForTimeout(500);
        
        // Navegar a indexN.php después de establecer la sesión
        console.log('🔄 Navegando a indexN.php...');
        await page.goto('https://oficinajudicialvirtual.pjud.cl/indexN.php', {
          waitUntil: 'domcontentloaded',
          timeout: 60000
        });
        await page.waitForTimeout(1000);
        console.log('📍 URL después de establecer sesión:', page.url());
      } else if (!currentUrl.includes('indexN.php')) {
        // Si estamos en otra URL, navegar directamente
        console.log('🔄 Navegando directamente a indexN.php...');
        await page.goto('https://oficinajudicialvirtual.pjud.cl/indexN.php', {
          waitUntil: 'domcontentloaded',
          timeout: 60000
        });
        await page.waitForTimeout(1000);
        console.log('📍 URL después de navegación:', page.url());
      }
      
      // Esperar a que el formulario esté disponible
      await page.waitForTimeout(1000);
      await page.waitForSelector('#competencia', { timeout: 20000 });
      console.log('✅ Formulario de consulta disponible');
      
      await fillForm(page, CONFIG);
      await openDetalle(page);

      // 🔧 FORZAR RENDER DE MOVIMIENTOS Y PDFs (OBLIGATORIO PJUD)
      console.log('🧩 Forzando render de PDFs...');
      await page.evaluate(() => {
        const btn = document.querySelector('#linkMasMovimientos');
        if (btn) btn.click();
      });
      await page.waitForTimeout(3000);

      const icons = await page.$$('img[onclick*="verDocumento"]');
      console.log('🧪 PDF icons detectados:', icons.length);

      // Screenshot antes de extraer tabla
      await page.screenshot({ path: 'debug_11_antes_extraer_tabla.png', fullPage: false });
      console.log('📸 Screenshot: debug_11_antes_extraer_tabla.png');

      // 1. Extraer tabla con datos de PDFs e iconos
      // const rows = await extractTable(page);
      const rows = await extractTableAsArray(page);

      console.log('📊 Datos extraídos:', rows.length, 'filas');

      const outputDir = path.resolve(__dirname, 'outputs');
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

      // 2. Descargar PDFs de la tabla y obtener el mapeo
      const { downloadPDFsFromTable } = require('./pdfDownloader');
      const pdfMapping = await downloadPDFsFromTable(
        page,
        context,
        outputDir,
        CONFIG.rit,
        rows // 👈 PASAS LAS FILAS REALES
      );
      
      // 3. Descargar eBook con nombre específico
      const { downloadEbook } = require('./ebook');
      await downloadEbook(page, context, CONFIG, outputDir);

      // 4. Identificar y renombrar PDF de demanda
      const ritClean = CONFIG.rit.replace(/[^a-zA-Z0-9]/g, '_');
      const movDemanda = rows.find(r => 
        r.texto && r.texto[5] && r.texto[5].toLowerCase().includes('demanda')
      );
      if (movDemanda && pdfMapping[movDemanda.texto[0]]) {
        const pdfPrincipal = pdfMapping[movDemanda.texto[0]].azul;
        if (pdfPrincipal) {
          const oldPath = path.join(outputDir, pdfPrincipal);
          const newPath = path.join(outputDir, `${ritClean}_demanda.pdf`);
          if (fs.existsSync(oldPath)) {
            fs.copyFileSync(oldPath, newPath);
            console.log(`✅ PDF de demanda identificado y guardado: ${ritClean}_demanda.pdf`);
          }
        }
      }

      // 5. Procesar datos para exportar JSON/CSV (opcional para retrocompatibilidad)
      const { exportToJSON, exportToCSV, processTableData } = require('./exporter');
      exportToJSON(rows, outputDir, CONFIG.rit, pdfMapping);
      exportToCSV(rows, outputDir, CONFIG.rit);

      // 6. Rellenar tabla intermedia SQL local (y guardar SQL en archivo)
      const { importarAMovimientosIntermedia } = require('./importar_intermedia_sql');
      const datosProcesados = processTableData(rows, CONFIG.rit, pdfMapping);
      
      // Identificar nombres de demanda y ebook si existen (ritClean ya está declarado arriba)
      const demandaNombre = fs.existsSync(path.join(outputDir, `${ritClean}_demanda.pdf`)) 
        ? `${ritClean}_demanda.pdf` 
        : null;
      const ebookNombre = fs.existsSync(path.join(outputDir, `${ritClean}_ebook.pdf`)) 
        ? `${ritClean}_ebook.pdf` 
        : null;
      
      await importarAMovimientosIntermedia(CONFIG.rit, datosProcesados, CONFIG, pdfMapping, true, demandaNombre, ebookNombre);
      
      console.log('✅ Scraping e importación completados exitosamente!');
      console.log('📊 Resultados guardados en:', outputDir);
      
      // Pausa opcional - Comentar esta línea si no quieres pausa
      // console.log('⏸️ Pausando para revisión (presiona Enter para continuar)...');
      // await page.pause();
    } catch (err) {
      console.error('💥 Error:', err);
      await saveErrorEvidence(page, screenshotPath, htmlPath);
      // No hacer pause aquí para que se cierre el navegador
    } finally {
      console.log('🧭 Proceso finalizado.');
      await browser.close();
    }
  })();
