const { detectCaptcha, checkIfBlocked } = require('./utils/captcha-detector');

async function closeModalIfExists(page) {
  try {
    console.log('🔍 Buscando modal para cerrar...');
    await page.waitForSelector('#close-modal', { timeout: 3000 });
    await page.click('#close-modal');
    console.log('✅ Modal cerrado');
    await page.waitForTimeout(300);
    // Screenshot deshabilitado en modo headless
    // await page.screenshot({ path: 'debug_02_modal_cerrado.png', fullPage: false });
    // console.log('📸 Screenshot: debug_02_modal_cerrado.png');
  } catch (_) {
    console.log('ℹ️ No se encontró modal para cerrar');
    // Screenshot deshabilitado en modo headless
    // await page.screenshot({ path: 'debug_02_sin_modal.png', fullPage: false });
  }
}

async function goToConsultaCausas(page) {
  // Verificar CAPTCHA antes de navegar - NOTIFICAR Y DETENER si hay bloqueo
  const captchaCheck = await detectCaptcha(page);
  const blockCheck = await checkIfBlocked(page);
  
  if (captchaCheck.detected || blockCheck.blocked) {
    const errorType = captchaCheck.detected ? captchaCheck.type : blockCheck.reason;
    
    // Solo notificar y detener si es un bloqueo real o CAPTCHA activo
    if (captchaCheck.type === 'recaptcha-active' || blockCheck.blocked) {
      console.error('\n🚨 ============================================');
      console.error('🚨 BLOQUEO/CAPTCHA DETECTADO ANTES DE NAVEGAR');
      console.error('🚨 ============================================');
      console.error(`\n❌ Tipo: ${errorType}`);
      console.error(`📋 Razón: ${blockCheck.blocked ? blockCheck.reason : captchaCheck.type}`);
      console.error('\n📝 ACCIÓN REQUERIDA:');
      console.error('   1. Espera 30-60 minutos antes de reintentar');
      console.error('   2. Considera usar una VPN o cambiar tu IP');
      console.error('   3. Reduce la velocidad de scraping');
      console.error('\n⏸️  El proceso se ha detenido para evitar empeorar el bloqueo.');
      console.error('🚨 ============================================\n');
      
      throw new Error(`CAPTCHA/Bloqueo detectado antes de navegar - Deteniendo ejecución: ${errorType}`);
    } else {
      // Solo advertencia si no está realmente activo
      console.warn(`⚠️ Script de reCAPTCHA detectado pero inactivo, continuando...`);
    }
  }
  console.log("🖱️ Entrando a 'Consulta causas'...");

  try {
    // Screenshot deshabilitado en modo headless
    // await page.screenshot({ path: 'debug_03_antes_consulta_causas.png', fullPage: false });
    // console.log('📸 Screenshot: debug_03_antes_consulta_causas.png');
    
    // Esperar menos tiempo
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {
      console.warn('⚠️ Timeout esperando domcontentloaded');
    });
    
    // Delay optimizado (200-600ms)
    await page.waitForTimeout(200 + Math.random() * 400);
    
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
        
        // Screenshot deshabilitado en modo headless
        // await page.screenshot({ path: 'debug_04_enlace_encontrado.png', fullPage: false });
        // console.log('📸 Screenshot: debug_04_enlace_encontrado.png');
        
        // Esperar a que la navegación comience (más rápido)
        const navigationPromise = page.waitForNavigation({ 
          waitUntil: 'domcontentloaded', 
          timeout: 30000 // Aumentado de 20s a 30s para evitar timeouts
        }).catch(() => {
          console.warn('⚠️ Timeout en navegación, continuando...');
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
    
    // Delay optimizado después de navegar (300-700ms)
    await page.waitForTimeout(300 + Math.random() * 400);
    
    // Screenshot deshabilitado en modo headless
    // await page.screenshot({ path: 'debug_05_despues_navegacion.png', fullPage: false });
    // console.log('📸 Screenshot: debug_05_despues_navegacion.png');
    
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
