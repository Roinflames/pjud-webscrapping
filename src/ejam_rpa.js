require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  // const browser = await chromium.launch({ headless: false });
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('[INFO] 🚀 Iniciando extracción de datos desde EJAM');

    // === LOGIN ===
    await page.goto('http://ejamtest.codifica.cl/login', { waitUntil: 'networkidle' });
    await page.fill('#inputUsername', process.env.EJAM_USER);
    await page.fill('#inputPassword', process.env.EJAM_PASS);
    await page.click('button[type="submit"]');
    console.log('[INFO] ✅ Login exitoso');

    // === IR A CONTRATO ===
    await page.goto('http://ejamtest.codifica.cl/contrato/', { waitUntil: 'networkidle' });

    const folio = process.env.EJAM_FOLIO || '24810';
    await page.fill('input.bFolio', folio);
    await page.click('button.btn.btn-primary i.fas.fa-search');
    console.log(`[INFO] 🔍 Buscando contrato con folio ${folio}`);

    await page.waitForSelector(`a[href*="/contrato/${folio}/linea_tiempo"]`, { timeout: 15000 });
    await page.click(`a[href*="/contrato/${folio}/linea_tiempo"]`);
    await page.waitForLoadState('networkidle');
    console.log('[INFO] 📄 Página de detalle abierta');

    // === EXTRAER DATOS ===
    const data = await page.evaluate(() => {
      const getText = (el) => el?.innerText.trim() || '';

      // Folio
      let folio = '';
      const h1 = document.querySelector('.card-body h1');
      if (h1) {
        const match = h1.innerText.match(/Folio:\s*(\d+)/i);
        folio = match ? match[1] : '';
      }

      // Función para obtener valor por label (Nombre, Rut, Abogado)
      const getByLabel = (label) => {
        const smalls = Array.from(document.querySelectorAll('.card-body small.text-muted'));
        for (let s of smalls) {
          if (getText(s).toLowerCase() === label.toLowerCase()) {
            let next = s.nextElementSibling;
            while (next && next.tagName.toLowerCase() !== 'p') {
              next = next.nextElementSibling;
            }
            return getText(next);
          }
        }
        return '';
      };

      const nombreCliente = getByLabel('Nombre');
      const rut = getByLabel('Rut');
      const abogado = getByLabel('Abogado');

      // Extraer tabla de causas (primer row relevante)
      const row = document.querySelector('table tbody tr');
      const juzgado = getText(row?.children[3]);
      const idCausa = getText(row?.children[2]);
      const caratulado = getText(row?.children[4]);

      // Extraer tipo, rol y año del idCausa
      let tipoCausa = '', rol = '', año = '';
      const match = idCausa.match(/^([A-Z])-(\d+)-(\d{4})$/);
      if (match) {
        tipoCausa = match[1];
        rol = match[2];
        año = match[3];
      }

      return { folio, nombreCliente, rut, abogado, juzgado, idCausa, caratulado, tipoCausa, rol, año };
    });

    console.log('[INFO] Datos capturados:', data);

    // === MAPEO DE JUZGADO → CONFIG PJUD ===
    const juzgadoMap = {
      "18 Juzgado Civil de Santiago": { competencia: "3", corte: "90", tribunal: "38" },
      "9 Juzgado Civil de Santiago": { competencia: "3", corte: "90", tribunal: "28" },
      // Agrega más según necesidad
    };
    const tribunalName = data.caratulado?.trim(); // "18 Juzgado Civil de Santiago"

    const pjConfig = {
      rit: `${data.rol}-${data.año}`,
      competencia: juzgadoMap[tribunalName]?.competencia || "3",
      corte: juzgadoMap[tribunalName]?.corte || "90",
      tribunal: juzgadoMap[tribunalName]?.tribunal || "276",
      tipoCausa: data.tipoCausa,
      cliente: data.nombreCliente,
      rut: data.rut,
      caratulado: data.caratulado,
      abogado: data.abogado,
      juzgado: data.juzgado,
      folio: data.folio
    };

    // === GUARDAR JSON ===
    const savePath = './pjud_config.json';
    fs.writeFileSync(savePath, JSON.stringify(pjConfig, null, 2));
    console.log(`✅ Archivo generado correctamente: ${savePath}`);

  } catch (error) {
    console.error('[ERROR] ❌ Error durante la ejecución:', error);
  } finally {
    console.log('[INFO] 🔓 Manteniendo navegador abierto para inspección manual');
    // await page.waitForTimeout(9999999);
    await browser.close();
  }
})();
