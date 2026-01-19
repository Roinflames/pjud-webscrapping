// Script de debugging paso a paso
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { startBrowser } = require('./browser');
const { loadConfig } = require('./config');
const { closeModalIfExists, goToConsultaCausas } = require('./navigation');
const { fillForm, openDetalle } = require('./form');

(async () => {
  console.log('🔍 MODO DEBUG - Paso a paso\n');
  
  // Verificar .env
  if (!process.env.OJV_URL) {
    console.error('❌ No hay OJV_URL en .env');
    process.exit(1);
  }
  
  // Verificar config
  const configPath = path.resolve(__dirname, 'config/pjud_config.json');
  if (!fs.existsSync(configPath)) {
    console.error(`❌ No se encontró: ${configPath}`);
    process.exit(1);
  }
  
  const CONFIG = require('./config').loadConfig();
  console.log('📋 Configuración cargada:', JSON.stringify(CONFIG, null, 2));
  
  const { browser, context, page } = await startBrowser(process.env.OJV_URL);
  
  try {
    console.log('\n✅ PASO 1: Navegador iniciado');
    console.log('   URL:', page.url());
    console.log('   Título:', await page.title());
    
    // Verificar contenido
    const bodyContent = await page.evaluate(() => document.body.innerText);
    console.log('   Contenido:', bodyContent ? '✅ Tiene contenido' : '❌ Vacío');
    
    console.log('\n⏸️ Presiona Enter para continuar al siguiente paso...');
    await page.pause();
    
    // Paso 2: Cerrar modal
    console.log('\n✅ PASO 2: Cerrando modal...');
    await closeModalIfExists(page);
    console.log('   Modal procesado');
    
    console.log('\n⏸️ Presiona Enter para continuar...');
    await page.pause();
    
    // Paso 3: Navegar a Consulta causas
    console.log('\n✅ PASO 3: Navegando a "Consulta causas"...');
    await goToConsultaCausas(page);
    console.log('   URL actual:', page.url());
    
    console.log('\n⏸️ Presiona Enter para continuar...');
    await page.pause();
    
    // Paso 4: Llenar formulario
    console.log('\n✅ PASO 4: Llenando formulario...');
    await fillForm(page, CONFIG);
    console.log('   Formulario enviado');
    
    console.log('\n⏸️ Presiona Enter para continuar...');
    await page.pause();
    
    // Paso 5: Abrir detalle
    console.log('\n✅ PASO 5: Abriendo detalle...');
    await openDetalle(page);
    console.log('   Detalle abierto');
    
    console.log('\n✅ Todos los pasos completados exitosamente');
    console.log('\n⏸️ Presiona Enter para cerrar...');
    await page.pause();
    
  } catch (error) {
    console.error('\n❌ ERROR en:', error.message);
    console.error('   Stack:', error.stack);
    
    const debugDir = path.resolve(__dirname, 'logs');
    if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
    
    await page.screenshot({ 
      path: path.join(debugDir, `debug_error_${Date.now()}.png`), 
      fullPage: true 
    });
    console.log('   Screenshot guardado en logs/');
  } finally {
    await browser.close();
  }
})();


