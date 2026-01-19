// Script de diagnóstico para verificar la conexión al PJUD
require('dotenv').config();
const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Iniciando diagnóstico...\n');
  
  // Verificar variables de entorno
  console.log('1️⃣ Verificando configuración:');
  console.log('   OJV_URL:', process.env.OJV_URL || '❌ NO CONFIGURADO');
  
  if (!process.env.OJV_URL) {
    console.error('\n❌ ERROR: No hay OJV_URL en .env');
    console.log('💡 Crea un archivo .env con:');
    console.log('   OJV_URL=https://oficinajudicialvirtual.pjud.cl/home/index.php');
    process.exit(1);
  }
  
  console.log('\n2️⃣ Abriendo navegador...');
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 50
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('3️⃣ Navegando a:', process.env.OJV_URL);
    await page.goto(process.env.OJV_URL, { 
      waitUntil: 'networkidle', 
      timeout: 90000 
    });
    
    console.log('✅ Página cargada');
    console.log('   URL:', page.url());
    console.log('   Título:', await page.title());
    
    // Verificar contenido
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('   Contenido (primeros 200 chars):', bodyText.substring(0, 200));
    
    if (!bodyText || bodyText.trim().length === 0) {
      console.error('\n❌ ERROR: La página está en blanco');
      await page.screenshot({ path: 'debug_blanco.png', fullPage: true });
      console.log('   Screenshot guardado en: debug_blanco.png');
    } else {
      console.log('✅ Página tiene contenido');
    }
    
    // Buscar enlaces comunes
    console.log('\n4️⃣ Buscando enlaces...');
    const links = await page.$$eval('a', links => 
      links.map(l => ({
        text: l.innerText.trim().substring(0, 50),
        href: l.href
      })).filter(l => l.text.toLowerCase().includes('consulta') || l.text.toLowerCase().includes('causa'))
    );
    
    if (links.length > 0) {
      console.log(`✅ Encontrados ${links.length} enlaces relacionados:`);
      links.slice(0, 5).forEach((link, i) => {
        console.log(`   ${i + 1}. "${link.text}" → ${link.href}`);
      });
    } else {
      console.log('⚠️ No se encontraron enlaces con "consulta" o "causa"');
    }
    
    // Buscar formularios
    console.log('\n5️⃣ Buscando formularios...');
    const forms = await page.$$('form');
    console.log(`   Encontrados ${forms.length} formularios`);
    
    if (forms.length > 0) {
      const formSelects = await page.$$('form select');
      console.log(`   Encontrados ${formSelects.length} campos select`);
      
      if (formSelects.length > 0) {
        const selectIds = await page.$$eval('form select', selects => 
          selects.map(s => s.id || s.name || 'sin-id').slice(0, 10)
        );
        console.log('   IDs de selects:', selectIds.join(', '));
      }
    }
    
    console.log('\n✅ Diagnóstico completado');
    console.log('\n⏸️ Presiona Enter para cerrar...');
    await page.pause();
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await page.screenshot({ path: 'debug_error.png', fullPage: true });
    console.log('   Screenshot guardado en: debug_error.png');
  } finally {
    await browser.close();
  }
})();


