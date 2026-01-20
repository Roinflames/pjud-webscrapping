// Extraer tabla con estructura clara de movimientos del PJUD (optimizado)
async function extractTable(page) {
  // Esperar solo a que la tabla exista, no a que cargue completamente
  await page.waitForSelector('table.table.table-bordered.table-striped.table-hover tbody tr', { 
    timeout: 15000, // Aumentado de 5s a 15s para evitar timeouts
    state: 'attached' // Solo verificar que existe, no que esté visible
  }).catch(() => {
    // Si no encuentra, continuar de todas formas
  });
  
  return await page.$$eval(
    'table.table.table-bordered.table-striped.table-hover tbody tr',
    trs => {
      return trs.map((tr, index) => {
        const cells = [...tr.querySelectorAll('td')].map(td => td.innerText.trim());
        
        // Buscar si hay enlace PDF en esta fila (rápido)
        const pdfLink = tr.querySelector('a[onclick*="submit"] i.fa-file-pdf-o');
        const hasPDF = pdfLink !== null;
        
        // Crear objeto estructurado con los movimientos
        const movimiento = {
          // Datos básicos
          indice: index + 1,
          rit: cells[1] || '',
          fecha: cells[2] || '',
          caratulado: cells[3] || '',
          juzgado: cells[4] || '',
          // Datos adicionales si existen
          folio: cells[0] || '',
          // Indicador de PDF disponible
          tiene_pdf: hasPDF,
          // Mantener array original para compatibilidad
          raw: cells
        };
        
        return movimiento;
      });
    }
  );
}

// Función para extraer solo los arrays (compatibilidad con código anterior - optimizado)
async function extractTableAsArray(page) {
  // Esperar solo a que la tabla exista
  await page.waitForSelector('table.table.table-bordered.table-striped.table-hover tbody tr', { 
    timeout: 15000, // Aumentado de 5s a 15s para evitar timeouts
    state: 'attached'
  }).catch(() => {
    // Si no encuentra, continuar de todas formas
  });
  
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
          const imgAlt = (img?.alt || '').toLowerCase();
          const imgClass = (img?.className || '').toLowerCase();
          
          // Detección precisa por nombre de archivo de imagen del PJUD
          // Azul (Principal) = PDFs subidos por abogados
          // Rojo (Anexo/Escrito) = PDFs de la corte
          // Buscar en src, alt y className para mayor precisión
          const isAnexo = imgSrc.includes('pdf_old') || 
                         imgSrc.includes('rojo') || 
                         imgSrc.includes('anexo') ||
                         imgAlt.includes('rojo') ||
                         imgAlt.includes('anexo') ||
                         imgAlt.includes('corte') ||
                         imgClass.includes('rojo') ||
                         imgClass.includes('anexo');
          
          // Log para debugging (solo en desarrollo)
          if (process.env.NODE_ENV === 'development' && img) {
            console.log(`   📄 Icono PDF - Folio: ${row.datos_limpios?.folio || 'N/A'}, ` +
                       `src: ${imgSrc.substring(0, 50)}, ` +
                       `alt: ${imgAlt}, ` +
                       `tipo: ${isAnexo ? 'Rojo (Corte)' : 'Azul (Abogados)'}`);
          }
          
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

module.exports = { extractTable, extractTableAsArray };
