/**
 * Script de debug para capturar la estructura de la página PJUD
 */

require('dotenv').config();
const { startBrowser } = require('./browser');
const fs = require('fs');

async function debugPageStructure() {
  console.log('🔍 Capturando estructura de la página PJUD...\n');
  
  const session = await startBrowser(process.env.OJV_URL, { headless: false, slowMo: 100 });
  const { page } = session;
  
  try {
    // 1. Capturar página inicial
    console.log('📸 Capturando página inicial...');
    await page.screenshot({ path: 'debug_structure_1_inicial.png', fullPage: true });
    fs.writeFileSync('debug_structure_1_inicial.html', await page.content());
    console.log('   ✅ Guardado: debug_structure_1_inicial.html/png');
    
    // 2. Ejecutar sesión de invitado
    console.log('\n🔐 Estableciendo sesión de invitado...');
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
    
    await page.waitForTimeout(1000);
    
    // Navegar a indexN
    const origin = new URL(page.url()).origin;
    await page.goto(`${origin}/indexN.php`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // 3. Capturar después de login
    console.log('📸 Capturando después de sesión invitado...');
    await page.screenshot({ path: 'debug_structure_2_indexN.png', fullPage: true });
    fs.writeFileSync('debug_structure_2_indexN.html', await page.content());
    console.log('   ✅ Guardado: debug_structure_2_indexN.html/png');
    
    // 4. Buscar todos los enlaces disponibles
    console.log('\n🔗 Buscando todos los enlaces en la página...');
    const enlaces = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.map(a => ({
        text: a.innerText.trim().substring(0, 100),
        href: a.href,
        id: a.id,
        class: a.className,
        onclick: a.getAttribute('onclick')
      })).filter(l => l.text || l.href || l.onclick);
    });
    
    console.log(`   Encontrados ${enlaces.length} enlaces:`);
    enlaces.forEach((e, i) => {
      if (e.text.toLowerCase().includes('causa') || 
          e.text.toLowerCase().includes('consult') ||
          (e.href && e.href.includes('causa'))) {
        console.log(`   📌 ${i}: "${e.text}" - href: ${e.href} - id: ${e.id} - onclick: ${e.onclick}`);
      }
    });
    
    // 5. Buscar menús
    console.log('\n📂 Buscando elementos de menú...');
    const menus = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('li, .menu-item, .nav-item, [role="menuitem"]'));
      return items.map(el => ({
        tag: el.tagName,
        text: el.innerText.trim().substring(0, 100),
        id: el.id,
        class: el.className,
        children: Array.from(el.querySelectorAll('a')).map(a => ({
          text: a.innerText.trim(),
          href: a.href
        }))
      })).filter(m => m.text.toLowerCase().includes('causa') || m.text.toLowerCase().includes('consult'));
    });
    
    console.log(`   Encontrados ${menus.length} menús relevantes:`);
    menus.forEach((m, i) => {
      console.log(`   📌 ${i}: <${m.tag}> id="${m.id}" class="${m.class}" text="${m.text.substring(0, 50)}"`);
      m.children.forEach(c => console.log(`      └─ <a> "${c.text}" href="${c.href}"`));
    });
    
    // 6. Buscar iframes
    console.log('\n🖼️ Buscando iframes...');
    const iframes = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('iframe')).map(f => ({
        src: f.src,
        id: f.id,
        name: f.name
      }));
    });
    
    if (iframes.length > 0) {
      console.log(`   Encontrados ${iframes.length} iframes:`);
      iframes.forEach((f, i) => console.log(`   📌 ${i}: src="${f.src}" id="${f.id}" name="${f.name}"`));
    } else {
      console.log('   No hay iframes');
    }
    
    // 7. Guardar resumen
    const resumen = {
      url: page.url(),
      titulo: await page.title(),
      enlaces: enlaces,
      menus: menus,
      iframes: iframes
    };
    
    fs.writeFileSync('debug_structure_resumen.json', JSON.stringify(resumen, null, 2));
    console.log('\n✅ Resumen guardado en debug_structure_resumen.json');
    
    // Pausar para inspección manual
    console.log('\n⏸️ Navegador abierto para inspección manual...');
    console.log('   Presiona Ctrl+C para cerrar.');
    
    await page.waitForTimeout(60000); // Esperar 1 minuto
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await session.browser.close();
  }
}

debugPageStructure();
