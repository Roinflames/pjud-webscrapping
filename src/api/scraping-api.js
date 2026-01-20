/**
 * API de Scraping - Endpoints para ejecutar scraping y consultar resultados
 * 
 * Endpoints:
 *   POST /api/scraping/ejecutar - Ejecuta scraping con datos recibidos
 *   GET  /api/scraping/resultado/:rit - Obtiene resultado por RIT (requiere autenticación)
 *   GET  /api/scraping/listar - Lista todos los RITs procesados (requiere autenticación)
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
 * Requiere autenticación
 */
router.get('/resultado/:rit', middlewareAuth, (req, res) => {
  try {
    const { rit } = req.params;
    
    const resultado = obtenerResultado(rit);
    
    if (!resultado) {
      return res.status(404).json({
        error: 'Resultado no encontrado',
        mensaje: `No se encontró resultado para el RIT: ${rit}`,
        sugerencia: 'Ejecuta primero el scraping usando POST /api/scraping/ejecutar'
      });
    }
    
    res.json({
      success: true,
      resultado
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
 * Requiere autenticación
 */
router.get('/listar', middlewareAuth, (req, res) => {
  try {
    const rits = listarRITs();
    
    res.json({
      success: true,
      total: rits.length,
      rits
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
    
    // Buscar el archivo en outputs
    const outputsDir = path.resolve(__dirname, '../outputs');
    const filePath = path.join(outputsDir, nombreArchivo);
    
    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'PDF no encontrado',
        mensaje: `No se encontró el archivo: ${nombreArchivo}`,
        ruta_buscada: filePath,
        sugerencia: 'Verifica que el scraping se haya ejecutado correctamente'
      });
    }
    
    // Verificar que es un PDF válido
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      return res.status(404).json({
        error: 'PDF vacío',
        mensaje: `El archivo ${nombreArchivo} está vacío`
      });
    }
    
    // Leer el archivo
    const fileBuffer = fs.readFileSync(filePath);
    
    // Verificar que es un PDF (magic number: %PDF)
    if (fileBuffer.slice(0, 4).toString() !== '%PDF') {
      return res.status(400).json({
        error: 'Archivo no es un PDF válido',
        mensaje: `El archivo ${nombreArchivo} no es un PDF válido`
      });
    }
    
    // Configurar headers para que el navegador muestre el PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${nombreArchivo}"`);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache por 1 hora
    
    // Enviar el PDF
    res.send(fileBuffer);
    
  } catch (error) {
    console.error('Error sirviendo PDF:', error);
    res.status(500).json({
      error: 'Error sirviendo PDF',
      mensaje: error.message
    });
  }
});

module.exports = router;