require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

/**
 * Script para extraer todos los tribunales usando peticiones HTTP directas
 * Más rápido que navegar con Playwright
 */

// IDs de cortes proporcionados por el usuario (sin "Todos")
const CORTES = [
  { id: '10', nombre: 'C.A. de Arica' },
  { id: '11', nombre: 'C.A. de Iquique' },
  { id: '15', nombre: 'C.A. de Antofagasta' },
  { id: '20', nombre: 'C.A. de Copiapó' },
  { id: '25', nombre: 'C.A. de La Serena' },
  { id: '30', nombre: 'C.A. de Valparaíso' },
  { id: '35', nombre: 'C.A. de Rancagua' },
  { id: '40', nombre: 'C.A. de Talca' },
  { id: '45', nombre: 'C.A. de Chillan' },
  { id: '46', nombre: 'C.A. de Concepción' },
  { id: '50', nombre: 'C.A. de Temuco' },
  { id: '55', nombre: 'C.A. de Valdivia' },
  { id: '56', nombre: 'C.A. de Puerto Montt' },
  { id: '60', nombre: 'C.A. de Coyhaique' },
  { id: '61', nombre: 'C.A. de Punta Arenas' },
  { id: '90', nombre: 'C.A. de Santiago' },
  { id: '91', nombre: 'C.A. de San Miguel' }
];

// Competencias
const COMPETENCIAS = [
  { id: '1', nombre: 'Corte Suprema' },
  { id: '2', nombre: 'Corte Apelaciones' },
  { id: '3', nombre: 'Civil' },
  { id: '4', nombre: 'Laboral' },
  { id: '5', nombre: 'Penal' },
  { id: '6', nombre: 'Cobranza' },
  { id: '7', nombre: 'Familia' }
];

(async () => {
  console.log('🔍 Extrayendo tribunales mediante peticiones HTTP...\n');

  // URL directa a indexN.php (donde está el formulario)
  const PJUD_URL = 'https://oficinajudicialvirtual.pjud.cl/indexN.php';

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 50
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Interceptar respuestas para capturar datos AJAX
  const tribunalesData = new Map();

  page.on('response', async response => {
    const url = response.url();
    
    // Buscar respuestas que contengan datos de tribunales
    if (url.includes('tribunal') || url.includes('ajax') || 
        (response.status() === 200 && url.includes('indexN.php'))) {
      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('json') || contentType.includes('html')) {
          const text = await response.text();
          
          // Buscar datos JSON en la respuesta
          if (text.includes('tribunal') || text.includes('option')) {
            // Guardar para análisis posterior
            const urlKey = new URL(url).searchParams.toString();
            if (urlKey) {
              tribunalesData.set(url, text.substring(0, 1000));
            }
          }
        }
      } catch (e) {
        // Ignorar errores al leer respuesta
      }
    }
  });

  try {
    // Paso 1: Ir a indexN.php (puede redirigir a home/index.php)
    console.log('🌐 Navegando a indexN.php...');
    console.log('📍 URL:', PJUD_URL);
    await page.goto(PJUD_URL, { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });

    // Cerrar modal si existe
    try {
      await page.waitForSelector('#close-modal', { timeout: 3000 });
      await page.click('#close-modal');
      await page.waitForTimeout(500);
      console.log('✅ Modal cerrado');
    } catch (e) {
      console.log('ℹ️ No se encontró modal');
    }

    // Paso 2: Verificar URL actual - puede haber redirección a home/index.php
    const currentUrl = page.url();
    console.log('📍 URL actual después de cargar:', currentUrl);

    // Paso 3: Si estamos en home/index.php, establecer sesión de invitado
    if (currentUrl.includes('home/index.php')) {
      console.log('🔐 Estableciendo sesión de invitado para "Consulta causas"...');
      
      // Ejecutar la función JavaScript que establece la sesión
      await page.evaluate(async () => {
        const accesoConsultaCausas = 'CC';
        const response = await fetch('../includes/sesion-invitado.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `nombreAcceso=${accesoConsultaCausas}`
        });
        
        // Establecer localStorage y sessionStorage
        localStorage.setItem('InitSitioOld', '0');
        localStorage.setItem('InitSitioNew', '1');
        localStorage.setItem('logged-in', 'true');
        sessionStorage.setItem('logged-in', 'true');
        
        return response.ok;
      });
      
      await page.waitForTimeout(500);
      
      // Paso 4: Navegar a indexN.php después de establecer la sesión
      console.log('🔄 Navegando a indexN.php después de establecer sesión...');
      await page.goto('https://oficinajudicialvirtual.pjud.cl/indexN.php', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      await page.waitForTimeout(1000);
      console.log('📍 URL después de establecer sesión:', page.url());
    } else if (!currentUrl.includes('indexN.php')) {
      // Si estamos en otra URL, navegar directamente
      console.log('🔄 Navegando directamente a indexN.php...');
      await page.goto('https://oficinajudicialvirtual.pjud.cl/indexN.php', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      await page.waitForTimeout(1000);
      console.log('📍 URL después de navegación:', page.url());
    }

    // Paso 5: Esperar a que el formulario esté disponible
    console.log('\n⏳ Esperando formulario de consulta...');
    await page.waitForSelector('#competencia', { timeout: 20000 });
    console.log('✅ Formulario disponible');
    console.log('📍 URL final:', page.url());

    const resultado = {
      fecha_extraccion: new Date().toISOString(),
      url: PJUD_URL,
      competencias: COMPETENCIAS,
      cortes: [],
      resumen: {
        total_competencias: COMPETENCIAS.length,
        total_cortes: CORTES.length,
        total_tribunales: 0
      }
    };

    // Procesar cada competencia
    // IMPORTANTE: Para cada competencia, procesamos TODAS las cortes
    // y para cada corte, extraemos los tribunales que aparecen en #conTribunal
    for (const competencia of COMPETENCIAS) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📋 COMPETENCIA: ${competencia.id} - ${competencia.nombre}`);
      console.log(`   Procesando ${CORTES.length} cortes...`);
      console.log(`${'='.repeat(60)}`);
      
      // Seleccionar competencia (esto habilita el selector de cortes)
      await page.selectOption('#competencia', competencia.id);
      await page.waitForTimeout(2000);

      // Esperar a que se carguen las cortes
      try {
        await page.waitForFunction(
          () => {
            const corteSelect = document.querySelector('#conCorte');
            return corteSelect && !corteSelect.disabled && corteSelect.options.length > 1;
          },
          { timeout: 10000 }
        );
      } catch (e) {
        console.log(`   ⚠️ No se cargaron cortes para competencia ${competencia.id}`);
        continue;
      }

      const cortesConTribunales = [];

      // Procesar cada corte - IMPORTANTE: Cada corte muestra distintos tribunales
      for (const corte of CORTES) {
        console.log(`\n   🔍 Procesando Corte: ${corte.id} - ${corte.nombre}`);
        console.log(`      ⏳ Seleccionando corte y esperando que aparezcan los tribunales en #conTribunal...`);

        try {
          // Paso 1: Seleccionar la corte
          await page.selectOption('#conCorte', corte.id);
          await page.waitForTimeout(1500); // Esperar a que se active el cambio

          // Paso 2: Esperar a que se carguen los tribunales en #conTribunal para esta corte
          try {
            await page.waitForFunction(
              () => {
                const tribunalSelect = document.querySelector('#conTribunal');
                return tribunalSelect && 
                       !tribunalSelect.disabled && 
                       tribunalSelect.options.length > 1 &&
                       Array.from(tribunalSelect.options).some(opt => opt.value !== '0');
              },
              { timeout: 15000 }
            );
            console.log(`      ✅ Campo #conTribunal habilitado`);
          } catch (e) {
            console.log(`      ⚠️ No se cargaron tribunales para corte ${corte.id} - ${corte.nombre}`);
            console.log(`      ℹ️ Esta corte puede no tener tribunales para competencia ${competencia.nombre}`);
            cortesConTribunales.push({
              corte: corte,
              tribunales: [],
              nota: 'No se encontraron tribunales para esta combinación'
            });
            continue;
          }

          // Paso 3: Extraer todos los tribunales del dropdown #conTribunal
          const tribunales = await page.evaluate(() => {
            const select = document.querySelector('#conTribunal');
            if (!select) return [];
            
            return Array.from(select.options)
              .map(opt => ({
                value: opt.value,
                text: opt.text.trim(),
                disabled: opt.disabled
              }))
              .filter(opt => opt.value && opt.value !== '0' && !opt.disabled);
          });

          console.log(`      ✅ Encontrados ${tribunales.length} tribunales para esta corte`);
          
          if (tribunales.length > 0) {
            // Mostrar primeros 5 tribunales como ejemplo
            console.log(`      📋 Ejemplos de tribunales encontrados:`);
            tribunales.slice(0, 5).forEach(t => {
              console.log(`         - ID: ${t.value} | ${t.text}`);
            });
            if (tribunales.length > 5) {
              console.log(`         ... y ${tribunales.length - 5} tribunales más`);
            }
          } else {
            console.log(`      ⚠️ Esta corte no tiene tribunales disponibles`);
          }

          cortesConTribunales.push({
            corte: corte,
            tribunales: tribunales,
            total_tribunales: tribunales.length
          });

          resultado.resumen.total_tribunales += tribunales.length;

        } catch (error) {
          console.log(`      ❌ Error procesando corte ${corte.id}: ${error.message}`);
          cortesConTribunales.push({
            corte: corte,
            tribunales: [],
            error: error.message
          });
        }

        // Delay entre cortes para no saturar el servidor
        await page.waitForTimeout(800);
      }

      resultado.cortes.push({
        competencia: competencia,
        cortes: cortesConTribunales
      });
    }

    // Guardar resultados
    const outputPath = path.resolve(__dirname, 'outputs/tribunales_pjud_completo.json');
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(resultado, null, 2), 'utf-8');
    console.log(`\n✅ Resultados guardados en: ${outputPath}`);

    // Crear versión simplificada
    const idsSimples = {
      competencias: COMPETENCIAS,
      cortes: CORTES.filter(c => c.id !== '0'),
      tribunales: resultado.cortes.flatMap(comp => 
        comp.cortes.flatMap(corte => 
          corte.tribunales.map(t => ({
            id: t.value,
            nombre: t.text,
            corte_id: corte.corte.id,
            corte_nombre: corte.corte.nombre,
            competencia_id: comp.competencia.id,
            competencia_nombre: comp.competencia.nombre
          }))
        )
      )
    };

    const idsPath = path.resolve(__dirname, 'outputs/tribunales_pjud_ids.json');
    fs.writeFileSync(idsPath, JSON.stringify(idsSimples, null, 2), 'utf-8');
    console.log(`✅ IDs simplificados guardados en: ${idsPath}`);

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN FINAL');
    console.log('='.repeat(60));
    console.log(`   ✅ Competencias procesadas: ${resultado.resumen.total_competencias}`);
    console.log(`   ✅ Cortes procesadas: ${resultado.resumen.total_cortes}`);
    console.log(`   ✅ Total de tribunales extraídos: ${resultado.resumen.total_tribunales}`);
    console.log(`\n   📝 Nota: Cada corte tiene distintos tribunales según la competencia`);
    console.log('='.repeat(60));

    console.log('\n✅ Extracción completada!');
    console.log('\n⏸️ Presiona Enter para cerrar...');
    await page.pause();

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await page.screenshot({ 
      path: path.resolve(__dirname, `logs/error_tribunales_${Date.now()}.png`), 
      fullPage: true 
    });
    throw error;
  } finally {
    await browser.close();
  }
})();

