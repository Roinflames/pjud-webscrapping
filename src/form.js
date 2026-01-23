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

    // Esperar a que la tabla de resultados tenga filas
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll('table tbody tr');
      return rows.length > 0;
    }, { timeout: 15000 });

    await page.waitForTimeout(1000); // Esperar que la tabla termine de renderizar

    // Guardar URL actual para detectar navegación
    const urlAntes = page.url();

    // DEBUG: Buscar específicamente en la tabla de resultados (dtaTableDetalle)
    const tableInfo = await page.evaluate(() => {
      // Buscar la tabla de resultados por ID o por contenido de RIT
      const tables = document.querySelectorAll('table');
      let resultTable = null;
      
      for (const table of tables) {
        if (table.id === 'dtaTableDetalle') {
          resultTable = table;
          break;
        }
        // Buscar tabla que contenga RIT (C-xxx-xxxx)
        const firstRow = table.querySelector('tbody tr');
        if (firstRow && firstRow.innerText.match(/C-\d+-\d{4}/)) {
          resultTable = table;
          break;
        }
      }
      
      if (!resultTable) {
        return { error: 'No se encontró tabla de resultados', tablesCount: tables.length };
      }
      
      const firstRow = resultTable.querySelector('tbody tr');
      if (!firstRow) {
        return { error: 'Tabla sin filas', tableId: resultTable.id };
      }
      
      const allLinks = [...firstRow.querySelectorAll('a')];
      return {
        tableId: resultTable.id || 'sin-id',
        tableClass: resultTable.className,
        rowText: firstRow.innerText.substring(0, 200),
        linksCount: allLinks.length,
        links: allLinks.map(a => ({
          onclick: a.getAttribute('onclick')?.substring(0, 100),
          href: a.href,
          title: a.title
        }))
      };
    });
    console.log("🔍 DEBUG - Tabla de resultados:", JSON.stringify(tableInfo, null, 2));
    
    // Buscar y hacer click en el enlace de detalle de la primera causa
    const clicked = await page.evaluate(() => {
      // Buscar la tabla de resultados
      let resultTable = document.querySelector('#dtaTableDetalle');
      
      if (!resultTable) {
        // Buscar tabla con RIT
        const tables = document.querySelectorAll('table');
        for (const table of tables) {
          const firstRow = table.querySelector('tbody tr');
          if (firstRow && firstRow.innerText.match(/C-\d+-\d{4}/)) {
            resultTable = table;
            break;
          }
        }
      }
      
      if (!resultTable) {
        return { clicked: false, error: 'No se encontró tabla de resultados' };
      }
      
      // Buscar el enlace de detalle en la primera fila
      const firstRow = resultTable.querySelector('tbody tr');
      if (!firstRow) {
        return { clicked: false, error: 'Tabla sin filas' };
      }
      
      // El enlace de detalle tiene onclick="detalleCausaCivil(...)"
      const detalleLink = firstRow.querySelector('a[onclick*="detalleCausaCivil"]') ||
                          firstRow.querySelector('a[onclick]') ||
                          firstRow.querySelector('td:first-child a');
      
      if (detalleLink) {
        // Retornar info del enlace para hacer click con Playwright
        return {
          found: true,
          selector: 'a[onclick*="detalleCausaCivil"]',
          onclick: detalleLink.getAttribute('onclick')?.substring(0, 200)
        };
      }
      
      return { found: false, error: 'No se encontró enlace de detalle en la fila' };
    });
    
    if (!clicked.found) {
      console.log("   ⚠️ No se encontró enlace en la primera fila, buscando en toda la tabla...");
      // Intentar buscar en cualquier fila de la tabla
      const hasLink = await page.$('a[onclick*="detalleCausaCivil"]');
      if (!hasLink) {
        await page.screenshot({ path: 'debug_no_enlace_detalle.png', fullPage: true });
        throw new Error('No se encontró el enlace de detalle en la tabla de resultados');
      }
    }
    
    // Usar page.click() de Playwright para hacer click real (mejor para reCAPTCHA)
    console.log("   🖱️ Haciendo click con Playwright en el enlace de detalle...");
    try {
      // Hacer click en el primer enlace con onclick de detalleCausaCivil
      await page.click('table#dtaTableDetalle tbody tr:first-child a[onclick*="detalleCausaCivil"]', { timeout: 5000 });
    } catch (e) {
      // Fallback: buscar cualquier enlace de detalle
      try {
        await page.click('a[onclick*="detalleCausaCivil"]', { timeout: 5000 });
      } catch (e2) {
        // Último fallback: click con JavaScript
        await page.evaluate(() => {
          const link = document.querySelector('a[onclick*="detalleCausaCivil"]');
          if (link) link.click();
        });
      }
    }
    
    const clicked2 = { clicked: true, method: 'playwright_click', onclick: clicked.onclick };

    console.log(`✅ Click ejecutado en enlace de detalle (método: ${clicked2.method})`);
    if (clicked2.onclick) {
      console.log(`   📋 onclick: ${clicked2.onclick}`);
    }
    
    // Capturar errores JavaScript de la página
    const jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
      console.log(`   ❌ Error JS en página: ${error.message}`);
    });
    
    // Capturar solicitudes de red fallidas
    page.on('requestfailed', request => {
      console.log(`   ❌ Request fallido: ${request.url()} - ${request.failure()?.errorText}`);
    });

    // Esperar a que el modal se abra y cargue contenido AJAX
    // El PJUD carga el contenido del modal dinámicamente via AJAX
    console.log("🔄 Esperando modal y contenido AJAX...");
    
    // Verificar si la función detalleCausaCivil existe y obtener su código
    const funcInfo = await page.evaluate(() => {
      return {
        exists: typeof window.detalleCausaCivil === 'function',
        typeOf: typeof window.detalleCausaCivil,
        // Obtener el código completo de la función
        source: typeof window.detalleCausaCivil === 'function' 
          ? window.detalleCausaCivil.toString()
          : 'N/A'
      };
    });
    console.log(`   🔍 Función detalleCausaCivil: existe=${funcInfo.exists}`);
    if (funcInfo.exists) {
      console.log(`   📋 Código completo de la función:`);
      console.log(funcInfo.source);
    }
    
    // Interceptar TODAS las peticiones de red después del click
    const allResponses = [];
    page.on('response', async response => {
      const url = response.url();
      // Ignorar recursos estáticos
      if (!url.includes('.css') && !url.includes('.js') && !url.includes('.png') && !url.includes('.jpg') && !url.includes('.gif') && !url.includes('.woff')) {
        try {
          const status = response.status();
          allResponses.push({ url: url.substring(0, 120), status });
          console.log(`   📡 Response: ${status} - ${url.substring(0, 80)}`);
        } catch (e) {}
      }
    });
    
    // El click ya ejecutó la función detalleCausaCivil que hace reCAPTCHA + AJAX
    // El PJUD tarda 10-15 segundos en cargar el modal con los movimientos
    // Solo necesitamos esperar pacientemente a que el contenido se cargue
    console.log("   ⏳ Esperando carga del modal (reCAPTCHA + AJAX tarda 10-15 segundos)...");
    
    // Esperar hasta 30 segundos a que el modal tenga contenido
    let intentos = 0;
    const maxIntentos = 30; // 30 intentos de 1 segundo = 30 segundos máximo
    let tablaEncontrada = false;
    
    while (intentos < maxIntentos && !tablaEncontrada) {
      const modalContent = await page.evaluate(() => {
        const modal = document.querySelector('#modalDetalleCivil, #modalDetalleLaboral, .modal.show');
        if (!modal) return { exists: false, visible: false, hasTable: false, tableRows: 0, tableCols: 0 };
        
        const isVisible = modal.classList.contains('show') || 
                          modal.style.display === 'block' ||
                          window.getComputedStyle(modal).display !== 'none';
        
        // Buscar tabla DENTRO del modal con columnas de movimientos (6+ columnas)
        const tables = modal.querySelectorAll('table');
        let bestTable = null;
        let maxCols = 0;
        
        for (const table of tables) {
          const firstRow = table.querySelector('tbody tr');
          if (firstRow) {
            const cols = firstRow.querySelectorAll('td').length;
            if (cols > maxCols) {
              maxCols = cols;
              bestTable = table;
            }
          }
        }
        
        const tableRows = bestTable ? bestTable.querySelectorAll('tbody tr').length : 0;
        
        return {
          exists: true,
          visible: isVisible,
          hasTable: bestTable !== null && maxCols >= 6,
          tableRows: tableRows,
          tableCols: maxCols,
          contentLength: modal.innerHTML.length
        };
      });
      
      // Mostrar progreso cada 5 segundos
      if (intentos % 5 === 0 || modalContent.hasTable) {
        console.log(`   🔄 [${intentos}s] Modal: visible=${modalContent.visible}, tabla=${modalContent.hasTable}, filas=${modalContent.tableRows}, cols=${modalContent.tableCols}, contenido=${modalContent.contentLength} chars`);
      }
      
      // Éxito si encontramos tabla con 6+ columnas (tabla de movimientos)
      if (modalContent.hasTable && modalContent.tableRows > 0 && modalContent.tableCols >= 6) {
        tablaEncontrada = true;
        console.log(`   ✅ Modal cargado con tabla de movimientos (${modalContent.tableRows} filas, ${modalContent.tableCols} columnas)`);
      } else {
        await page.waitForTimeout(1000);
        intentos++;
      }
    }
    
    if (!tablaEncontrada) {
      console.warn(`   ⚠️ No se detectó tabla de movimientos después de ${maxIntentos} segundos`);
      console.log(`   📡 Responses capturadas: ${allResponses.length}`);
      allResponses.slice(-5).forEach(r => console.log(`      - ${r.status}: ${r.url}`));
    }

    // Esperar a que la tabla de movimientos tenga contenido con al menos 6 columnas
    console.log("🔄 Verificando tabla de movimientos...");
    
    // Esperar más tiempo para que cargue el contenido AJAX del modal
    await page.waitForTimeout(3000);
    
    try {
      // El PJUD carga la tabla de movimientos via AJAX en el modal
      // Buscar cualquier tabla con más de 6 columnas
      await page.waitForFunction(() => {
        // Buscar en toda la página tablas con 6+ columnas
        const allTables = document.querySelectorAll('table.table tbody tr');
        for (const tr of allTables) {
          const cols = tr.querySelectorAll('td');
          if (cols.length >= 6) {
            return true;
          }
        }
        return false;
      }, { timeout: 15000 });
      console.log("✅ Tabla de movimientos con contenido detectada");
    } catch (e) {
      console.warn("⚠️ No se pudo verificar tabla de movimientos, continuando...");
      // Debug: mostrar todas las tablas disponibles
      const tableInfo = await page.evaluate(() => {
        const tables = document.querySelectorAll('table');
        return Array.from(tables).map((t, i) => ({
          index: i,
          id: t.id || 'sin-id',
          className: t.className,
          rows: t.querySelectorAll('tbody tr').length,
          firstRowCols: t.querySelector('tbody tr')?.querySelectorAll('td').length || 0
        }));
      });
      console.log("📊 Tablas disponibles:", JSON.stringify(tableInfo, null, 2));
    }
    
    // Capturar screenshot y HTML para debugging
    const timestamp = Date.now();
    const debugScreenshot = `src/logs/debug_detalle_${timestamp}.png`;
    await page.screenshot({ path: debugScreenshot, fullPage: true }).catch(() => {});
    console.log(`📸 Screenshot guardado: ${debugScreenshot}`);
    
    // Capturar HTML del modal
    const modalHtml = await page.evaluate(() => {
      const modal = document.querySelector('#modalDetalleCivil, #modalDetalleLaboral, .modal.show');
      if (modal) {
        return {
          id: modal.id,
          className: modal.className,
          style: modal.getAttribute('style'),
          innerHTML: modal.innerHTML.substring(0, 5000) // Primeros 5000 caracteres
        };
      }
      return null;
    });
    if (modalHtml) {
      const fs = require('fs');
      fs.writeFileSync(`src/logs/debug_modal_${timestamp}.json`, JSON.stringify(modalHtml, null, 2));
      console.log(`📄 HTML del modal guardado: src/logs/debug_modal_${timestamp}.json`);
    }
    
    // Delay final
    await page.waitForTimeout(500);
    console.log("✅ Detalle cargado.");

  } catch (error) {
    console.error('❌ Error abriendo detalle:', error.message);
    await page.screenshot({ path: 'debug_error_detalle.png', fullPage: true });
    throw error;
  }
}

module.exports = { fillForm, openDetalle, resetForm };
