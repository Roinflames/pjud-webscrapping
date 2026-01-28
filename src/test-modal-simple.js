/**
 * Test simple para diagnosticar por qué el modal no carga
 */

const { firefox } = require('playwright');

async function testModal() {
  console.log('🚀 Iniciando test de modal...\n');

  const browser = await firefox.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  try {
    // 1. Navegar al sitio
    console.log('📍 Navegando a PJUD...');
    await page.goto('https://oficinajudicialvirtual.pjud.cl/indexN.php#702', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForTimeout(3000);

    // 2. Llenar formulario
    console.log('📝 Llenando formulario...');
    await page.selectOption('#competencia', '3'); // Civil
    await page.waitForTimeout(500);

    await page.selectOption('#conCorte', '90'); // Santiago
    await page.waitForTimeout(500);

    await page.selectOption('#conTipoCausa', 'C');
    await page.waitForTimeout(500);

    await page.fill('#conRolCausa', '13786');
    await page.fill('#conEraCausa', '2018');

    console.log('🔍 Haciendo búsqueda...');
    await page.click('button:has-text("Buscar")');
    await page.waitForTimeout(5000);

    // 3. Verificar resultados
    console.log('📊 Verificando resultados...');
    const resultados = await page.$$eval('table tbody tr', rows => rows.length);
    console.log(`   Resultados encontrados: ${resultados} filas`);

    // 4. Screenshot ANTES del click
    await page.screenshot({ path: './test_antes_click.png', fullPage: true });
    console.log('📸 Screenshot guardado: test_antes_click.png');

    // 5. Encontrar y analizar el enlace de lupa
    console.log('\n🔍 Analizando enlace de lupa...');
    const lupaInfo = await page.evaluate(() => {
      const firstRow = document.querySelector('table tbody tr');
      if (!firstRow) return { error: 'No hay filas' };

      const link = firstRow.querySelector('a[onclick*="detalleCausaCivil"]');
      if (!link) return { error: 'No hay enlace con detalleCausaCivil' };

      const onclick = link.getAttribute('onclick');
      const href = link.getAttribute('href');
      const classes = link.className;

      return {
        onclick: onclick?.substring(0, 150),
        href,
        classes,
        html: link.outerHTML.substring(0, 200)
      };
    });

    console.log('   Información del enlace:', JSON.stringify(lupaInfo, null, 2));

    // 6. CLICK en la lupa
    console.log('\n🖱️  Haciendo CLICK en la lupa...');

    // Método 1: Click con Playwright
    await page.click('table tbody tr:first-child a[onclick*="detalleCausaCivil"]');
    console.log('   ✅ Click ejecutado con Playwright');

    // Esperar
    await page.waitForTimeout(8000);

    // 7. Screenshot DESPUÉS del click
    await page.screenshot({ path: './test_despues_click.png', fullPage: true });
    console.log('📸 Screenshot guardado: test_despues_click.png');

    // 8. Verificar modal
    console.log('\n🔍 Verificando modal...');
    const modalInfo = await page.evaluate(() => {
      const modal = document.querySelector('#modalDetalleCivil');
      if (!modal) return { error: 'Modal no encontrado' };

      const isVisible = modal.offsetParent !== null;
      const hasClass = modal.classList.contains('in') || modal.classList.contains('show');
      const style = window.getComputedStyle(modal);
      const display = style.display;

      const tables = modal.querySelectorAll('table');
      const tablesInfo = Array.from(tables).map(t => ({
        rows: t.querySelectorAll('tbody tr').length,
        html: t.innerHTML.substring(0, 500)
      }));

      return {
        exists: true,
        isVisible,
        hasClass,
        display,
        innerHTML: modal.innerHTML.substring(0, 1000),
        tablesCount: tables.length,
        tables: tablesInfo
      };
    });

    console.log('   Modal info:', JSON.stringify(modalInfo, null, 2));

    // 9. Esperar entrada del usuario
    console.log('\n⏸️  Pausa para inspección manual. Presiona Enter para continuar...');
    await page.waitForTimeout(60000); // 1 minuto para inspeccionar

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: './test_error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n✅ Test completado');
  }
}

testModal().catch(console.error);
