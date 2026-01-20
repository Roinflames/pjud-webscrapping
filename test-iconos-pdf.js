/**
 * Script de prueba para capturar pantallazo y extraer información
 * sobre los iconos PDF (azul/rojo) en la tabla de movimientos del PJUD
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { startBrowser } = require('./src/browser');
const { fillForm, openDetalle } = require('./src/form');
const { closeModalIfExists } = require('./src/navigation');

(async () => {
  const logDir = path.resolve(__dirname, 'src/logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

  if (!process.env.OJV_URL) {
    console.error('❌ OJV_URL no configurada en .env');
    process.exit(1);
  }

  const { browser, context, page } = await startBrowser(process.env.OJV_URL, { headless: false });

  try {
    console.log('🔍 Iniciando prueba de detección de iconos PDF...');
    
    await closeModalIfExists(page);
    
    // Establecer sesión de invitado si es necesario
    const currentUrl = page.url();
    if (currentUrl.includes('home/index.php')) {
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
      });
      await page.waitForTimeout(500);
      await page.goto(process.env.OJV_URL);
      await page.waitForLoadState('networkidle');
    }

    // Usar RIT de prueba: C-3030-2017
    const CONFIG = {
      rit: 'C-3030-2017',
      competencia: '3',
      corte: '90',
      tribunal: '276',
      tipoCausa: 'C',
      rol: '3030',
      anio: '2017'
    };

    console.log(`📋 Buscando RIT: ${CONFIG.rit}`);
    await fillForm(page, CONFIG);
    await page.waitForTimeout(2000);
    
    await openDetalle(page);
    await page.waitForSelector('table.table.table-bordered.table-striped.table-hover tbody tr', { timeout: 15000 });

    console.log('📸 Capturando pantallazo de la tabla...');
    await page.screenshot({ 
      path: path.join(logDir, 'iconos-pdf-tabla.png'), 
      fullPage: false 
    });

    // Extraer información detallada de los iconos PDF
    const infoIconos = await page.evaluate(() => {
      const rows = document.querySelectorAll('table.table.table-bordered.table-striped.table-hover tbody tr');
      const info = [];
      
      rows.forEach((tr, rowIndex) => {
        const cells = tr.querySelectorAll('td');
        if (cells.length < 2) return;
        
        const folio = cells[0]?.innerText.trim() || '';
        const docCell = cells[1]; // Columna "Doc."
        
        if (!docCell) return;
        
        const links = docCell.querySelectorAll('a');
        links.forEach((a, linkIndex) => {
          const img = a.querySelector('img');
          if (!img) return;
          
          const imgSrc = img.src || '';
          const imgAlt = img.alt || '';
          const imgClass = img.className || '';
          const title = a.title || '';
          const href = a.href || '';
          
          // Determinar si es azul o rojo
          const isAnexo = imgSrc.toLowerCase().includes('pdf_old') || 
                         imgSrc.toLowerCase().includes('rojo') || 
                         imgSrc.toLowerCase().includes('anexo');
          
          info.push({
            folio,
            rowIndex,
            linkIndex,
            imgSrc,
            imgAlt,
            imgClass,
            title,
            href: href.substring(0, 100), // Limitar longitud
            tipo: isAnexo ? 'rojo' : 'azul',
            descripcion: isAnexo ? 'Rojo (Corte)' : 'Azul (Abogados)'
          });
        });
      });
      
      return info;
    });

    // Guardar información
    const infoPath = path.join(logDir, 'iconos-pdf-info.json');
    fs.writeFileSync(infoPath, JSON.stringify(infoIconos, null, 2));
    
    console.log('\n📊 RESUMEN DE ICONOS PDF:');
    console.log('='.repeat(60));
    infoIconos.forEach(info => {
      console.log(`\n📄 Folio ${info.folio}, Link ${info.linkIndex}:`);
      console.log(`   Tipo: ${info.descripcion}`);
      console.log(`   img src: ${info.imgSrc}`);
      console.log(`   img alt: ${info.imgAlt}`);
      console.log(`   title: ${info.title}`);
    });
    
    console.log('\n✅ Información guardada en:');
    console.log(`   - Pantallazo: ${path.join(logDir, 'iconos-pdf-tabla.png')}`);
    console.log(`   - JSON: ${infoPath}`);
    
    console.log('\n⏸️  Manteniendo navegador abierto por 30 segundos para revisión...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ 
      path: path.join(logDir, `error-iconos-${Date.now()}.png`), 
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
})();
