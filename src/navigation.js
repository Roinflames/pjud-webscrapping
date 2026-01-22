const { detectCaptcha, checkIfBlocked } = require('./utils/captcha-detector');

async function ensureGuestSession(page) {
  try {
    const currentUrl = page.url();
    const isHome = currentUrl.includes('home/index.php');
    const isIndexN = currentUrl.includes('indexN.php');

    if (isHome || !isIndexN) {
      console.log('🔐 Estableciendo sesión de invitado...');
      await page.evaluate(async () => {
        const accesoConsultaCausas = 'CC';
        await fetch('../includes/sesion-invitado.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `nombreAcceso=${accesoConsultaCausas}`
        });

        localStorage.setItem('InitSitioOld', '0');
        localStorage.setItem('InitSitioNew', '1');
        localStorage.setItem('logged-in', 'true');
        sessionStorage.setItem('logged-in', 'true');
      });

      await page.waitForTimeout(500);

      const origin = new URL(currentUrl).origin;
      await page.goto(`${origin}/indexN.php`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      await page.waitForTimeout(800);
      console.log('✅ Sesión de invitado establecida');
    }
  } catch (error) {
    console.warn('⚠️ No se pudo establecer sesión de invitado:', error.message);
  }
}

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
  await ensureGuestSession(page);
  
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
  
  // ESTRATEGIA 1: Intentar navegación directa primero (más confiable)
  const origin = new URL(page.url()).origin;
  const directUrls = [
    `${origin}/ADIR_871/civil/views/consultaCausas.php`,
    `${origin}/civil/views/consultaCausas.php`,
    `${origin}/indexN.php#702`, // Hash para el menú 702
  ];
  
  for (const url of directUrls) {
    try {
      console.log(`🔗 Intentando URL directa: ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1500);
      
      // Verificar si estamos en la página de consulta (tiene el formulario)
      const tieneFormulario = await page.$('select[id*="competencia"], select[name*="competencia"], #competencia, input[id*="rol"], #numRol');
      if (tieneFormulario) {
        console.log('✅ Navegación directa exitosa - Formulario encontrado');
        console.log('📍 URL actual:', page.url());
        return;
      }
    } catch (e) {
      console.log(`   ⚠️ URL no disponible: ${e.message}`);
    }
  }
  
  console.log('⚠️ Navegación directa no funcionó, intentando por menú...');

  try {
    // Esperar a que la página esté lista
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {
      console.warn('⚠️ Timeout esperando domcontentloaded');
    });
    
    // Esperar un poco más para asegurar que JavaScript se ejecute
    await page.waitForTimeout(1000 + Math.random() * 500);
    
    // Verificar si estamos en la página correcta
    const currentUrl = page.url();
    console.log(`📍 URL actual: ${currentUrl}`);
    
    // Si no estamos en indexN.php, navegar directamente
    if (!currentUrl.includes('indexN.php')) {
      console.log('🔄 Navegando directamente a indexN.php...');
      const origin = new URL(currentUrl).origin;
      await page.goto(`${origin}/indexN.php`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      await page.waitForTimeout(1500);
    }
    
    // Primero, intentar expandir el menú lateral si existe
    try {
      const menuToggle = await page.$('.sidebar-toggle, .menu-toggle, [data-toggle="sidebar"], button.navbar-toggler');
      if (menuToggle) {
        console.log('📂 Expandiendo menú lateral...');
        await menuToggle.click();
        await page.waitForTimeout(500);
      }
    } catch (e) {
      // Ignorar si no hay menú para expandir
    }

    // Buscar el enlace de varias formas posibles - expandido para más casos
    const selectors = [
      // Selectores específicos del PJUD (IDs escapados correctamente)
      '[id="702"]',
      'a[id="702"]',
      '[data-id="702"]',
      'li[id="702"] a',
      // Selectores por texto
      'text=Consulta causas',
      'text=CONSULTA CAUSAS',
      'a:has-text("Consulta causas")',
      'a:has-text("Consulta Causas")',
      'span:has-text("Consulta causas")',
      ':text("Consulta causas")',
      // Selectores por href
      'a[href*="consultaCausas"]',
      'a[href*="consulta_causas"]',
      'a[href*="busquedaCausas"]',
      'a[href*="consulta"]',
      'a[href*="causa"]',
      // Selectores genéricos de menú
      '.menu-item:has-text("Consulta")',
      '.nav-link:has-text("Consulta")',
      'li:has-text("Consulta causas") a',
      // Selector por onclick
      '[onclick*="consultaCausas"]',
      '[onclick*="busquedaCausas"]'
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
      // Intentar navegación directa como último recurso
      console.log('🔄 Intentando navegación directa a consulta de causas...');
      try {
        const origin = new URL(page.url()).origin;
        // Intentar diferentes URLs conocidas del PJUD
        const directUrls = [
          `${origin}/ADIR_871/civil/views/consultaCausas.php`,
          `${origin}/civil/views/consultaCausas.php`,
          `${origin}/indexN.php?opc=busquedaCausas`
        ];
        
        for (const url of directUrls) {
          try {
            console.log(`   🔗 Probando: ${url}`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
            await page.waitForTimeout(1000);
            
            // Verificar si llegamos a un formulario de búsqueda
            const tieneFormulario = await page.$('select#competencia, select[name="competencia"], #form_busqueda');
            if (tieneFormulario) {
              console.log('✅ Navegación directa exitosa');
              clicked = true;
              break;
            }
          } catch (e) {
            console.log(`   ❌ URL no disponible: ${url}`);
          }
        }
      } catch (directError) {
        console.log('❌ Navegación directa también falló');
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
