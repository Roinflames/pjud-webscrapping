// table.js
// ==========================================
// Extraer movimientos del PJUD + forms de PDFs
// ==========================================

async function extractTable(page) {
  await page.waitForSelector(
    'table.table.table-bordered.table-striped.table-hover tbody tr',
    { timeout: 15000 }
  ).catch(() => {});

  return await page.$$eval(
    'table.table.table-bordered.table-striped.table-hover tbody tr',
    trs => trs.map((tr, index) => {
      const cells = [...tr.querySelectorAll('td')].map(td => td.innerText.trim());

      // 🔴 CORREGIDO: PJUD usa <i>, no <img>
      const pdfIcons = tr.querySelectorAll('a[onclick] i');
      const tienePDF = pdfIcons.length > 0;

      return {
        indice: index + 1,
        folio: cells[0] || null,
        rit: cells[1] || null,
        fecha: cells[2] || null,
        caratulado: cells[3] || null,
        juzgado: cells[4] || null,
        tiene_pdf: tienePDF,
        raw: cells
      };
    })
  );
}

// ==========================================
// Versión completa (PDFs + FORMS reales)
// ==========================================

async function extractTableAsArray(page) {
  // CORRECCIÓN CRÍTICA: Buscar la tabla SOLO dentro del modal de detalle
  // El selector anterior era genérico y capturaba AMBAS tablas (resultados + movimientos)
  const MODAL_TABLE_SELECTOR = '#modalDetalleCivil table tbody tr, #modalDetalleLaboral table tbody tr, .modal-body table tbody tr';

  await page.waitForSelector(MODAL_TABLE_SELECTOR, { timeout: 15000 });

  // PRE-ANÁLISIS: Identificar cuál tabla es la de movimientos (folio numérico + múltiples columnas)
  const tablasInfo = await page.evaluate(() => {
    const modals = [
      document.querySelector('#modalDetalleCivil'),
      document.querySelector('#modalDetalleLaboral'),
      document.querySelector('.modal-body')
    ].filter(Boolean);

    if (modals.length === 0) return { tables: [], selectedIndex: -1 };

    const modal = modals[0];
    const tables = Array.from(modal.querySelectorAll('table'));

    const tableAnalysis = tables.map((table, idx) => {
      const firstRow = table.querySelector('tbody tr');
      if (!firstRow) return null;

      const tds = firstRow.querySelectorAll('td');
      const firstText = tds[0] ? tds[0].innerText.trim() : '';
      const isNumeric = /^\d+$/.test(firstText);

      return {
        index: idx,
        columns: tds.length,
        rows: table.querySelectorAll('tbody tr').length,
        firstCell: firstText.substring(0, 50),
        isNumeric: isNumeric,
        isMovimientos: isNumeric && tds.length >= 7
      };
    }).filter(Boolean);

    // Buscar la tabla de movimientos (folio numérico + >=7 columnas)
    const movimientosIndex = tableAnalysis.findIndex(t => t.isMovimientos);

    return {
      tables: tableAnalysis,
      selectedIndex: movimientosIndex >= 0 ? movimientosIndex : 0
    };
  });

  console.log(`📊 Análisis de tablas del modal:`, JSON.stringify(tablasInfo.tables, null, 2));
  console.log(`✅ Tabla seleccionada: Tabla ${tablasInfo.selectedIndex} (${tablasInfo.tables[tablasInfo.selectedIndex]?.columns || '?'} columnas)`);

  // Selector específico para la tabla de movimientos correcta
  const TABLE_SPECIFIC_SELECTOR = `#modalDetalleCivil table:nth-of-type(${tablasInfo.selectedIndex + 1}) tbody tr, #modalDetalleLaboral table:nth-of-type(${tablasInfo.selectedIndex + 1}) tbody tr, .modal-body table:nth-of-type(${tablasInfo.selectedIndex + 1}) tbody tr`;

  // Agregar diagnóstico: verificar estructura de la tabla DEL MODAL
  const diagnosticInfo = await page.evaluate((selector) => {
    const trs = document.querySelectorAll(selector);
    if (trs.length === 0) return { totalRows: 0, sampleRow: null, error: 'No se encontraron filas en el modal' };

    const firstRow = trs[0];
    const tds = [...firstRow.querySelectorAll('td')];
    const forms = [...firstRow.querySelectorAll('form')];
    const links = [...firstRow.querySelectorAll('a')];
    const icons = [...firstRow.querySelectorAll('i')];

    // Verificar primera columna (folio - debe ser número)
    const firstTd = tds[0];
    const firstColText = firstTd ? firstTd.innerText.trim() : '';
    const firstColIsNumber = /^\d+$/.test(firstColText);

    // Verificar segunda columna específicamente (donde suelen estar los PDFs)
    const secondTd = tds[1];
    const secondTdLinks = secondTd ? [...secondTd.querySelectorAll('a[onclick], a[href*="pdf"], a[href*="documento"]')] : [];
    const secondTdIcons = secondTd ? [...secondTd.querySelectorAll('i[onclick], i.fa-file-pdf-o, i.fa-file-pdf')] : [];
    const secondTdForms = secondTd ? [...secondTd.querySelectorAll('form')] : [];

    return {
      totalRows: trs.length,
      sampleRow: {
        tdsCount: tds.length,
        formsCount: forms.length,
        linksCount: links.length,
        iconsCount: icons.length,
        firstColText,
        firstColIsNumber,
        isLikelyMovimientosTable: firstColIsNumber && tds.length >= 7, // Folio numérico + varias columnas
        secondTdLinksCount: secondTdLinks.length,
        secondTdIconsCount: secondTdIcons.length,
        secondTdFormsCount: secondTdForms.length,
        firstTdHTML: tds[0] ? tds[0].innerHTML.substring(0, 200) : null,
        secondTdHTML: secondTd ? secondTd.innerHTML.substring(0, 300) : null,
        hasForms: forms.length > 0,
        formsHTML: forms.map(f => f.outerHTML.substring(0, 150)),
        secondTdLinks: secondTdLinks.map(l => ({
          tag: l.tagName,
          onclick: l.getAttribute('onclick') ? l.getAttribute('onclick').substring(0, 100) : null,
          href: l.getAttribute('href') || null
        }))
      }
    };
  }, TABLE_SPECIFIC_SELECTOR);

  console.log(`🔍 Diagnóstico de tabla del MODAL:`, JSON.stringify(diagnosticInfo, null, 2));

  // VALIDACIÓN: Verificar que es la tabla correcta (movimientos, no resultados)
  if (diagnosticInfo.sampleRow && !diagnosticInfo.sampleRow.isLikelyMovimientosTable) {
    console.warn(`⚠️ ADVERTENCIA: La tabla extraída NO parece ser de movimientos:`);
    console.warn(`   - Primera columna: "${diagnosticInfo.sampleRow.firstColText}" (¿es folio numérico? ${diagnosticInfo.sampleRow.firstColIsNumber})`);
    console.warn(`   - Número de columnas: ${diagnosticInfo.sampleRow.tdsCount} (esperado: >=7)`);
    console.warn(`   - Puede ser la tabla de resultados de búsqueda en lugar de movimientos`);
  }

  const rows = await page.$$eval(
    TABLE_SPECIFIC_SELECTOR,
    trs =>
      trs.map((tr, rowIndex) => {
        const tds = [...tr.querySelectorAll('td')];
        if (tds.length < 2) return null;

        // Buscar forms dentro de la fila (pueden estar en cualquier td)
        const forms = [...tr.querySelectorAll('form')].map((form, i) => ({
          index: i,
          action: form.getAttribute('action'),
          method: form.getAttribute('method') || 'get',
          inputs: [...form.querySelectorAll('input')].map(inp => ({
            name: inp.name,
            value: inp.value
          })),
          selector: `table tbody tr:nth-child(${rowIndex + 1}) form:nth-of-type(${i + 1})`
        }));

        // Si no hay forms, buscar enlaces e iconos con onclick (método alternativo)
        let pdfLinks = [];
        if (forms.length === 0) {
          // Buscar en TODA la fila (no solo segunda columna)
          const links = [
            ...tr.querySelectorAll('a[onclick], a[href*="pdf"], a[href*="documento"], a[onclick*="submit"]')
          ];
          const icons = [
            ...tr.querySelectorAll('i[onclick], i.fa-file-pdf-o, i.fa-file-pdf, i.fa-file')
          ];
          const imgs = [
            // Muy importante: PJUD usa <img onclick="verDocumento(...)">
            ...tr.querySelectorAll('img[onclick*="verDocumento"], img[onclick], img[src*="pdf"], img[src*="documento"]')
          ];

          // Combinar enlaces, iconos e imágenes (eliminar duplicados si un icono/img está dentro de un enlace)
          const allElements = [...links, ...icons, ...imgs];
          const uniqueElements = allElements.filter((el, idx) => {
            // Si es un icono o imagen, verificar que no esté dentro de un enlace ya agregado
            if (el.tagName === 'I' || el.tagName === 'IMG') {
              const parentLink = el.closest('a');
              return !parentLink || !allElements.slice(0, idx).includes(parentLink);
            }
            return true;
          });

          pdfLinks = uniqueElements.map((el, i) => ({
            index: i,
            tagName: el.tagName,
            hasOnclick: !!el.getAttribute('onclick'),
            onclick: el.getAttribute('onclick') || null,
            href: el.getAttribute('href') || null,
            className: el.className || null
          }));
        }

        const texto = tds.map(td => td.innerText.trim());
        const datos_limpios = {
          folio: texto[0] || null,
          doc: texto[1] || null,
          anexo: texto[2] || null,
          etapa: texto[3] || null,
          tramite: texto[4] || null,
          desc_tramite: texto[5] || null,
          fecha: texto[6] || null,
          foja: texto[7] || null,
          georref: texto[8] || null
        };

        // Si hay forms, usarlos; si no, usar los enlaces encontrados
        const pdfs = forms.length > 0
          ? forms.map((f, i) => ({
              linkIndex: i,
              tipo: i === 0 ? 'P' : 'R',
              tipo_desc: i === 0 ? 'azul' : 'rojo',
              source: 'form'
            }))
          : pdfLinks.map((link, i) => ({
              linkIndex: i,
              tipo: i === 0 ? 'P' : 'R',
              tipo_desc: i === 0 ? 'azul' : 'rojo',
              source: 'link',
              tagName: link.tagName,
              hasOnclick: link.hasOnclick
            }));

        return {
          originalRowIndex: rowIndex, // Índice original en el DOM (ANTES del filtrado)
          texto,
          datos_limpios,
          forms,
          pdfs,
          pdfLinks: pdfLinks // Guardar también los enlaces encontrados
        };
      })
  );

  // Filtrar filas nulas y recalcular rowIndex basado en la posición final
  const filteredRows = rows.filter(Boolean);
  return filteredRows.map((row, index) => ({
    ...row,
    rowIndex: row.originalRowIndex // Mantener el índice original del DOM para referencia confiable
  }));
}

/**
 * Extrae tabla del modal detalle con columnas completas:
 * Folio | Doc. | Anexo | Etapa | Trámite | Desc. Trámite | Fec. Trámite | Foja | Georref
 * Incluye pdfs por fila (azul/rojo) para descarga.
 */
async function extractTableDetalle(page) {
  // CORRECCIÓN: Usar el mismo selector específico del modal
  const MODAL_TABLE_SELECTOR = '#modalDetalleCivil table tbody tr, #modalDetalleLaboral table tbody tr, .modal-body table tbody tr, #tablaHistoria tbody tr';

  await page.waitForSelector(MODAL_TABLE_SELECTOR, { timeout: 15000 });

  return await page.$$eval(
    MODAL_TABLE_SELECTOR,
    trs => trs.map((tr, rowIndex) => {
      const tds = [...tr.querySelectorAll('td')];
      if (tds.length < 2) return null;

      const texto = tds.map(td => td.innerText.trim());
      const forms = [...tr.querySelectorAll('form')].map((f, i) => ({
        index: i,
        action: f.getAttribute('action'),
        method: f.getAttribute('method') || 'get',
        inputs: [...f.querySelectorAll('input')].map(inp => ({ name: inp.name, value: inp.value }))
      }));

      const pdfs = forms.map((f, i) => ({ linkIndex: i, tipo: i === 0 ? 'P' : 'R', tipo_desc: i === 0 ? 'azul' : 'rojo' }));

      return {
        indice: rowIndex + 1,
        folio: texto[0] || null,
        doc: texto[1] || null,
        anexo: texto[2] || null,
        etapa: texto[3] || null,
        tramite: texto[4] || null,
        desc_tramite: texto[5] || null,
        fecha: texto[6] || null,
        foja: texto[7] || null,
        georref: texto[8] || null,
        texto,
        forms,
        pdfs
      };
    })
  ).then(r => r.filter(Boolean));
}

module.exports = { extractTable, extractTableAsArray, extractTableDetalle };
