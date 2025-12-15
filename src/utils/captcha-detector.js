/**
 * Utilidades para detectar y manejar CAPTCHA/reCAPTCHA y bloqueos
 */

/**
 * Detecta si hay un CAPTCHA o reCAPTCHA en la página
 */
async function detectCaptcha(page) {
  try {
    // Selectores comunes de CAPTCHA/reCAPTCHA
    const captchaSelectors = [
      'iframe[title*="reCAPTCHA"]',
      'iframe[src*="recaptcha"]',
      'iframe[src*="captcha"]',
      '.g-recaptcha',
      '#recaptcha',
      '[data-sitekey]', // reCAPTCHA v2
      '.captcha',
      '#captcha',
      'img[alt*="captcha"]',
      'img[src*="captcha"]'
    ];

    // Verificar si alguno de estos selectores existe
    for (const selector of captchaSelectors) {
      const element = await page.$(selector);
      if (element) {
        const isVisible = await element.isVisible().catch(() => false);
        if (isVisible) {
          return { detected: true, type: 'captcha', selector };
        }
      }
    }

    // Verificar texto común de bloqueo/CAPTCHA
    const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
    const blockKeywords = [
      'captcha',
      'recaptcha',
      'verificación',
      'verifica que eres humano',
      'bloqueado',
      'acceso denegado',
      'suspicious activity',
      'too many requests',
      'rate limit',
      'intento de acceso no autorizado'
    ];

    for (const keyword of blockKeywords) {
      if (bodyText.includes(keyword)) {
        return { detected: true, type: 'block', keyword };
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


