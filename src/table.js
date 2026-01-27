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
  await page.waitForSelector(
    'table.table.table-bordered.table-striped.table-hover tbody tr',
    { timeout: 15000 }
  );

  // Agregar diagnóstico: verificar estructura de la tabla
  const diagnosticInfo = await page.evaluate(() => {
    const trs = document.querySelectorAll('table.table.table-bordered.table-striped.table-hover tbody tr');
    if (trs.length === 0) return { totalRows: 0, sampleRow: null };
    
    const firstRow = trs[0];
    const tds = [...firstRow.querySelectorAll('td')];
    const forms = [...firstRow.querySelectorAll('form')];
    const links = [...firstRow.querySelectorAll('a')];
    const icons = [...firstRow.querySelectorAll('i')];
    
    // Verificar segunda columna específicamente (donde suelen estar los PDFs)
    const secondTd = tds[1];
    const secondTdLinks = secondTd ? [...secondTd.querySelectorAll('a[onclick], a[href*="pdf"], a[href*="documento"]')] : [];
    const secondTdIcons = secondTd ? [...secondTd.querySelectorAll('i[onclick], i.fa-file-pdf-o, i.fa-file-pdf')] : [];
    
    return {
      totalRows: trs.length,
      sampleRow: {
        tdsCount: tds.length,
        formsCount: forms.length,
        linksCount: links.length,
        iconsCount: icons.length,
        secondTdLinksCount: secondTdLinks.length,
        secondTdIconsCount: secondTdIcons.length,
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
  });
  
  console.log(`🔍 Diagnóstico de tabla:`, JSON.stringify(diagnosticInfo, null, 2));

  return await page.$$eval(
    'table.table.table-bordered.table-striped.table-hover tbody tr',
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
          texto,
          datos_limpios,
          forms,
          pdfs,
          pdfLinks: pdfLinks // Guardar también los enlaces encontrados
        };
      })
  ).then(r => r.filter(Boolean));
}

/**
 * Extrae tabla del modal detalle con columnas completas:
 * Folio | Doc. | Anexo | Etapa | Trámite | Desc. Trámite | Fec. Trámite | Foja | Georref
 * Incluye pdfs por fila (azul/rojo) para descarga.
 */
async function extractTableDetalle(page) {
  await page.waitForSelector(
    'table.table.table-bordered.table-striped.table-hover tbody tr, #tablaHistoria tbody tr, .modal table.table tbody tr',
    { timeout: 15000 }
  );

  return await page.$$eval(
    'table.table.table-bordered.table-striped.table-hover tbody tr, #tablaHistoria tbody tr, .modal table.table tbody tr',
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
