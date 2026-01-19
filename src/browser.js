const { chromium } = require('playwright');

// User agents rotativos para evitar detección
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function startBrowser(url, options = {}) {
  const { headless = true, slowMo = 100 } = options;
  
  const browser = await chromium.launch({ 
    headless: headless, // Modo headless configurable
    slowMo: slowMo // Delay entre acciones configurable
  });
  
  // Rotar user agent para evitar detección
  const userAgent = getRandomUserAgent();
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: userAgent,
    // Agregar headers adicionales para parecer más real
    extraHTTPHeaders: {
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    }
  });
  
  console.log('🌐 User-Agent:', userAgent);
  
  const page = await context.newPage();

  if (url) {
    console.log('🌐 Navegando a:', url);
    try {
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', // Más rápido que networkidle
        timeout: 60000 
      });
      
      // Screenshot solo si no está en modo headless
      if (!headless) {
        await page.screenshot({ path: 'debug_01_pagina_cargada.png', fullPage: false });
        console.log('📸 Screenshot: debug_01_pagina_cargada.png');
      }
      
      // Esperar optimizado (reducido en headless)
      await page.waitForTimeout(headless ? 200 : 500 + Math.random() * 500); // Optimizado: reducido de 500ms a 200ms
      
      console.log('✅ Página cargada:', page.url());
      console.log('📄 Título:', await page.title());
    } catch (error) {
      console.error('❌ Error al cargar la página:', error.message);
      await page.screenshot({ path: 'debug_error_carga.png', fullPage: true });
      throw error;
    }
  }

  return { browser, context, page };
}

module.exports = { startBrowser };
