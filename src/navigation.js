async function closeModalIfExists(page) {
  try {
    console.log('🔍 Buscando modal para cerrar...');
    await page.waitForSelector('#close-modal', { timeout: 3000 });
    await page.click('#close-modal');
    console.log('✅ Modal cerrado');
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'debug_02_modal_cerrado.png', fullPage: false });
    console.log('📸 Screenshot: debug_02_modal_cerrado.png');
  } catch (_) {
    console.log('ℹ️ No se encontró modal para cerrar');
    await page.screenshot({ path: 'debug_02_sin_modal.png', fullPage: false });
  }
}

async function goToConsultaCausas(page) {
  console.log("🖱️ Entrando a 'Consulta causas'...");

  try {
    // Screenshot antes de buscar el enlace
    await page.screenshot({ path: 'debug_03_antes_consulta_causas.png', fullPage: false });
    console.log('📸 Screenshot: debug_03_antes_consulta_causas.png');
    
    // Esperar menos tiempo
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {
      console.warn('⚠️ Timeout esperando domcontentloaded');
    });
    
    // Delay humano aleatorio (500-1500ms)
    await page.waitForTimeout(500 + Math.random() * 1000);
    
    // Buscar el enlace de varias formas posibles
    const selectors = [
      'text=Consulta causas',
      'a:has-text("Consulta causas")',
      'a[href*="consulta"]',
      'a[href*="causa"]'
    ];
    
    let clicked = false;
    for (const selector of selectors) {
      try {
        console.log(`🔍 Intentando selector: ${selector}`);
        await page.waitForSelector(selector, { timeout: 5000 });
        console.log(`✅ Selector encontrado: ${selector}`);
        
        // Screenshot antes del click
        await page.screenshot({ path: 'debug_04_enlace_encontrado.png', fullPage: false });
        console.log('📸 Screenshot: debug_04_enlace_encontrado.png');
        
        // Esperar a que la navegación comience (más rápido)
        const navigationPromise = page.waitForNavigation({ 
          waitUntil: 'domcontentloaded', 
          timeout: 20000 
        }).catch(() => {
          console.warn('⚠️ Timeout en navegación');
        });
        
        await page.click(selector);
        console.log('✅ Click realizado');
        
        await navigationPromise;
        clicked = true;
        break;
      } catch (error) {
        console.log(`❌ Selector falló: ${selector} - ${error.message}`);
        continue;
      }
    }
    
    if (!clicked) {
      await page.screenshot({ path: 'debug_error_no_consulta_causas.png', fullPage: true });
      throw new Error('No se pudo encontrar el enlace "Consulta causas"');
    }
    
    // Esperar menos tiempo
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {
      console.warn('⚠️ Timeout esperando carga de nueva página');
    });
    
    // Delay humano después de navegar (1-2 segundos)
    await page.waitForTimeout(1000 + Math.random() * 1000);
    
    // Screenshot después de navegar
    await page.screenshot({ path: 'debug_05_despues_navegacion.png', fullPage: false });
    console.log('📸 Screenshot: debug_05_despues_navegacion.png');
    
    console.log('✅ Navegación completada. URL actual:', page.url());
    
  } catch (error) {
    console.error('❌ Error en goToConsultaCausas:', error.message);
    await page.screenshot({ path: 'debug_error_navegacion.png', fullPage: true });
    throw error;
  }
}

module.exports = {
  closeModalIfExists,
  goToConsultaCausas
};
