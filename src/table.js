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
      const cells = [...tr.querySelectorAll('td')].map(td => td.innerText.trim());
      return cells;
    })
  );
}

module.exports = { extractTable, extractTableAsArray };
