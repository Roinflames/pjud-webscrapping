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

  return await page.$$eval(
    'table.table.table-bordered.table-striped.table-hover tbody tr',
    trs =>
      trs.map((tr, rowIndex) => {
        const tds = [...tr.querySelectorAll('td')];
        if (tds.length < 2) return null;

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

        const pdfs = forms.map((f, i) => ({
          linkIndex: i,
          tipo: i === 0 ? 'P' : 'R',
          tipo_desc: i === 0 ? 'azul' : 'rojo'
        }));

        return {
          texto,
          datos_limpios,
          forms,
          pdfs
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
