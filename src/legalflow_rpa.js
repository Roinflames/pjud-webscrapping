// ¿Qué realiza este script?
// Login a legalflow
// Llenar formulario
// Crear caso
require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');

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
  const requestData = JSON.parse(fs.readFileSync('assets/request.json', 'utf-8'));

  // LLENAR FORMULARIO
  await page.fill('#referencia_caso', requestData.ReferenciaCliente);
  await page.fill('#descripcion_caso', requestData.NaveDescripcionCaso);
  await page.fill('#asunto_caso', requestData.AsuntoCaratula);
  await page.fill('#referencia_demandante', requestData.ReferenciaDemandante);
  await page.fill('#fechai', requestData.FechaInicio);
  await page.selectOption('#abogado_principal', { label: requestData.AbogadoPrincipal });

  if (requestData.TipoCobro.CobroFijo) await page.check('#cobrofijo');
  if (requestData.TipoCobro.CobroPorcentaje) await page.check('#cobroporciento');

  await page.fill('#fechait', requestData.FechaIngresoTribunal || '');
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
