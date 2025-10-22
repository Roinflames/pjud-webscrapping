require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');

// Selector del contenedor select2 y nombre de la opción
async function select2Select(page, containerSelector, optionText) {
  // Abrir dropdown
  await page.click(containerSelector);

  // Esperar input de búsqueda
  const searchInput = '.select2-search__field';
  await page.waitForSelector(searchInput);

  // Escribir opción y presionar Enter
  await page.fill(searchInput, optionText);
  await page.keyboard.press('Enter');

  // Pequeño delay para que se registre la selección
  await page.waitForTimeout(500);
}

/**
 * Selecciona una o varias opciones en un select2 múltiple
 * @param page Playwright page
 * @param containerSelector Selector del contenedor visible del select2
 * @param options Array de strings con las opciones a seleccionar
 */
async function select2MultiSelect(page, containerSelector, options) {
  for (const optionText of options) {
    // Abrir dropdown
    await page.click(containerSelector);

    // Esperar input de búsqueda
    const searchInput = '.select2-search__field';
    await page.waitForSelector(searchInput);

    // Escribir la opción y presionar Enter
    await page.fill(searchInput, optionText);
    await page.keyboard.press('Enter');

    // Pequeño delay para que se registre la selección
    await page.waitForTimeout(300);
  }
}

/**
 * Abre un select2 sin seleccionar ninguna opción.
 * Útil para campos obligatorios que todavía no tienen datos.
 */
async function select2OpenOnly(page, containerSelector) {
  await page.click(containerSelector);
  // Esperar input de búsqueda
  await page.waitForSelector('.select2-search__field', { timeout: 2000 }).catch(() => {});
  // Mantener abierto por 0.3s
  await page.waitForTimeout(300);
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

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

  console.log("URL actual después del clic:", page.url());
  await page.screenshot({ path: 'casos_debug.png' });

  // Esperar botón "Nuevo Caso"
  await page.waitForSelector('a[href*="/casos/create"]', { timeout: 15000 });
  console.log('✅ Sección Casos abierta');

  // ABRIR NUEVO CASO
  await page.locator('a[href*="/casos/create"]').click();
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('#referencia_caso', { timeout: 30000 });
  console.log('✅ Formulario de Nuevo Caso abierto');

  // LEER DATOS DEL JSON
  const requestData = JSON.parse(fs.readFileSync('../assets/request.json', 'utf-8'));

  // LLENAR FORMULARIO
  await page.fill('#referencia_caso', requestData.ReferenciaCliente);
  await page.fill('#descripcion_caso', requestData.NaveDescripcionCaso);
  await page.fill('#asunto_caso', requestData.AsuntoCaratula);
  await page.fill('#referencia_demandante', requestData.ReferenciaDemandante);
  await page.fill('#fechai', requestData.FechaInicio);
  
  // SELECT2: Abogado Principal
  await select2Select(page, '#select2-abogado_principal-container', requestData.AbogadoPrincipal);

  if (requestData.TipoCobro.CobroFijo) await page.check('#cobrofijo');
  if (requestData.TipoCobro.CobroPorcentaje) await page.check('#cobroporciento');
  
  if (requestData.FechaIngresoTribunal) {
    await page.evaluate(({ selector, value }) => {
      const input = document.querySelector(selector);
      if (input) input.value = value;
    }, { selector: '#fechait', value: requestData.FechaIngresoTribunal });

    await page.waitForTimeout(200); // para que el framework registre el cambio
  }

  // Abrir select2 múltiple sin seleccionar nada
  await select2OpenOnly(page, '#select2-abogados-container');

  await page.fill('#bill_input', requestData.BillOfLading);
  await page.fill('#cuantia', requestData.Cuantia.toString());
  await page.fill('#observaciones', requestData.Observaciones || '');

  // Datos PJUD
  await page.selectOption('#competencia', { label: requestData.DatosPJUD.Competencia });
  await page.waitForTimeout(1000);
  await page.selectOption('#corte', { label: requestData.DatosPJUD.Corte });
  await page.waitForTimeout(1000);
  await page.selectOption('#tribunal_id', { label: requestData.DatosPJUD.Tribunal });
  await page.fill('#rol_pjud', requestData.DatosPJUD.Rol);
  await page.fill('#anio_pjud', requestData.DatosPJUD.Ano.toString());

  await page.selectOption('#etapa_procesal', { label: requestData.EtapaProcesal });
  await page.selectOption('#estado_caso', { label: requestData.EstadoCaso });
  await page.selectOption('#estado_casoi', { label: 'Tramitación' });
  await page.selectOption('#tipo_caso', { label: requestData.TipoCaso });

  // GUARDAR
  await page.click('#btnguardar');
  await page.waitForURL('**/edit/**', { timeout: 30000 });
  console.log('✅ Formulario guardado y redirigido a la página de edición');

  // CAPTURAR Y MOSTRAR LA URL DEL NUEVO CASO
  const caseUrl = page.url();
  console.log('\n🧭 URL del nuevo caso creado:\n👉', caseUrl, '\n');

  // Mantener abierto el navegador
  console.log('🔓 Navegador permanecerá abierto para inspección manual.');
  console.log('Presiona CTRL + C para detener el script cuando termines.\n');

  // Mantener la sesión viva
  await page.waitForTimeout(99999999);

})();