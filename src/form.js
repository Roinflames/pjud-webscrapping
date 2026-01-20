const { goToConsultaCausas } = require('./navigation');
const { detectCaptcha, checkIfBlocked } = require('./utils/captcha-detector');

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
    await page.waitForSelector('#competencia', { timeout: 30000 }); // Aumentado de 20s a 30s
    
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
    
    // Screenshot solo si no está en modo headless (deshabilitado en headless)
    // await page.screenshot({ path: 'debug_06_antes_formulario.png', fullPage: false });
    // console.log('📸 Screenshot: debug_06_antes_formulario.png');
    
    // Esperar a que el formulario esté disponible
    console.log('⏳ Esperando formulario...');
    await page.waitForSelector('#competencia', { timeout: 30000 }); // Aumentado de 20s a 30s
    console.log('✅ Formulario disponible');
    
    // Delay optimizado antes de empezar a escribir (200-500ms)
    await page.waitForTimeout(200 + Math.random() * 300);

    // Llenar campos como humano (con delays variables)
    // El formulario tiene dependencias: competencia → corte → tribunal → tipoCausa
    
    // 1. Seleccionar competencia (SIEMPRE Civil = 3, todas las causas con RIT son civiles)
    const competencia = CONFIG.competencia || '3'; // Default a Civil
    console.log(`📋 Competencia: ${competencia} (Civil - todas las causas con RIT son civiles)`);
    await page.selectOption('#competencia', competencia);
    await page.waitForTimeout(200 + Math.random() * 300); // Optimizado: reducido de 500-1000ms a 200-500ms
    
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
        { timeout: 20000 } // Aumentado de 15s a 20s para evitar timeouts
      );
      console.log('✅ Campo Corte habilitado');
      
      await page.waitForTimeout(300 + Math.random() * 400); // Optimizado: reducido de 1000-2000ms a 300-700ms
      
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
    await page.waitForTimeout(200 + Math.random() * 300); // Optimizado

    // 3. Tribunal: SIEMPRE omitido para optimizar velocidad
    // Todas las causas con RIT son civiles, tribunal es opcional y ralentiza el proceso
    console.log('📋 Tribunal: Omitido (optimización: siempre buscar sin tribunal)');
    // No esperamos ni seleccionamos tribunal - ahorra 1-3 segundos por causa

    // 4. Esperar a que se habilite Tipo Causa y seleccionarlo
    console.log(`📋 Tipo Causa: ${CONFIG.tipoCausa}`);
    try {
      await page.waitForFunction(
        () => {
          const tipoCausa = document.querySelector('#conTipoCausa');
          return tipoCausa && !tipoCausa.disabled && tipoCausa.options.length > 1;
        },
        { timeout: 20000 } // Aumentado de 15s a 20s para evitar timeouts
      );
      console.log('✅ Campo Tipo Causa habilitado');
    } catch (error) {
      console.warn('⚠️ Campo Tipo Causa no se habilitó automáticamente, intentando forzar...');
      await page.evaluate(() => {
        const tipoCausa = document.querySelector('#conTipoCausa');
        if (tipoCausa) tipoCausa.removeAttribute('disabled');
      });
    }
    await page.waitForTimeout(200 + Math.random() * 300); // Optimizado // Esperar a que se carguen opciones
    await page.selectOption('#conTipoCausa', CONFIG.tipoCausa);
    await page.waitForTimeout(200 + Math.random() * 300); // Optimizado

    // Extraer rol y año del RIT
    // Formatos posibles:
    // - "C-13786-2018" → rol: "13786", año: "2018" (3 partes)
    // - "16707-2019" → rol: "16707", año: "2019" (2 partes)
    let rol = '';
    let año = '';
    
    if (CONFIG.rit) {
      const parts = CONFIG.rit.split('-');
      if (parts.length >= 3) {
        // Formato: "C-13786-2018" (tipo-rol-año)
        rol = parts[1]; // Segunda parte es el rol
        año = parts[2]; // Tercera parte es el año
      } else if (parts.length === 2) {
        // Formato: "16707-2019" (rol-año)
        rol = parts[0]; // Primera parte es el rol
        año = parts[1]; // Segunda parte es el año
      }
    }
    
    console.log(`📋 Rol: ${rol || 'N/A'}, Año: ${año || 'N/A'}`);
    
    // Escribir como humano (con delay de escritura)
    if (rol) {
      await page.fill('#conRolCausa', rol);
      await page.waitForTimeout(150 + Math.random() * 250); // Optimizado: reducido de 400-1000ms a 150-400ms
    }
    
      if (año) {
      await page.fill('#conEraCausa', año);
      await page.waitForTimeout(150 + Math.random() * 250); // Optimizado: reducido de 400-1000ms a 150-400ms
    }

    // Screenshot deshabilitado en modo headless
    // await page.screenshot({ path: 'debug_07_formulario_llenado.png', fullPage: false });
    // console.log('📸 Screenshot: debug_07_formulario_llenado.png');

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
        await page.waitForSelector(selector, { timeout: 10000 }); // Aumentado de 5s a 10s
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
    
    // Verificar CAPTCHA antes de continuar (solo si está realmente bloqueando)
    const captchaCheck = await detectCaptcha(page);
    const blockCheck = await checkIfBlocked(page);
    
    if (captchaCheck.detected || blockCheck.blocked) {
      // Si es CAPTCHA activo o bloqueo real, notificar y detener (NO reintentar)
      if (captchaCheck.type === 'recaptcha-active' || blockCheck.blocked) {
        const errorType = captchaCheck.detected ? captchaCheck.type : blockCheck.reason;
        
        console.error('\n🚨 ============================================');
        console.error('🚨 BLOQUEO/CAPTCHA DETECTADO - DETENIENDO');
        console.error('🚨 ============================================');
        console.error(`\n❌ Tipo: ${errorType}`);
        console.error(`📋 Razón: ${blockCheck.blocked ? blockCheck.reason : captchaCheck.type}`);
        console.error('\n📝 ACCIÓN REQUERIDA:');
        console.error('   1. Espera 30-60 minutos antes de reintentar');
        console.error('   2. Considera usar una VPN o cambiar tu IP');
        console.error('   3. Reduce la velocidad de scraping si continúas');
        console.error('   4. Verifica manualmente en el navegador si el bloqueo persiste');
        console.error('\n⏸️  El proceso se ha detenido para evitar empeorar el bloqueo.');
        console.error('🚨 ============================================\n');
        
        // Guardar screenshot para diagnóstico
        const screenshotPath = `src/logs/bloqueo_${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
        console.error(`📸 Screenshot guardado: ${screenshotPath}`);
        
        throw new Error(`CAPTCHA/Bloqueo detectado - Deteniendo ejecución: ${errorType}`);
      } else {
        // Solo advertencia si no está realmente activo (solo script presente)
        console.warn(`⚠️ Script de reCAPTCHA detectado pero inactivo, continuando...`);
      }
    }
    
    // Esperar resultado (timeout aumentado para evitar fallos)
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {
      console.warn('⚠️ Timeout esperando resultado de búsqueda, continuando...');
    });
    await page.waitForTimeout(800 + Math.random() * 700); // Aumentado a 0.8-1.5s para dar tiempo a cargar
    
    // Verificar CAPTCHA después de la búsqueda - NOTIFICAR Y DETENER si hay bloqueo
    const captchaCheckAfter = await detectCaptcha(page);
    const blockCheckAfter = await checkIfBlocked(page);
    
    // Si hay bloqueo o CAPTCHA activo, notificar y detener (NO reintentar)
    if (blockCheckAfter.blocked || (captchaCheckAfter.detected && captchaCheckAfter.type === 'recaptcha-active')) {
      const errorType = blockCheckAfter.blocked ? blockCheckAfter.reason : captchaCheckAfter.type;
      
      console.error('\n🚨 ============================================');
      console.error('🚨 BLOQUEO/CAPTCHA DETECTADO DESPUÉS DE BÚSQUEDA');
      console.error('🚨 ============================================');
      console.error(`\n❌ Tipo: ${errorType}`);
      console.error(`📋 Ubicación: Después de buscar en el formulario`);
      console.error('\n📝 ACCIÓN REQUERIDA:');
      console.error('   1. Espera 30-60 minutos antes de reintentar');
      console.error('   2. Considera usar una VPN o cambiar tu IP');
      console.error('   3. Reduce la velocidad de scraping');
      console.error('\n⏸️  El proceso se ha detenido para evitar empeorar el bloqueo.');
      console.error('🚨 ============================================\n');
      
      // Guardar screenshot para diagnóstico
      const screenshotPath = `src/logs/bloqueo_despues_busqueda_${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
      console.error(`📸 Screenshot guardado: ${screenshotPath}`);
      
      throw new Error(`Bloqueo/CAPTCHA detectado después de búsqueda - Deteniendo ejecución: ${errorType}`);
    }
    
    // Screenshot deshabilitado en modo headless
    // await page.screenshot({ path: 'debug_08_despues_buscar.png', fullPage: false });
    // console.log('📸 Screenshot: debug_08_despues_buscar.png');
    
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
    
    // Screenshot deshabilitado en modo headless
    // await page.screenshot({ path: 'debug_09_antes_detalle.png', fullPage: false });
    // console.log('📸 Screenshot: debug_09_antes_detalle.png');
    
    // Esperar a que aparezca el enlace (timeout aumentado)
    await page.waitForSelector('a[title="Detalle de la causa"]', { timeout: 30000 }); // Aumentado de 20s a 30s
    console.log("✅ Enlace encontrado");

  console.log("🖱️ Abriendo detalle...");

    // Esperar a que el modal aparezca después del click (timeout aumentado)
  await Promise.all([
      page.waitForSelector('#modalDetalleCivil, #modalDetalleLaboral', { timeout: 20000 }), // Aumentado de 8s a 20s
      page.click('a[title="Detalle de la causa"]'),
    ]);

    // Delay optimizado después de abrir modal (200-500ms)
    await page.waitForTimeout(200 + Math.random() * 300); // Optimizado: reducido de 800-1500ms a 200-500ms
    
    // Screenshot deshabilitado en modo headless
    // await page.screenshot({ path: 'debug_10_detalle_abierto.png', fullPage: false });
    // console.log('📸 Screenshot: debug_10_detalle_abierto.png');

  console.log("✅ Detalle cargado.");
  } catch (error) {
    console.error('❌ Error abriendo detalle:', error.message);
    await page.screenshot({ path: 'debug_error_detalle.png', fullPage: true });
    throw error;
  }
}

module.exports = { fillForm, openDetalle, resetForm };
