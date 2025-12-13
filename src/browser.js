const { chromium } = require('playwright');

async function startBrowser(url) {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300 // Delay humano entre acciones (300ms)
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();

  if (url) {
    console.log('🌐 Navegando a:', url);
    try {
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', // Más rápido que networkidle
        timeout: 60000 
      });
      
      // Screenshot después de cargar
      await page.screenshot({ path: 'debug_01_pagina_cargada.png', fullPage: false });
      console.log('📸 Screenshot: debug_01_pagina_cargada.png');
      
      // Esperar como humano (1-2 segundos)
      await page.waitForTimeout(1000 + Math.random() * 1000);
      
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
