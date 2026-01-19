require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

/**
 * Script para extraer todas las opciones de IDs disponibles en el formulario del PJUD
 * Extrae: competencia, corte, tribunal, tipoCausa
 */

(async () => {
  console.log('🔍 Iniciando extracción de opciones del PJUD...\n');

  // Verificar OJV_URL
  if (!process.env.OJV_URL) {
    console.error('❌ ERROR: No se encontró OJV_URL en .env');
    console.log('💡 Crea un archivo .env con:');
    console.log('   OJV_URL=https://oficinajudicialvirtual.pjud.cl/indexN.php');
    process.exit(1);
  }

  const browser = await chromium.launch({ 
    headless: false, // Visible para debugging
    slowMo: 100 // Delay entre acciones
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    console.log('🌐 Navegando a:', process.env.OJV_URL);
    await page.goto(process.env.OJV_URL, { 
      waitUntil: 'networkidle', 
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

    // Navegar a "Consulta causas"
    console.log('\n🖱️ Navegando a "Consulta causas"...');
    const selectors = [
      'text=Consulta causas',
      'a:has-text("Consulta causas")',
      'a[href*="consulta"]'
    ];

    let clicked = false;
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }),
          page.click(selector)
        ]);
        clicked = true;
        break;
      } catch (e) {
        continue;
      }
    }

    if (!clicked) {
      throw new Error('No se pudo encontrar el enlace "Consulta causas"');
    }

    await page.waitForTimeout(2000);
    console.log('✅ En página de consulta de causas');

    // Esperar a que el formulario esté disponible
    await page.waitForSelector('#competencia', { timeout: 20000 });
    console.log('✅ Formulario disponible\n');

    // ============================================
    // 1. EXTRAER COMPETENCIAS
    // ============================================
    console.log('📋 Extrayendo Competencias...');
    const competencias = await page.evaluate(() => {
      const select = document.querySelector('#competencia');
      if (!select) return [];
      
      return Array.from(select.options).map(opt => ({
        value: opt.value,
        text: opt.text.trim(),
        disabled: opt.disabled
      })).filter(opt => opt.value && opt.value !== '0' && !opt.disabled);
    });

    console.log(`   ✅ Encontradas ${competencias.length} competencias`);
    competencias.forEach(c => console.log(`      - ${c.value}: ${c.text}`));

    // ============================================
    // 2. EXTRAER CORTES (para cada competencia)
    // ============================================
    console.log('\n📋 Extrayendo Cortes por Competencia...');
    const opcionesCompletas = [];

    for (const competencia of competencias) {
      console.log(`\n   🔍 Procesando Competencia: ${competencia.value} - ${competencia.text}`);
      
      // Seleccionar competencia
      await page.selectOption('#competencia', competencia.value);
      await page.waitForTimeout(1500); // Esperar a que se carguen las opciones

      // Esperar a que el campo corte se habilite
      try {
        await page.waitForFunction(
          () => {
            const corteSelect = document.querySelector('#conCorte');
            return corteSelect && !corteSelect.disabled && corteSelect.options.length > 1;
          },
          { timeout: 10000 }
        );
      } catch (e) {
        console.log(`      ⚠️ Campo Corte no se habilitó para competencia ${competencia.value}`);
        opcionesCompletas.push({
          competencia: competencia,
          cortes: []
        });
        continue;
      }

      // Extraer cortes
      const cortes = await page.evaluate(() => {
        const select = document.querySelector('#conCorte');
        if (!select) return [];
        
        return Array.from(select.options).map(opt => ({
          value: opt.value,
          text: opt.text.trim(),
          disabled: opt.disabled
        })).filter(opt => opt.value && opt.value !== '0' && !opt.disabled);
      });

      console.log(`      ✅ Encontradas ${cortes.length} cortes`);
      cortes.forEach(c => console.log(`         - ${c.value}: ${c.text}`));

      // ============================================
      // 3. EXTRAER TRIBUNALES (para cada corte)
      // ============================================
      const cortesConTribunales = [];

      for (const corte of cortes) {
        console.log(`\n      🔍 Procesando Corte: ${corte.value} - ${corte.text}`);
        
        // Seleccionar corte
        await page.selectOption('#conCorte', corte.value);
        await page.waitForTimeout(1500);

        // Esperar a que el campo tribunal se habilite
        try {
          await page.waitForFunction(
            () => {
              const tribunalSelect = document.querySelector('#conTribunal');
              return tribunalSelect && !tribunalSelect.disabled && tribunalSelect.options.length > 1;
            },
            { timeout: 10000 }
          );
        } catch (e) {
          console.log(`         ⚠️ Campo Tribunal no se habilitó para corte ${corte.value}`);
          cortesConTribunales.push({
            corte: corte,
            tribunales: []
          });
          continue;
        }

        // Extraer tribunales
        const tribunales = await page.evaluate(() => {
          const select = document.querySelector('#conTribunal');
          if (!select) return [];
          
          return Array.from(select.options).map(opt => ({
            value: opt.value,
            text: opt.text.trim(),
            disabled: opt.disabled
          })).filter(opt => opt.value && opt.value !== '0' && !opt.disabled);
        });

        console.log(`         ✅ Encontrados ${tribunales.length} tribunales`);
        tribunales.forEach(t => console.log(`            - ${t.value}: ${t.text}`));

        cortesConTribunales.push({
          corte: corte,
          tribunales: tribunales
        });
      }

      opcionesCompletas.push({
        competencia: competencia,
        cortes: cortesConTribunales
      });
    }

    // ============================================
    // 4. EXTRAER TIPOS DE CAUSA
    // ============================================
    console.log('\n📋 Extrayendo Tipos de Causa...');
    
    // Seleccionar primera competencia para habilitar tipo de causa
    if (competencias.length > 0) {
      await page.selectOption('#competencia', competencias[0].value);
      await page.waitForTimeout(1500);
      
      // Si hay corte, seleccionar el primero
      if (opcionesCompletas[0]?.cortes?.length > 0) {
        const primerCorte = opcionesCompletas[0].cortes[0].corte;
        await page.selectOption('#conCorte', primerCorte.value);
        await page.waitForTimeout(1500);
      }
    }

    // Esperar a que tipo de causa se habilite
    try {
      await page.waitForFunction(
        () => {
          const tipoCausaSelect = document.querySelector('#conTipoCausa');
          return tipoCausaSelect && !tipoCausaSelect.disabled && tipoCausaSelect.options.length > 1;
        },
        { timeout: 10000 }
      );
    } catch (e) {
      console.log('   ⚠️ Campo Tipo Causa no se habilitó');
    }

    const tiposCausa = await page.evaluate(() => {
      const select = document.querySelector('#conTipoCausa');
      if (!select) return [];
      
      return Array.from(select.options).map(opt => ({
        value: opt.value,
        text: opt.text.trim(),
        disabled: opt.disabled
      })).filter(opt => opt.value && opt.value !== '0' && !opt.disabled);
    });

    console.log(`   ✅ Encontrados ${tiposCausa.length} tipos de causa`);
    tiposCausa.forEach(t => console.log(`      - ${t.value}: ${t.text}`));

    // ============================================
    // 5. GUARDAR RESULTADOS
    // ============================================
    const resultado = {
      fecha_extraccion: new Date().toISOString(),
      url: process.env.OJV_URL,
      competencias: competencias,
      opciones_por_competencia: opcionesCompletas,
      tipos_causa: tiposCausa,
      resumen: {
        total_competencias: competencias.length,
        total_tipos_causa: tiposCausa.length,
        total_cortes: opcionesCompletas.reduce((sum, c) => sum + c.cortes.length, 0),
        total_tribunales: opcionesCompletas.reduce((sum, c) => 
          sum + c.cortes.reduce((s, corte) => s + corte.tribunales.length, 0), 0
        )
      }
    };

    const outputPath = path.resolve(__dirname, 'outputs/opciones_pjud.json');
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(resultado, null, 2), 'utf-8');
    console.log(`\n✅ Resultados guardados en: ${outputPath}`);

    // También crear un archivo más simple con solo los IDs
    const idsSimples = {
      competencias: competencias.map(c => ({ id: c.value, nombre: c.text })),
      tipos_causa: tiposCausa.map(t => ({ id: t.value, nombre: t.text })),
      cortes: opcionesCompletas.flatMap(comp => 
        comp.cortes.map(c => ({ 
          id: c.corte.value, 
          nombre: c.corte.text,
          competencia_id: comp.competencia.value
        }))
      ),
      tribunales: opcionesCompletas.flatMap(comp => 
        comp.cortes.flatMap(corte => 
          corte.tribunales.map(t => ({
            id: t.value,
            nombre: t.text,
            corte_id: corte.corte.value,
            competencia_id: comp.competencia.value
          }))
        )
      )
    };

    const idsPath = path.resolve(__dirname, 'outputs/ids_pjud.json');
    fs.writeFileSync(idsPath, JSON.stringify(idsSimples, null, 2), 'utf-8');
    console.log(`✅ IDs simples guardados en: ${idsPath}`);

    console.log('\n📊 Resumen:');
    console.log(`   - Competencias: ${resultado.resumen.total_competencias}`);
    console.log(`   - Cortes: ${resultado.resumen.total_cortes}`);
    console.log(`   - Tribunales: ${resultado.resumen.total_tribunales}`);
    console.log(`   - Tipos de Causa: ${resultado.resumen.total_tipos_causa}`);

    console.log('\n✅ Extracción completada exitosamente!');
    console.log('\n⏸️ Presiona Enter para cerrar el navegador...');
    await page.pause();

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await page.screenshot({ 
      path: path.resolve(__dirname, `logs/error_extraccion_${Date.now()}.png`), 
      fullPage: true 
    });
    throw error;
  } finally {
    await browser.close();
  }
})();


