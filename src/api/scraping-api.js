/**
 * API de Scraping - Endpoints para ejecutar scraping y consultar resultados
 * 
 * Endpoints:
 *   POST /api/scraping/ejecutar - Ejecuta scraping con datos recibidos
 *   GET  /api/scraping/resultado/:rit - Obtiene resultado por RIT (PÚBLICO - sin autenticación)
 *   GET  /api/scraping/listar - Lista todos los RITs procesados (PÚBLICO - sin autenticación)
 *   DELETE /api/scraping/resultado/:rit - Elimina un resultado (requiere autenticación)
 */

const express = require('express');
const { ejecutarScraping } = require('./scraper-service');
const { guardarResultado, obtenerResultado, listarRITs, eliminarResultado } = require('./storage');
const { middlewareAuth } = require('./auth');

const router = express.Router();

/**
 * POST /api/scraping/ejecutar
 * Recibe datos para ejecutar scraping
 * 
 * Body JSON esperado:
 * {
 *   "rit": "16707-2019",
 *   "competencia": "3",
 *   "corte": "90",
 *   "tribunal": "276",
 *   "tipoCausa": "C",
 *   "headless": false (opcional)
 * }
 */
router.post('/ejecutar', async (req, res) => {
  try {
    const { rit, competencia, corte, tribunal, tipoCausa, headless } = req.body;

    if (![rit, competencia, corte, tribunal, tipoCausa].every(v => typeof v === 'string')) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    if (!/^\d+-\d{4}$/.test(rit)) {
      return res.status(400).json({ error: 'RIT inválido', recibido: rit });
    }

    console.log(`📥 Scraping RIT ${rit}`);

    const resultado = await ejecutarScraping({
      rit,
      competencia,
      corte,
      tribunal,
      tipoCausa,
      headless: !!headless
    });

    try {
      guardarResultado(rit, resultado);
    } catch (e) {
      console.warn('⚠️ No se pudo guardar el resultado:', e.message);
    }

    res.json({
      success: true,
      mensaje: 'Scraping ejecutado exitosamente',
      resultado: {
        ...resultado,
        pdfs: {
          nota: 'PDFs disponibles vía GET /api/scraping/resultado/:rit',
          total: Object.keys(resultado.pdfs || {}).length,
          nombres: Object.keys(resultado.pdfs || {})
        }
      }
    });

  } catch (error) {
    console.error('❌ Error scraping:', error);
    res.status(500).json({ error: error.message });
  }
});


/**
 * GET /api/scraping/resultado/:rit
 * Obtiene resultado completo de scraping (incluye PDFs en base64)
 * PÚBLICO: No requiere autenticación para facilitar uso en frontend
 * Primero busca en BD, luego en archivos JSON
 */
router.get('/resultado/:rit', async (req, res) => {
  try {
    const { rit } = req.params;
    
    // 1. Intentar obtener desde base de datos
    try {
      const { getCausaCompleta } = require('../database/db-mariadb');
      const causaBD = await getCausaCompleta(rit);
      
      if (causaBD && causaBD.movimientos && causaBD.movimientos.length > 0) {
        console.log(`✅ Datos obtenidos desde BD para ${rit}: ${causaBD.movimientos.length} movimientos`);
        return res.json({
          success: true,
          resultado: causaBD,
          fuente: 'database'
        });
      }
    } catch (dbError) {
      console.warn(`⚠️ Error consultando BD para ${rit}:`, dbError.message);
      // Continuar con búsqueda en archivos
    }
    
    // 2. Si no está en BD, buscar en archivos JSON
    const resultado = obtenerResultado(rit);
    
    if (!resultado) {
      return res.status(404).json({
        error: 'Resultado no encontrado',
        mensaje: `No se encontró resultado para el RIT: ${rit}`,
        sugerencia: 'Ejecuta primero el scraping usando POST /api/scraping/ejecutar o node src/test/scraper-5-causas.js'
      });
    }
    
    res.json({
      success: true,
      resultado,
      fuente: 'files'
    });
    
  } catch (error) {
    console.error('Error obteniendo resultado:', error);
    res.status(500).json({
      error: 'Error obteniendo resultado',
      mensaje: error.message
    });
  }
});

/**
 * GET /api/scraping/listar
 * Lista todos los RITs procesados
 * PÚBLICO: No requiere autenticación para facilitar uso en frontend
 * Primero busca en BD, luego en archivos JSON
 */
router.get('/listar', async (req, res) => {
  try {
    // 1. Intentar obtener desde base de datos
    let ritsBD = [];
    try {
      const { listarCausas } = require('../database/db-mariadb');
      const causas = await listarCausas();
      ritsBD = causas.map(c => ({
        rit: c.rit,
        fecha_scraping: c.fecha_scraping,
        total_movimientos: c.total_movimientos || 0,
        total_pdfs: c.total_pdfs || 0
      }));
    } catch (dbError) {
      console.warn('⚠️ Error consultando BD:', dbError.message);
    }
    
    // 2. También buscar en archivos JSON
    const ritsFiles = listarRITs();
    
    // 3. Combinar y deduplicar (priorizar BD)
    const ritsMap = new Map();
    
    // Primero agregar desde archivos
    ritsFiles.forEach(r => {
      ritsMap.set(r.rit, r);
    });
    
    // Luego agregar/sobrescribir con datos de BD
    ritsBD.forEach(r => {
      ritsMap.set(r.rit, r);
    });
    
    const rits = Array.from(ritsMap.values());
    
    res.json({
      success: true,
      total: rits.length,
      rits,
      fuente: ritsBD.length > 0 ? 'database' : 'files'
    });
    
  } catch (error) {
    console.error('Error listando RITs:', error);
    res.status(500).json({
      error: 'Error listando resultados',
      mensaje: error.message
    });
  }
});

/**
 * DELETE /api/scraping/resultado/:rit
 * Elimina un resultado de scraping
 * Requiere autenticación
 */
router.delete('/resultado/:rit', middlewareAuth, (req, res) => {
  try {
    const { rit } = req.params;
    
    const eliminado = eliminarResultado(rit);
    
    if (!eliminado) {
      return res.status(404).json({
        error: 'Resultado no encontrado',
        mensaje: `No se encontró resultado para el RIT: ${rit}`
      });
    }
    
    res.json({
      success: true,
      mensaje: `Resultado del RIT ${rit} eliminado exitosamente`
    });
    
  } catch (error) {
    console.error('Error eliminando resultado:', error);
    res.status(500).json({
      error: 'Error eliminando resultado',
      mensaje: error.message
    });
  }
});

/**
 * GET /api/scraping/pdf/:rit/:archivo
 * Sirve un PDF directamente para que el navegador lo muestre/descargue
 * 
 * Ejemplo: GET /api/scraping/pdf/16707-2019/16707_2019_mov_7_rojo.pdf
 * 
 * También acepta formato: GET /api/scraping/pdf/16707-2019/mov/7/rojo
 */
// Endpoint para servir PDFs - usar patrón con wildcard
router.get('/pdf/:rit/*', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const { rit } = req.params;
    
    // Obtener el resto de la ruta después de /pdf/:rit/
    // Express captura el resto en req.params[0] cuando usas *
    const archivoPath = req.params[0] || '';
    
    if (!archivoPath) {
      return res.status(400).json({
        error: 'Nombre de archivo requerido',
        mensaje: 'Debes especificar el nombre del archivo PDF',
        ejemplo: '/api/scraping/pdf/16707-2019/16707_2019_mov_7_rojo.pdf'
      });
    }
    
    // Si viene en formato mov/7/rojo, construir el nombre del archivo
    let nombreArchivo = archivoPath;
    if (archivoPath.includes('mov/')) {
      const partes = archivoPath.split('/');
      if (partes.length === 3 && partes[0] === 'mov') {
        const indiceMov = partes[1];
        const tipo = partes[2]; // azul o rojo
        const ritClean = rit.replace(/[^a-zA-Z0-9]/g, '_');
        nombreArchivo = `${ritClean}_mov_${indiceMov}_${tipo}.pdf`;
      }
    }
    
    // Si no tiene extensión .pdf, agregarla
    if (!nombreArchivo.endsWith('.pdf')) {
      nombreArchivo += '.pdf';
    }
    
    // 1. Buscar el archivo físico en outputs
    const outputsDir = path.resolve(__dirname, '../outputs');
    const filePath = path.join(outputsDir, nombreArchivo);
    
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > 0) {
        const fileBuffer = fs.readFileSync(filePath);
        if (fileBuffer.slice(0, 4).toString() === '%PDF') {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename="${nombreArchivo}"`);
          res.setHeader('Content-Length', stats.size);
          res.setHeader('Cache-Control', 'public, max-age=3600');
          return res.send(fileBuffer);
        }
      }
    }
    
    // 2. Si no está en archivo físico, buscar en base64 del resultado JSON
    const { obtenerResultado } = require('./storage');
    const resultado = obtenerResultado(rit);
    
    if (resultado) {
      // Buscar en pdfs (objeto con nombres de archivo)
      if (resultado.pdfs && resultado.pdfs[nombreArchivo]) {
        const base64Content = resultado.pdfs[nombreArchivo];
        if (typeof base64Content === 'string') {
          try {
            const fileBuffer = Buffer.from(base64Content, 'base64');
            if (fileBuffer.slice(0, 4).toString() === '%PDF') {
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', `inline; filename="${nombreArchivo}"`);
              res.setHeader('Content-Length', fileBuffer.length);
              res.setHeader('Cache-Control', 'public, max-age=3600');
              return res.send(fileBuffer);
            }
          } catch (e) {
            console.warn(`Error decodificando base64 para ${nombreArchivo}:`, e.message);
          }
        }
      }
      
      // Buscar en movimientos (pdf_azul, pdf_rojo)
      if (resultado.movimientos && Array.isArray(resultado.movimientos)) {
        for (const mov of resultado.movimientos) {
          if (mov.pdf_azul && mov.pdf_azul.nombre === nombreArchivo && mov.pdf_azul.base64) {
            try {
              const fileBuffer = Buffer.from(mov.pdf_azul.base64, 'base64');
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', `inline; filename="${nombreArchivo}"`);
              res.setHeader('Content-Length', fileBuffer.length);
              res.setHeader('Cache-Control', 'public, max-age=3600');
              return res.send(fileBuffer);
            } catch (e) {
              console.warn(`Error decodificando base64 de movimiento:`, e.message);
            }
          }
          if (mov.pdf_rojo && mov.pdf_rojo.nombre === nombreArchivo && mov.pdf_rojo.base64) {
            try {
              const fileBuffer = Buffer.from(mov.pdf_rojo.base64, 'base64');
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', `inline; filename="${nombreArchivo}"`);
              res.setHeader('Content-Length', fileBuffer.length);
              res.setHeader('Cache-Control', 'public, max-age=3600');
              return res.send(fileBuffer);
            } catch (e) {
              console.warn(`Error decodificando base64 de movimiento:`, e.message);
            }
          }
        }
      }
      
      // Buscar eBook (pdf_ebook)
      const ebook = resultado.ebook || resultado.pdf_ebook;
      if (ebook && (ebook.nombre === nombreArchivo || nombreArchivo.includes('ebook')) && ebook.base64) {
        try {
          const fileBuffer = Buffer.from(ebook.base64, 'base64');
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename="${ebook.nombre || nombreArchivo}"`);
          res.setHeader('Content-Length', fileBuffer.length);
          res.setHeader('Cache-Control', 'public, max-age=3600');
          return res.send(fileBuffer);
        } catch (e) {
          console.warn(`Error decodificando base64 de eBook:`, e.message);
        }
      }
    }
    
    // No se encontró en ningún lugar
    return res.status(404).json({
      error: 'PDF no encontrado',
      mensaje: `No se encontró el archivo: ${nombreArchivo}`,
      ruta_buscada: filePath,
      sugerencia: 'Verifica que el scraping se haya ejecutado correctamente y que el PDF tenga base64'
    });
    
  } catch (error) {
    console.error('Error sirviendo PDF:', error);
    res.status(500).json({
      error: 'Error sirviendo PDF',
      mensaje: error.message
    });
  }
});

module.exports = router;