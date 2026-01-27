const { chromium, firefox, webkit } = require('playwright');

// User agents específicos por navegador
const USER_AGENTS = {
  chromium: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ],
  firefox: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0',
    'Mozilla/5.0 (X11; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0'
  ],
  webkit: [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
  ]
};

function getRandomUserAgent(browserType) {
  const agents = USER_AGENTS[browserType] || USER_AGENTS.firefox;
  return agents[Math.floor(Math.random() * agents.length)];
}

async function startBrowser(url, options = {}) {
  const { headless = true, slowMo = 100 } = options;

  // Leer tipo de navegador de variable de entorno o usar firefox por defecto
  // IMPORTANTE: Firefox evita reCAPTCHA mejor que Chromium
  const browserType = process.env.PLAYWRIGHT_BROWSER || 'firefox';
  console.log(`🌐 Usando navegador: ${browserType.toUpperCase()}`);

  // Seleccionar el navegador correcto
  let browserEngine;
  switch(browserType.toLowerCase()) {
    case 'chromium':
    case 'chrome':
      browserEngine = chromium;
      break;
    case 'firefox':
    case 'ff':
      browserEngine = firefox;
      break;
    case 'webkit':
    case 'safari':
      browserEngine = webkit;
      break;
    default:
      console.log(`⚠️  Navegador '${browserType}' no reconocido, usando Firefox`);
      browserEngine = firefox;
  }

  const browser = await browserEngine.launch({
    headless: headless, // Modo headless configurable
    slowMo: slowMo, // Delay entre acciones configurable
    // Firefox-specific: evita mejor el reCAPTCHA
    firefoxUserPrefs: browserType === 'firefox' ? {
      'dom.webdriver.enabled': false,
      'useAutomationExtension': false,
      'general.platform.override': 'Win32',
      'general.useragent.override': getRandomUserAgent('firefox')
    } : undefined
  });

  // Rotar user agent para evitar detección (específico del navegador)
  const userAgent = getRandomUserAgent(browserType);
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: userAgent,
    // Agregar headers adicionales para parecer más real
    extraHTTPHeaders: {
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    },
    // Deshabilitar detección de automatización
    locale: 'es-ES',
    timezoneId: 'America/Santiago'
  });

  // Inyectar script para ocultar automatización
  await context.addInitScript(() => {
    // Ocultar webdriver
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined
    });

    // Modificar plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5]
    });

    // Modificar languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['es-ES', 'es', 'en']
    });

    // Modificar permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
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

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { startBrowser, delay };
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { startBrowser, delay };

