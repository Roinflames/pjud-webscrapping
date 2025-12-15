const fs = require('fs');
const path = require('path');

// Extraer solo las URLs de los PDFs (sin descargarlos)
async function extractPDFUrlsFromTable(page, context, outputDir, rit) {
  console.log("🔎 Buscando URLs de PDFs en la tabla...");

  const pdfLinks = await page.$$(
    'a[onclick*="submit"] i.fa-file-pdf-o'
  );

  console.log(`📄 Se encontraron ${pdfLinks.length} PDFs.`);

  const pdfUrls = [];
  let index = 1;

  // Extraer todas las URLs de una vez desde el DOM (más rápido)
  const allFormInfo = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[onclick*="submit"] i.fa-file-pdf-o'));
    return links.map((icon, idx) => {
      const link = icon.closest('a');
      const form = link ? link.closest('form') : null;
      
      if (!form) return null;
      
      const action = form.getAttribute('action') || '';
      const method = form.getAttribute('method') || 'GET';
      const inputs = Array.from(form.querySelectorAll('input[type="hidden"]')).map(input => ({
        name: input.getAttribute('name'),
        value: input.getAttribute('value')
      }));
      
      // Construir URL base
      const baseUrl = window.location.origin;
      let url = action.startsWith('http') ? action : baseUrl + (action.startsWith('/') ? action : '/' + action);
      
      // Agregar parámetros si es GET
      if (method.toUpperCase() === 'GET' && inputs.length > 0) {
        const params = new URLSearchParams();
        inputs.forEach(input => {
          if (input.name && input.value) {
            params.append(input.name, input.value);
          }
        });
        url += (url.includes('?') ? '&' : '?') + params.toString();
      }
      
      return {
        index: idx + 1,
        action: action,
        method: method,
        url: url,
        inputs: inputs,
        onclick: link ? link.getAttribute('onclick') || '' : ''
      };
    });
  });
  
  // Detectar URLs duplicadas/similares para saltarlas rápido
  const seenUrls = new Set();
  const urlPatterns = new Map(); // Para detectar patrones similares
  
  // Procesar URLs extraídas del DOM (rápido, sin esperas innecesarias)
  for (let i = 0; i < pdfLinks.length; i++) {
    try {
      const formInfo = allFormInfo[i];
      
      // Si tenemos información del formulario, usar la URL extraída
      if (formInfo && formInfo.url && formInfo.url.length > 10) {
        // Detectar URLs similares/duplicadas
        const urlKey = formInfo.url.split('?')[0]; // URL sin parámetros para comparar
        const urlPattern = urlKey.match(/\/([^\/]+)$/)?.[1] || ''; // Último segmento
        
        // Si ya vimos esta URL o un patrón similar, saltarla rápido
        if (seenUrls.has(urlKey) || (urlPattern && urlPatterns.has(urlPattern) && urlPatterns.get(urlPattern) > 2)) {
          console.log(`⏭️  URL ${index}/${pdfLinks.length} similar detectada, saltando: ${formInfo.url.substring(0, 60)}...`);
          index++;
          continue;
        }
        
        seenUrls.add(urlKey);
        if (urlPattern) {
          urlPatterns.set(urlPattern, (urlPatterns.get(urlPattern) || 0) + 1);
        }
        
        pdfUrls.push({
          index: index,
          url: formInfo.url,
          filename: `${rit.replace(/[^a-zA-Z0-9]/g, '_')}_doc_${index}.pdf`,
          form_action: formInfo.action,
          form_method: formInfo.method,
          form_inputs: formInfo.inputs,
          onclick: formInfo.onclick,
          method: 'dom_extraction'
        });
        
        console.log(`✅ URL ${index}/${pdfLinks.length} extraída: ${formInfo.url.substring(0, 70)}...`);
      } else {
        // Si no podemos extraer del formulario, intentar hacer click y capturar la URL
        console.log(`⚠️ No se pudo extraer del formulario, intentando click para PDF ${index}...`);
        
        // Interceptar respuestas de red para capturar la URL del PDF (timeout reducido)
        let capturedUrl = null;
        const urlPromise = new Promise((resolve) => {
          const timeout = setTimeout(() => resolve(null), 8000); // Reducido de 20s a 8s
          
          // Listener para interceptar respuestas PDF
          const responseHandler = async (response) => {
            try {
              const url = response.url();
              const contentType = response.headers()['content-type'] || '';
              
              // Verificar si es un PDF por content-type o URL
              if (contentType.includes('pdf') || url.includes('.pdf') || url.match(/\/descarga|\/download|\/pdf|\/documento/i)) {
                clearTimeout(timeout);
                page.off('response', responseHandler);
                resolve(url);
              }
            } catch (e) {
              // Continuar esperando
            }
          };
          
          page.on('response', responseHandler);
          
          // También escuchar nuevas páginas como fallback (timeout reducido)
          const pageHandler = async (newPage) => {
            try {
              await newPage.waitForLoadState("domcontentloaded", { timeout: 3000 }); // Reducido de 5s a 3s
              await newPage.waitForTimeout(500); // Reducido de 2s a 0.5s
              
              const url = newPage.url();
              if (url && url !== 'about:blank' && !url.endsWith(':') && url.startsWith('http')) {
                clearTimeout(timeout);
                context.off('page', pageHandler);
                page.off('response', responseHandler);
                resolve(url);
                await newPage.close();
              }
            } catch (e) {
              // Continuar esperando
            }
          };
          
          context.on('page', pageHandler);
        });
        
        // Hacer click
        await icon.click();
        
        // Esperar a capturar la URL (con timeout más corto)
        capturedUrl = await Promise.race([
          urlPromise,
          new Promise(resolve => setTimeout(() => resolve(null), 8000)) // Timeout máximo 8s
        ]);
        
        if (capturedUrl) {
          pdfUrls.push({
            index: index,
            url: capturedUrl,
            filename: `${rit.replace(/[^a-zA-Z0-9]/g, '_')}_doc_${index}.pdf`,
            method: 'click_capture'
          });
          
          console.log(`✅ URL ${index}/${pdfLinks.length} capturada del click: ${capturedUrl.substring(0, 100)}...`);
        } else {
          throw new Error('No se pudo capturar la URL del PDF');
        }
      }
    } catch (error) {
      console.error(`❌ Error extrayendo URL del PDF ${index}:`, error.message);
      pdfUrls.push({
        index: index,
        url: null,
        filename: `${rit.replace(/[^a-zA-Z0-9]/g, '_')}_doc_${index}.pdf`,
        error: error.message
      });
    }
    
    index++;
  }

  // Guardar URLs en archivo JSON
  const urlsPath = path.join(outputDir, `pdf_urls_${rit.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
  fs.writeFileSync(urlsPath, JSON.stringify(pdfUrls, null, 2));
  console.log(`📋 URLs guardadas en: ${urlsPath}`);

  const exitosas = pdfUrls.filter(p => p.url !== null).length;
  const fallidas = pdfUrls.filter(p => p.url === null).length;

  console.log(`📊 Resumen URLs: ${exitosas} extraídas exitosamente, ${fallidas} fallidas`);
  
  return { 
    urls: pdfUrls,
    total: pdfLinks.length,
    exitosas: exitosas,
    fallidas: fallidas
  };
}

// Función legacy para compatibilidad (ahora solo extrae URLs)
async function downloadPDFsFromTable(page, context, outputDir, rit) {
  return await extractPDFUrlsFromTable(page, context, outputDir, rit);
}

module.exports = { extractPDFUrlsFromTable, downloadPDFsFromTable };
