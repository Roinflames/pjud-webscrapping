async function extractTable(page) {
  return await page.$$eval(
    'table.table.table-bordered.table-striped.table-hover tbody tr',
    trs => trs.map(tr => {
      const cells = [...tr.querySelectorAll('td')];
      if (cells.length < 5) return null;

      // Extraer datos de los PDFs (iconos azul/rojo) en la columna "Doc." (índice 1)
      const docCell = cells[1];
      const pdfs = [];
      if (docCell) {
        const links = docCell.querySelectorAll('a');
        links.forEach((a, linkIndex) => {
          const img = a.querySelector('img');
          const imgSrc = (img?.src || '').toLowerCase();
          
          // Detección precisa por nombre de archivo de imagen del PJUD
          // ico_pdf.png = Azul (Principal)
          // pdf_old.png = Rojo (Anexo/Escrito)
          const isAnexo = imgSrc.includes('pdf_old') || imgSrc.includes('rojo') || imgSrc.includes('anexo');
          
          pdfs.push({
            tipo: isAnexo ? 'A' : 'P', // A = Anexo (Rojo), P = Principal (Azul)
            tipo_desc: isAnexo ? 'rojo' : 'azul',
            title: a.title || (isAnexo ? 'Anexo' : 'Principal'),
            linkIndex: linkIndex
          });
        });
      }

      // Limpiar fecha (extraer solo DD/MM/YYYY)
      const rawFecha = cells[6]?.innerText.trim() || '';
      const fechaMatch = rawFecha.match(/(\d{2}\/\d{2}\/\d{4})/);
      const fechaLimpia = fechaMatch ? fechaMatch[1] : null;

      return {
        texto: cells.map(td => td.innerText.trim()),
        pdfs: pdfs,
        datos_limpios: {
          folio: cells[0]?.innerText.trim() || null,
          anexo: cells[2]?.innerText.trim() || null,
          etapa: cells[3]?.innerText.trim() || null,
          tramite: cells[4]?.innerText.trim() || null,
          desc_tramite: cells[5]?.innerText.trim() || null,
          fec_tramite: fechaLimpia,
          foja: cells[7]?.innerText.trim() || null,
          georref: cells[8]?.innerText.trim() || null
        }
      };
    })
  ).then(rows => rows.filter(r => r !== null));
}

module.exports = { extractTable };
