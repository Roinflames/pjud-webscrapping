/**
 * Utilidades para detectar y manejar CAPTCHA/reCAPTCHA y bloqueos
 */

/**
 * Detecta si hay un CAPTCHA o reCAPTCHA ACTIVO y VISIBLE en la página
 * (No solo la presencia del script, sino si realmente está bloqueando)
 */
async function detectCaptcha(page) {
  try {
    // Verificar primero si el reCAPTCHA está realmente activo ejecutándose
    // Solo detectar si está visible y bloqueando la interacción
    const recaptchaActive = await page.evaluate(() => {
      // Verificar si reCAPTCHA está renderizado y visible
      const recaptchaContainer = document.querySelector('.g-recaptcha');
      if (recaptchaContainer) {
        const iframe = recaptchaContainer.querySelector('iframe[title*="reCAPTCHA"]');
        if (iframe) {
          const rect = iframe.getBoundingClientRect();
          // Verificar que está visible (ancho y alto > 0)
          return rect.width > 0 && rect.height > 0 && 
                 window.getComputedStyle(iframe).display !== 'none' &&
                 window.getComputedStyle(iframe).visibility !== 'hidden';
        }
      }
      return false;
    }).catch(() => false);

    if (recaptchaActive) {
      return { detected: true, type: 'recaptcha-active', selector: '.g-recaptcha' };
    }

    // Selectores de CAPTCHA VISIBLES (no solo presentes)
    const captchaSelectors = [
      'iframe[title*="reCAPTCHA"]',
      'iframe[src*="recaptcha"]',
      '.g-recaptcha iframe',
      '[data-sitekey]', // reCAPTCHA v2 (solo si es interactivo)
      '.captcha',
      '#captcha',
      'img[alt*="captcha"]',
      'img[src*="captcha"]'
    ];

    // Verificar si alguno de estos selectores existe Y está visible
    for (const selector of captchaSelectors) {
      const element = await page.$(selector);
      if (element) {
        const isVisible = await element.isVisible().catch(() => false);
        // Verificar también que tenga dimensiones
        if (isVisible) {
          const boundingBox = await element.boundingBox().catch(() => null);
          if (boundingBox && boundingBox.width > 0 && boundingBox.height > 0) {
            // Verificar que no esté oculto con CSS
            const isHidden = await page.evaluate((sel) => {
              const el = document.querySelector(sel);
              if (!el) return true;
              const style = window.getComputedStyle(el);
              return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
            }, selector).catch(() => false);

            if (!isHidden) {
              return { detected: true, type: 'captcha', selector };
            }
          }
        }
      }
    }

    // Verificar texto común de bloqueo/CAPTCHA (solo si es un mensaje visible)
    const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase()).catch(() => '');
    
    // Keywords más específicos que indiquen bloqueo real
    const blockKeywords = [
      'verifica que eres humano',
      'completa la verificación',
      'resuelve el captcha',
      'tu ip ha sido bloqueada',
      'acceso temporalmente bloqueado',
      'demasiadas solicitudes',
      'too many requests',
      'rate limit exceeded',
      'suspicious activity detected',
      'intento de acceso no autorizado'
    ];

    // Solo marcar como bloqueo si aparece un mensaje claro, no solo la palabra "captcha"
    for (const keyword of blockKeywords) {
      if (bodyText.includes(keyword)) {
        return { detected: true, type: 'block', keyword };
      }
    }

    // Verificar mensajes de error específicos en elementos visibles
    const errorMessages = await page.evaluate(() => {
      const errorElements = Array.from(document.querySelectorAll('.alert-danger, .error-message, .blocked-message, [class*="error"], [class*="blocked"]'));
      return errorElements
        .filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        })
        .map(el => el.textContent.toLowerCase())
        .join(' ');
    }).catch(() => '');

    for (const keyword of blockKeywords) {
      if (errorMessages.includes(keyword)) {
        return { detected: true, type: 'block', keyword, source: 'error-message' };
      }
    }

    // Verificar si hay mensajes de error relacionados con bloqueo
    const errorSelectors = [
      '.alert-danger',
      '.error-message',
      '.blocked-message',
      '[class*="error"]',
      '[class*="blocked"]'
    ];

    for (const selector of errorSelectors) {
      const element = await page.$(selector);
      if (element) {
        const text = await element.textContent().catch(() => '');
        if (text && blockKeywords.some(kw => text.toLowerCase().includes(kw))) {
          return { detected: true, type: 'block', message: text };
        }
      }
    }

    return { detected: false };
  } catch (error) {
    console.warn('⚠️ Error al detectar CAPTCHA:', error.message);
    return { detected: false, error: error.message };
  }
}

/**
 * Verifica si la página indica que estamos bloqueados
 */
async function checkIfBlocked(page) {
  try {
    const url = page.url();
    const title = await page.title().catch(() => '');
    const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase()).catch(() => '');

    // URLs comunes de bloqueo
    const blockedUrls = ['blocked', 'denied', 'suspended', 'ban'];
    if (blockedUrls.some(keyword => url.toLowerCase().includes(keyword))) {
      return { blocked: true, reason: 'URL bloqueada' };
    }

    // Títulos comunes de bloqueo
    const blockedTitles = ['bloqueado', 'acceso denegado', 'suspended', 'blocked'];
    if (blockedTitles.some(keyword => title.toLowerCase().includes(keyword))) {
      return { blocked: true, reason: 'Título indica bloqueo' };
    }

    // Verificar contenido de la página
    const blockIndicators = [
      'su ip ha sido bloqueada',
      'acceso temporalmente bloqueado',
      'demasiadas solicitudes',
      'too many requests',
      'rate limit exceeded',
      'suspicious activity detected'
    ];

    if (blockIndicators.some(indicator => bodyText.includes(indicator))) {
      return { blocked: true, reason: 'Contenido indica bloqueo' };
    }

    return { blocked: false };
  } catch (error) {
    console.warn('⚠️ Error al verificar bloqueo:', error.message);
    return { blocked: false, error: error.message };
  }
}

/**
 * Espera un tiempo aleatorio más largo cuando se detecta CAPTCHA o bloqueo
 */
async function handleCaptchaOrBlock(page, reason = 'CAPTCHA detectado') {
  console.warn(`\n⚠️ ${reason}`);
  console.warn('⏸️  Pausando por tiempo extendido para evitar bloqueos...');
  
  // Pausa más larga: 30-60 segundos
  const waitTime = 30000 + Math.random() * 30000; // 30-60 segundos
  console.warn(`   Esperando ${Math.round(waitTime / 1000)} segundos...`);
  
  await page.waitForTimeout(waitTime);
  
  // Intentar recargar la página
  console.log('🔄 Recargando página...');
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  // Verificar nuevamente
  const captchaCheck = await detectCaptcha(page);
  const blockCheck = await checkIfBlocked(page);
  
  if (captchaCheck.detected || blockCheck.blocked) {
    console.error('❌ CAPTCHA/Bloqueo persiste después de la pausa');
    return false;
  }
  
  console.log('✅ Página parece estar disponible nuevamente');
  return true;
}

module.exports = {
  detectCaptcha,
  checkIfBlocked,
  handleCaptchaOrBlock
};


