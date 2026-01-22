/**
 * cuadernos.js
 * Extrae movimientos del dropdown "Cuaderno" en el detalle de causa PJUD.
 * Al cambiar el cuaderno, la tabla de historia se actualiza con distintos movimientos.
 * Cada movimiento lleva id_cuaderno e id_pagina para mostrarlos tal cual en la página.
 */

const { extractTableAsArray } = require('./table');

/** Selectores del modal de detalle PJUD */
const SELECTORS = {
  modal: '#modalDetalleCivil, #modalDetalleLaboral, .modal.show .modal-body',
  cuadernoSelectParent: 'select#m_cuaderno, select[id*="cuaderno"]',
  cuadernoDropdown: '[data-toggle="dropdown"].cuaderno, .dropdown.cuaderno button, .btn-group button[data-toggle="dropdown"], .modal .dropdown-toggle',
  tablaHistoria: 'table.table.table-bordered.table-striped.table-hover tbody tr, #tablaHistoria tbody tr, .modal table tbody tr',
};

/**
 * Obtiene las opciones del cuaderno (select o dropdown tipo Bootstrap)
 * @param {import('playwright').Page} page
 * @returns {Promise<Array<{id: string, valor: string, nombre: string, tipo: 'select'|'dropdown'}>>}
 */
async function obtenerOpcionesCuaderno(page) {
  const select = await page.$(SELECTORS.cuadernoSelectParent);
  if (select) {
    const opts = await page.$$eval(
      `${SELECTORS.cuadernoSelectParent} option`,
      options => options.filter(o => o.value != null && String(o.value).trim() !== '').map((o, i) => ({
        id: String(i + 1),
        valor: String(o.value).trim(),
        nombre: (o.innerText || o.textContent || '').trim() || `Cuaderno ${i + 1}`,
        tipo: 'select'
      }))
    );
    await select.dispose?.();
    return opts;
  }

  const dd = await page.$(`${SELECTORS.cuadernoDropdown}`);
  if (dd) {
    await dd.click();
    await page.waitForTimeout(400);
    const menuOpts = await page.$$eval(
      '.dropdown-menu.show a, .dropdown-menu a[role="option"], .dropdown-menu li a',
      links => links.map((a, i) => ({
        id: String(i + 1),
        valor: (a.getAttribute('data-value') || a.getAttribute('href') || String(i + 1)).trim(),
        nombre: (a.innerText || a.textContent || '').trim() || `Cuaderno ${i + 1}`,
        tipo: 'dropdown'
      })).filter(o => o.nombre && o.nombre.length > 0)
    );
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    return menuOpts;
  }

  return [];
}

/**
 * Verifica si existe el dropdown/select de cuaderno en el modal de detalle
 * @param {import('playwright').Page} page
 * @returns {Promise<boolean>}
 */
async function hayCuaderno(page) {
  const opts = await obtenerOpcionesCuaderno(page);
  return opts.length > 0;
}

/**
 * Selecciona una opción del cuaderno y espera a que se actualice la tabla
 * @param {import('playwright').Page} page
 * @param {{ valor: string, nombre: string, tipo: string }} opcion
 * @param {number} [opcionIndex] - Índice de la opción (para dropdown)
 */
async function seleccionarCuaderno(page, opcion, opcionIndex = 0) {
  if (opcion.tipo === 'select') {
    await page.selectOption(SELECTORS.cuadernoSelectParent, opcion.valor).catch(() => {});
  } else {
    const btn = await page.$(SELECTORS.cuadernoDropdown);
    if (btn) {
      await btn.click();
      await page.waitForTimeout(300);
      const links = await page.$$('.dropdown-menu.show a, .dropdown-menu a[role="option"], .dropdown-menu li a');
      if (links[opcionIndex]) {
        await links[opcionIndex].click().catch(() => {});
      } else {
        await page.click(`.dropdown-menu a:has-text("${(opcion.nombre || '').replace(/"/g, '')}")`).catch(() => {});
      }
    }
  }
  await page.waitForTimeout(600);
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForTimeout(400);
}

/**
 * Extrae todos los cuadernos y sus movimientos. Cada movimiento incluye id_cuaderno e id_pagina.
 * @param {import('playwright').Page} page
 * @param {string} rit - RIT de la causa
 * @returns {Promise<{ hayCuadernos: boolean, cuadernos: Array<{id_cuaderno: string, nombre: string, movimientos: Array}>, todosLosMovimientos: Array }>}
 */
async function extraerCuadernosYMovimientos(page, rit) {
  const existe = await hayCuaderno(page);
  const todosLosMovimientos = [];
  const cuadernos = [];

  if (!existe) {
    const rows = await extractTableAsArray(page);
    const movimientos = rows.map((row, idx) => {
      const folio = row.datos_limpios?.folio ?? row.texto?.[0];
      const tds = row.texto || [];
      return {
        id_pagina: `p-1-${idx + 1}`,
        id_cuaderno: '1',
        cuaderno_nombre: 'Principal',
        indice: idx + 1,
        folio: folio ?? String(idx + 1),
        etapa: tds[3] ?? null,
        tramite: tds[4] ?? null,
        desc_tramite: tds[5] ?? null,
        fecha: tds[6] ?? null,
        foja: tds[7] ?? null,
        georref: tds[8] ?? null,
        tiene_doc: !!row.forms?.length,
        tiene_anexo: (row.forms?.length || 0) > 1,
        forms: row.forms || [],
        raw: row,
      };
    });
    movimientos.forEach(m => todosLosMovimientos.push({ ...m }));
    cuadernos.push({ id_cuaderno: '1', nombre: 'Principal', movimientos });
    return { hayCuadernos: false, cuadernos, todosLosMovimientos };
  }

  const opciones = await obtenerOpcionesCuaderno(page);
  if (opciones.length === 0) {
    const rows = await extractTableAsArray(page);
    const movimientos = rows.map((row, idx) => {
      const folio = row.datos_limpios?.folio ?? row.texto?.[0];
      const tds = row.texto || [];
      return {
        id_pagina: `p-1-${idx + 1}`,
        id_cuaderno: '1',
        cuaderno_nombre: 'Principal',
        indice: idx + 1,
        folio: folio ?? String(idx + 1),
        etapa: tds[3] ?? null,
        tramite: tds[4] ?? null,
        desc_tramite: tds[5] ?? null,
        fecha: tds[6] ?? null,
        foja: tds[7] ?? null,
        georref: tds[8] ?? null,
        tiene_doc: !!row.forms?.length,
        tiene_anexo: (row.forms?.length || 0) > 1,
        forms: row.forms || [],
        raw: row,
      };
    });
    movimientos.forEach(m => todosLosMovimientos.push({ ...m }));
    cuadernos.push({ id_cuaderno: '1', nombre: 'Principal', movimientos });
    return { hayCuadernos: false, cuadernos, todosLosMovimientos };
  }

  let indiceGlobal = 0;

  for (let opIdx = 0; opIdx < opciones.length; opIdx++) {
    const op = opciones[opIdx];
    await seleccionarCuaderno(page, op, opIdx);
    const rows = await extractTableAsArray(page).catch(() => []);

    const movimientos = rows.map((row, idx) => {
      indiceGlobal += 1;
      const folio = row.datos_limpios?.folio ?? row.texto?.[0];
      const tds = row.texto || [];
      const mov = {
        id_pagina: `p-${op.id}-${idx + 1}`,
        id_cuaderno: op.id,
        cuaderno_nombre: op.nombre,
        indice: indiceGlobal,
        folio: folio ?? String(idx + 1),
        etapa: tds[3] ?? null,
        tramite: tds[4] ?? null,
        desc_tramite: tds[5] ?? null,
        fecha: tds[6] ?? null,
        foja: tds[7] ?? null,
        georref: tds[8] ?? null,
        tiene_doc: !!row.forms?.length,
        tiene_anexo: (row.forms?.length || 0) > 1,
        forms: row.forms || [],
        raw: row,
      };
      todosLosMovimientos.push({ ...mov });
      return mov;
    });

    cuadernos.push({
      id_cuaderno: op.id,
      nombre: op.nombre,
      movimientos,
    });
  }

  return { hayCuadernos: true, cuadernos, todosLosMovimientos };
}

module.exports = {
  hayCuaderno,
  obtenerOpcionesCuaderno,
  seleccionarCuaderno,
  extraerCuadernosYMovimientos,
  SELECTORS,
};
