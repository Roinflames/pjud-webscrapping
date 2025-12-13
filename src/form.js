const { goToConsultaCausas } = require('./navigation');

// Función para resetear el formulario (volver a estado inicial)
async function resetForm(page) {
  try {
    // Verificar si ya estamos en el formulario
    const currentUrl = page.url();
    const isOnFormPage = currentUrl.includes('consulta') || currentUrl.includes('causa') || 
                         await page.$('#competencia') !== null;
    
    if (!isOnFormPage) {
      console.log('🔄 Volviendo al formulario...');
      await goToConsultaCausas(page);
    } else {
      // Ya estamos en el formulario, solo cerrar modales si existen
      try {
        // Cerrar modales con ESC
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        
        // Intentar cerrar botones de cerrar modal
        const closeSelectors = [
          'button.close',
          '.modal-header button',
          '[data-dismiss="modal"]',
          'button[aria-label="Close"]'
        ];
        
        for (const selector of closeSelectors) {
          try {
            const closeBtn = await page.$(selector);
            if (closeBtn && await closeBtn.isVisible()) {
              await closeBtn.click();
              await page.waitForTimeout(300);
            }
          } catch (e) {
            continue;
          }
        }
      } catch (e) {
        // No hay modal, continuar
      }
    }
    
    // Esperar a que el formulario esté disponible
    await page.waitForSelector('#competencia', { timeout: 20000 });
    
    // Limpiar campos - solo hacer click para enfocar, no resetear valores
    // (reseteamos solo si es necesario, pero normalmente solo necesitamos que esté visible)
    await page.waitForTimeout(300);
    
  } catch (error) {
    console.warn('⚠️ No se pudo resetear formulario:', error.message);
    // No lanzar error, solo continuar
  }
}

async function fillForm(page, CONFIG) {
  console.log('📝 Llenando formulario...');

  try {
    // Cerrar modales si existen (sin navegar si ya estamos en el formulario)
    try {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    } catch (e) {
      // Ignorar si no hay modal
    }
    
    // Verificar que estamos en el formulario
    let hasForm = false;
    try {
      const competencia = await page.$('#competencia');
      hasForm = competencia !== null && await competencia.isVisible();
    } catch (e) {
      hasForm = false;
    }
    
    if (!hasForm) {
      // Solo navegar si realmente no estamos en el formulario
      console.log('🔄 No estamos en el formulario, navegando...');
      await resetForm(page);
    } else {
      // Ya estamos en el formulario, solo cerrar modales
      console.log('✅ Ya estamos en el formulario, cerrando modales...');
      try {
        // Cerrar modales múltiples veces para asegurar
        for (let i = 0; i < 3; i++) {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(200);
        }
        
        // Intentar cerrar botones de cerrar modal
        const closeSelectors = ['button.close', '.modal-header button', '[data-dismiss="modal"]'];
        for (const selector of closeSelectors) {
          try {
            const btn = await page.$(selector);
            if (btn && await btn.isVisible()) {
              await btn.click();
              await page.waitForTimeout(200);
            }
          } catch (e) {
            continue;
          }
        }
      } catch (e) {
        // Ignorar si no hay modal
      }
    }
    
    // Screenshot antes de llenar formulario
    await page.screenshot({ path: 'debug_06_antes_formulario.png', fullPage: false });
    console.log('📸 Screenshot: debug_06_antes_formulario.png');
    
    // Esperar a que el formulario esté disponible
    console.log('⏳ Esperando formulario...');
    await page.waitForSelector('#competencia', { timeout: 20000 });
    console.log('✅ Formulario disponible');
    
    // Delay humano antes de empezar a escribir (500-1200ms)
    await page.waitForTimeout(500 + Math.random() * 700);

    // Llenar campos como humano (con delays variables)
    // El formulario tiene dependencias: competencia → corte → tribunal → tipoCausa
    
    // 1. Seleccionar competencia (SIEMPRE Civil = 3, todas las causas con RIT son civiles)
    const competencia = CONFIG.competencia || '3'; // Default a Civil
    console.log(`📋 Competencia: ${competencia} (Civil - todas las causas con RIT son civiles)`);
    await page.selectOption('#competencia', competencia);
    await page.waitForTimeout(500 + Math.random() * 500); // Esperar a que se carguen opciones
    
    // 2. Esperar a que se habilite Corte y seleccionarlo (opcional)
    const corte = CONFIG.corte || '90'; // Default
    console.log(`📋 Corte: ${corte}`);
    try {
      // Esperar a que el campo se habilite (no esté disabled)
      await page.waitForFunction(
        () => {
          const corteSelect = document.querySelector('#conCorte');
          return corteSelect && !corteSelect.disabled && corteSelect.options.length > 1;
        },
        { timeout: 15000 }
      );
      console.log('✅ Campo Corte habilitado');
      
      await page.waitForTimeout(1000 + Math.random() * 1000);
      
      // Verificar que la opción existe antes de seleccionar
      const corteExists = await page.evaluate((corteValue) => {
        const select = document.querySelector('#conCorte');
        if (!select) return false;
        const options = Array.from(select.options);
        return options.some(opt => opt.value === corteValue || opt.value === String(corteValue));
      }, corte);
      
      if (corteExists) {
        await page.selectOption('#conCorte', corte);
        console.log('✅ Corte seleccionado');
      } else {
        console.warn(`⚠️ Corte ${corte} no encontrado, continuando sin corte...`);
      }
    } catch (error) {
      console.warn('⚠️ No se pudo seleccionar corte, continuando sin corte...');
    }
    await page.waitForTimeout(500 + Math.random() * 500);

    // 3. Esperar a que se habilite Tribunal y seleccionarlo (OPCIONAL - puede ser NULL)
    if (CONFIG.tribunal && CONFIG.tribunal !== 'NULL' && CONFIG.tribunal.trim() !== '') {
      console.log(`📋 Tribunal: ${CONFIG.tribunal}`);
      try {
        await page.waitForFunction(
          () => {
            const tribunal = document.querySelector('#conTribunal');
            return tribunal && !tribunal.disabled && tribunal.options.length > 1;
          },
          { timeout: 15000 }
        );
        console.log('✅ Campo Tribunal habilitado');
        
        await page.waitForTimeout(1000 + Math.random() * 1000);
        
        // Verificar que la opción existe antes de seleccionar
        const tribunalExists = await page.evaluate((tribunalValue) => {
          const select = document.querySelector('#conTribunal');
          if (!select) return false;
          const options = Array.from(select.options);
          return options.some(opt => opt.value === tribunalValue || opt.value === String(tribunalValue));
        }, CONFIG.tribunal);
        
        if (tribunalExists) {
          await page.selectOption('#conTribunal', CONFIG.tribunal);
          console.log('✅ Tribunal seleccionado');
        } else {
          console.warn(`⚠️ Tribunal ${CONFIG.tribunal} no encontrado, continuando sin tribunal...`);
        }
      } catch (error) {
        console.warn('⚠️ No se pudo seleccionar tribunal, continuando sin tribunal...');
      }
      await page.waitForTimeout(500 + Math.random() * 500);
    } else {
      console.log('📋 Tribunal: No especificado (opcional, continuando sin tribunal)');
    }

    // 4. Esperar a que se habilite Tipo Causa y seleccionarlo
    console.log(`📋 Tipo Causa: ${CONFIG.tipoCausa}`);
    try {
      await page.waitForFunction(
        () => {
          const tipoCausa = document.querySelector('#conTipoCausa');
          return tipoCausa && !tipoCausa.disabled && tipoCausa.options.length > 1;
        },
        { timeout: 15000 }
      );
      console.log('✅ Campo Tipo Causa habilitado');
    } catch (error) {
      console.warn('⚠️ Campo Tipo Causa no se habilitó automáticamente, intentando forzar...');
      await page.evaluate(() => {
        const tipoCausa = document.querySelector('#conTipoCausa');
        if (tipoCausa) tipoCausa.removeAttribute('disabled');
      });
    }
    await page.waitForTimeout(500 + Math.random() * 500); // Esperar a que se carguen opciones
    await page.selectOption('#conTipoCausa', CONFIG.tipoCausa);
    await page.waitForTimeout(500 + Math.random() * 500);

    // Extraer rol y año del RIT (formato: "C-13786-2018" o similar)
    let rol = '';
    let año = '';
    
    if (CONFIG.rit) {
      const parts = CONFIG.rit.split('-');
      if (parts.length >= 3) {
        rol = parts[1]; // Segunda parte
        año = parts[2]; // Tercera parte
      } else if (parts.length === 2) {
        rol = parts[1];
      }
    }
    
    console.log(`📋 Rol: ${rol || 'N/A'}, Año: ${año || 'N/A'}`);
    
    // Escribir como humano (con delay de escritura)
    if (rol) {
      await page.fill('#conRolCausa', rol);
      await page.waitForTimeout(400 + Math.random() * 600); // 400-1000ms
    }
    
    if (año) {
      await page.fill('#conEraCausa', año);
      await page.waitForTimeout(400 + Math.random() * 600);
    }

    // Screenshot después de llenar campos
    await page.screenshot({ path: 'debug_07_formulario_llenado.png', fullPage: false });
    console.log('📸 Screenshot: debug_07_formulario_llenado.png');

    console.log("🔍 Buscando...");
    
    // Buscar el botón de varias formas
    const buttonSelectors = [
      'input[value="Buscar"]',
      'button:has-text("Buscar")',
      'input[type="submit"]',
      'button[type="submit"]'
    ];
    
    let buttonClicked = false;
    for (const selector of buttonSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        await page.click(selector);
        buttonClicked = true;
        console.log(`✅ Botón encontrado y clickeado: ${selector}`);
        break;
      } catch (error) {
        continue;
      }
    }
    
    if (!buttonClicked) {
      await page.screenshot({ path: 'debug_error_boton_buscar.png', fullPage: true });
      throw new Error('No se pudo encontrar el botón "Buscar"');
    }
    
    // Esperar resultado como humano (2-3 segundos)
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {
      console.warn('⚠️ Timeout esperando resultado de búsqueda');
    });
    await page.waitForTimeout(2000 + Math.random() * 1000); // 2-3 segundos
    
    // Screenshot después de buscar
    await page.screenshot({ path: 'debug_08_despues_buscar.png', fullPage: false });
    console.log('📸 Screenshot: debug_08_despues_buscar.png');
    
    console.log('✅ Formulario enviado');
    
  } catch (error) {
    console.error('❌ Error llenando formulario:', error.message);
    await page.screenshot({ path: 'debug_error_formulario.png', fullPage: true });
    throw error;
  }
}

async function openDetalle(page) {
  try {
    console.log("🔍 Buscando enlace 'Detalle de la causa'...");
    
    // Screenshot antes de buscar el enlace
    await page.screenshot({ path: 'debug_09_antes_detalle.png', fullPage: false });
    console.log('📸 Screenshot: debug_09_antes_detalle.png');
    
    // Esperar a que aparezca el enlace
    await page.waitForSelector('a[title="Detalle de la causa"]', { timeout: 20000 });
    console.log("✅ Enlace encontrado");

    console.log("🖱️ Abriendo detalle...");

    // Esperar a que el modal aparezca después del click
    await Promise.all([
      page.waitForSelector('#modalDetalleCivil, #modalDetalleLaboral', { timeout: 15000 }),
      page.click('a[title="Detalle de la causa"]'),
    ]);

    // Delay humano después de abrir modal (800-1500ms)
    await page.waitForTimeout(800 + Math.random() * 700);
    
    // Screenshot después de abrir detalle
    await page.screenshot({ path: 'debug_10_detalle_abierto.png', fullPage: false });
    console.log('📸 Screenshot: debug_10_detalle_abierto.png');
    
    console.log("✅ Detalle cargado.");
  } catch (error) {
    console.error('❌ Error abriendo detalle:', error.message);
    await page.screenshot({ path: 'debug_error_detalle.png', fullPage: true });
    throw error;
  }
}

module.exports = { fillForm, openDetalle, resetForm };
