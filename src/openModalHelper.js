/**
 * Helper para abrir el modal de detalle de causa
 * Múltiples estrategias para asegurar que el AJAX se dispare
 */

/**
 * Estrategia 1: Click con espera de petición HTTP
 */
async function openModalWithNetworkWait(page, rit) {
  console.log('   📡 Estrategia 1: Click con espera de petición AJAX...');

  // Esperar petición AJAX después del click
  const [response] = await Promise.all([
    page.waitForResponse(response =>
      response.url().includes('detalle') ||
      response.url().includes('movimientos') ||
      response.url().includes('causa'),
      { timeout: 15000 }
    ).catch(() => null),

    page.evaluate((ritBuscado) => {
      const tables = document.querySelectorAll('table');
      for (const table of tables) {
        const rows = table.querySelectorAll('tbody tr');
        for (const row of rows) {
          if (row.innerText.includes(ritBuscado)) {
            const link = row.querySelector('a[onclick*="detalleCausaCivil"]');
            if (link) {
              link.click();
              return { success: true };
            }
          }
        }
      }
      return { success: false };
    }, rit)
  ]);

  if (response) {
    console.log(`   ✅ Petición AJAX detectada: ${response.url()}`);
    return true;
  }

  return false;
}

/**
 * Estrategia 2: Ejecutar el onclick directamente
 */
async function openModalWithOnclickExecution(page, rit) {
  console.log('   🔧 Estrategia 2: Ejecutar onclick directamente...');

  const result = await page.evaluate((ritBuscado) => {
    const tables = document.querySelectorAll('table');

    for (const table of tables) {
      const rows = table.querySelectorAll('tbody tr');

      for (const row of rows) {
        if (row.innerText.includes(ritBuscado)) {
          const link = row.querySelector('a[onclick*="detalleCausaCivil"]');

          if (link) {
            const onclick = link.getAttribute('onclick');
            if (onclick) {
              try {
                // Ejecutar el código del onclick
                eval(onclick);
                return { success: true, onclick: onclick.substring(0, 100) };
              } catch (e) {
                return { success: false, error: e.message };
              }
            }
          }
        }
      }
    }

    return { success: false, error: 'Enlace no encontrado' };
  }, rit);

  return result.success;
}

/**
 * Estrategia 3: Esperar el modal y luego verificar contenido
 */
async function waitForModalContent(page, timeout = 30000) {
  console.log('   ⏳ Esperando contenido del modal...');

  try {
    // Primero esperar que el modal aparezca
    await page.waitForSelector('#modalDetalleCivil, #modalDetalleLaboral', {
      state: 'visible',
      timeout: timeout / 2
    });

    console.log('   ✅ Modal visible en DOM');

    // Luego esperar que tenga contenido (tabla con filas)
    await page.waitForSelector(
      '#modalDetalleCivil table tbody tr:first-child, #modalDetalleLaboral table tbody tr:first-child',
      { state: 'attached', timeout: timeout / 2 }
    );

    console.log('   ✅ Tabla de movimientos cargada');

    return true;
  } catch (error) {
    console.warn(`   ⚠️ Timeout esperando modal: ${error.message}`);
    return false;
  }
}

/**
 * Función principal: Intenta múltiples estrategias
 */
async function openModalDetalle(page, rit, config = {}) {
  const maxRetries = config.maxRetries || 2;
  const strategies = [
    openModalWithNetworkWait,
    openModalWithOnclickExecution
  ];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    console.log(`\n   🔄 Intento ${attempt + 1}/${maxRetries}`);

    for (const strategy of strategies) {
      try {
        const opened = await strategy(page, rit);

        if (opened) {
          // Verificar que el contenido se cargó
          const hasContent = await waitForModalContent(page, 20000);

          if (hasContent) {
            console.log('   ✅ Modal abierto y con contenido');
            return true;
          } else {
            console.log('   ⚠️ Modal abierto pero sin contenido, reintentando...');
          }
        }
      } catch (error) {
        console.warn(`   ⚠️ Estrategia falló: ${error.message}`);
      }

      // Delay entre estrategias
      await page.waitForTimeout(1000);
    }

    // Delay entre intentos
    if (attempt < maxRetries - 1) {
      await page.waitForTimeout(3000);
    }
  }

  console.error('   ❌ No se pudo abrir el modal después de todos los intentos');
  return false;
}

module.exports = {
  openModalDetalle,
  waitForModalContent
};
