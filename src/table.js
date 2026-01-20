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
          // 👇 selector AL FORM (NO al <a>)
          selector: `table tbody tr:nth-child(${rowIndex + 1}) form:nth-of-type(${i + 1})`
        }));

        return {
          texto: tds.map(td => td.innerText.trim()),
          datos_limpios: {
            folio: tds[0]?.innerText.trim() || null,
            tramite: tds[4]?.innerText.trim() || null,
            desc_tramite: tds[5]?.innerText.trim() || null
          },
          forms
        };
      })
  ).then(r => r.filter(Boolean));
}

module.exports = { extractTable, extractTableAsArray };
