/**
 * API SERVER - Exposición de Tribunales PJUD
 * 
 * Servidor Express que expone los datos de tribunales extraídos
 * para que otros sistemas puedan consultarlos.
 * 
 * Uso:
 *   node src/api/server.js
 * 
 * Endpoints:
 *   GET /api/tribunales          - Lista todos los tribunales
 *   GET /api/tribunales/:id      - Obtiene un tribunal por ID
 *   GET /api/tribunales/buscar   - Busca tribunales por parámetros (competencia, corte, nombre)
 *   GET /api/competencias        - Lista todas las competencias
 *   GET /api/cortes              - Lista todas las cortes
 *   GET /api/health              - Health check
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.API_PORT || 3000;
const HOST = process.env.API_HOST || '0.0.0.0'; // Escuchar en todas las interfaces para VPS

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde public/
app.use(express.static(path.join(__dirname, 'public')));

// Servir módulos JS desde src/modules/
app.use('/modules', express.static(path.join(__dirname, '../modules')));

// Servir módulos JS desde src/modules/
app.use('/modules', express.static(path.join(__dirname, '../modules')));

// Servir vistas HTML
app.set('views', path.join(__dirname, 'views'));

// Importar routers de scraping
const scrapingRouter = require('./scraping-api');
const mvpRouter = require('./mvp-api');
const erpRouter = require('./erp-api');

// Cargar datos de tribunales
const TRIBUNALES_FILE = path.resolve(__dirname, '../outputs/tribunales_pjud_ids.json');
const TRIBUNALES_COMPLETO_FILE = path.resolve(__dirname, '../outputs/tribunales_pjud_completo.json');

let tribunalesData = null;
let tribunalesCompletoData = null;

/**
 * Cargar datos de tribunales desde archivo JSON
 */
function cargarTribunales() {
  try {
    if (fs.existsSync(TRIBUNALES_FILE)) {
      const data = fs.readFileSync(TRIBUNALES_FILE, 'utf-8');
      tribunalesData = JSON.parse(data);
      console.log('✅ Datos de tribunales cargados');
    } else {
      console.warn('⚠️  Archivo de tribunales no encontrado:', TRIBUNALES_FILE);
      tribunalesData = { competencias: [], cortes: [], tribunales: [] };
    }

    if (fs.existsSync(TRIBUNALES_COMPLETO_FILE)) {
      const data = fs.readFileSync(TRIBUNALES_COMPLETO_FILE, 'utf-8');
      tribunalesCompletoData = JSON.parse(data);
      console.log('✅ Datos completos de tribunales cargados');
    }
  } catch (error) {
    console.error('❌ Error cargando tribunales:', error.message);
    tribunalesData = { competencias: [], cortes: [], tribunales: [] };
  }
}

// Cargar datos al iniciar
cargarTribunales();

// Rutas de scraping (sin autenticación para ejecutar, con autenticación para consultar)
app.use('/api/scraping', scrapingRouter);
app.use('/api/mvp', mvpRouter);
app.use('/api/erp', erpRouter);

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    tribunales_cargados: tribunalesData?.tribunales?.length || 0
  });
});

/**
 * GET /api/competencias
 * Lista todas las competencias
 */
app.get('/api/competencias', (req, res) => {
  if (!tribunalesData || !tribunalesData.competencias) {
    return res.status(503).json({
      error: 'Datos de tribunales no disponibles',
      message: 'Ejecuta primero: node src/extraer-tribunales-http.js'
    });
  }

  res.json({
    competencias: tribunalesData.competencias,
    total: tribunalesData.competencias.length
  });
});

/**
 * GET /api/cortes
 * Lista todas las cortes
 */
app.get('/api/cortes', (req, res) => {
  if (!tribunalesData || !tribunalesData.cortes) {
    return res.status(503).json({
      error: 'Datos de tribunales no disponibles',
      message: 'Ejecuta primero: node src/extraer-tribunales-http.js'
    });
  }

  res.json({
    cortes: tribunalesData.cortes,
    total: tribunalesData.cortes.length
  });
});

/**
 * GET /api/tribunales
 * Lista todos los tribunales con filtros opcionales
 */
app.get('/api/tribunales', (req, res) => {
  if (!tribunalesData || !tribunalesData.tribunales) {
    return res.status(503).json({
      error: 'Datos de tribunales no disponibles',
      message: 'Ejecuta primero: node src/extraer-tribunales-http.js'
    });
  }

  let tribunales = [...tribunalesData.tribunales];

  // Filtros opcionales
  const { competencia_id, corte_id, nombre } = req.query;

  if (competencia_id) {
    tribunales = tribunales.filter(t => t.competencia_id === competencia_id);
  }

  if (corte_id) {
    tribunales = tribunales.filter(t => t.corte_id === corte_id);
  }

  if (nombre) {
    const nombreLower = nombre.toLowerCase();
    tribunales = tribunales.filter(t => 
      t.nombre.toLowerCase().includes(nombreLower)
    );
  }

  // Paginación
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
  const start = (page - 1) * limit;
  const end = start + limit;

  res.json({
    tribunales: tribunales.slice(start, end),
    total: tribunales.length,
    page,
    limit,
    total_pages: Math.ceil(tribunales.length / limit)
  });
});

/**
 * GET /api/tribunales/:id
 * Obtiene un tribunal por ID
 */
app.get('/api/tribunales/:id', (req, res) => {
  if (!tribunalesData || !tribunalesData.tribunales) {
    return res.status(503).json({
      error: 'Datos de tribunales no disponibles'
    });
  }

  const tribunal = tribunalesData.tribunales.find(t => t.id === req.params.id);

  if (!tribunal) {
    return res.status(404).json({
      error: 'Tribunal no encontrado',
      id: req.params.id
    });
  }

  res.json(tribunal);
});

/**
 * GET /api/tribunales/buscar
 * Búsqueda avanzada de tribunales
 */
app.get('/api/tribunales/buscar', (req, res) => {
  if (!tribunalesData || !tribunalesData.tribunales) {
    return res.status(503).json({
      error: 'Datos de tribunales no disponibles'
    });
  }

  const { q, competencia_id, corte_id, competencia_nombre, corte_nombre } = req.query;
  
  let resultados = [...tribunalesData.tribunales];

  // Búsqueda por texto general
  if (q) {
    const qLower = q.toLowerCase();
    resultados = resultados.filter(t => 
      t.nombre.toLowerCase().includes(qLower) ||
      t.competencia_nombre.toLowerCase().includes(qLower) ||
      t.corte_nombre.toLowerCase().includes(qLower)
    );
  }

  // Filtros específicos
  if (competencia_id) {
    resultados = resultados.filter(t => t.competencia_id === competencia_id);
  }

  if (corte_id) {
    resultados = resultados.filter(t => t.corte_id === corte_id);
  }

  if (competencia_nombre) {
    const nombreLower = competencia_nombre.toLowerCase();
    resultados = resultados.filter(t => 
      t.competencia_nombre.toLowerCase().includes(nombreLower)
    );
  }

  if (corte_nombre) {
    const nombreLower = corte_nombre.toLowerCase();
    resultados = resultados.filter(t => 
      t.corte_nombre.toLowerCase().includes(nombreLower)
    );
  }

  res.json({
    resultados,
    total: resultados.length
  });
});

/**
 * GET /api/tribunales/por-corte/:corte_id
 * Obtiene todos los tribunales de una corte específica
 */
app.get('/api/tribunales/por-corte/:corte_id', (req, res) => {
  if (!tribunalesData || !tribunalesData.tribunales) {
    return res.status(503).json({
      error: 'Datos de tribunales no disponibles'
    });
  }

  const tribunales = tribunalesData.tribunales.filter(
    t => t.corte_id === req.params.corte_id
  );

  res.json({
    corte_id: req.params.corte_id,
    tribunales,
    total: tribunales.length
  });
});

/**
 * GET /api/tribunales/por-competencia/:competencia_id
 * Obtiene todos los tribunales de una competencia específica
 */
app.get('/api/tribunales/por-competencia/:competencia_id', (req, res) => {
  if (!tribunalesData || !tribunalesData.tribunales) {
    return res.status(503).json({
      error: 'Datos de tribunales no disponibles'
    });
  }

  const tribunales = tribunalesData.tribunales.filter(
    t => t.competencia_id === req.params.competencia_id
  );

  res.json({
    competencia_id: req.params.competencia_id,
    tribunales,
    total: tribunales.length
  });
});

/**
 * POST /api/tribunales/recargar
 * Recarga los datos de tribunales desde archivos
 */
app.post('/api/tribunales/recargar', (req, res) => {
  cargarTribunales();
  res.json({
    message: 'Datos recargados exitosamente',
    tribunales_cargados: tribunalesData?.tribunales?.length || 0,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /demo
 * Página de demostración del frontend profesional con datos de ejemplo
 */
app.get('/demo', (req, res) => {
  const demoPath = path.join(__dirname, 'public', 'demo-movimientos-completo.html');
  if (fs.existsSync(demoPath)) {
    res.sendFile(demoPath);
  } else {
    res.send('Demo no disponible. Verifica que el archivo exista.');
  }
});

/**
 * GET /mvp
 * Dashboard MVP completo
 */
app.get('/mvp', (req, res) => {
  const mvpPath = path.join(__dirname, 'public', 'mvp-dashboard.html');
  if (fs.existsSync(mvpPath)) {
    res.sendFile(mvpPath);
  } else {
    res.send('Dashboard MVP no disponible.');
  }
});

/**
 * GET /
 * Página principal con interfaz para exportar datos
 */
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'views', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>API Tribunales PJUD</title>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; max-width: 1200px; margin: 50px auto; padding: 20px; }
          h1 { color: #333; }
          .stats { display: flex; gap: 20px; margin: 20px 0; }
          .stat-card { background: #f5f5f5; padding: 15px; border-radius: 5px; flex: 1; }
          .stat-card h3 { margin: 0 0 10px 0; color: #666; }
          .stat-card p { font-size: 24px; font-weight: bold; color: #2196F3; margin: 0; }
          .links { margin: 30px 0; }
          .links a { display: inline-block; margin: 10px 10px 10px 0; padding: 10px 20px; 
                     background: #2196F3; color: white; text-decoration: none; border-radius: 5px; }
          .links a:hover { background: #1976D2; }
          .endpoints { background: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px; }
          .endpoints h3 { margin-top: 0; }
          .endpoint { margin: 10px 0; padding: 10px; background: white; border-left: 3px solid #2196F3; }
          code { background: #eee; padding: 2px 5px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <h1>🚀 API Server - Tribunales PJUD</h1>
        <div class="stats">
          <div class="stat-card">
            <h3>Total Tribunales</h3>
            <p>${tribunalesData?.tribunales?.length || 0}</p>
          </div>
          <div class="stat-card">
            <h3>Competencias</h3>
            <p>${tribunalesData?.competencias?.length || 0}</p>
          </div>
          <div class="stat-card">
            <h3>Cortes</h3>
            <p>${tribunalesData?.cortes?.length || 0}</p>
          </div>
        </div>
        <div class="links">
          <a href="/exportar">📥 Exportar Datos</a>
          <a href="/api/health">💚 Health Check</a>
          <a href="/api/tribunales">📋 Ver Tribunales (JSON)</a>
        </div>
        <div class="endpoints">
          <h3>📚 Endpoints Disponibles</h3>
          <div class="endpoint"><code>GET /api/health</code> - Health check</div>
          <div class="endpoint"><code>GET /api/competencias</code> - Listar competencias</div>
          <div class="endpoint"><code>GET /api/cortes</code> - Listar cortes</div>
          <div class="endpoint"><code>GET /api/tribunales</code> - Listar tribunales</div>
          <div class="endpoint"><code>GET /api/exportar/json</code> - Exportar JSON</div>
          <div class="endpoint"><code>GET /api/exportar/csv</code> - Exportar CSV</div>
        </div>
      </body>
      </html>
    `);
  }
});

/**
 * GET /exportar
 * Página de exportación de datos
 */
app.get('/exportar', (req, res) => {
  const exportarPath = path.join(__dirname, 'views', 'exportar.html');
  if (fs.existsSync(exportarPath)) {
    res.sendFile(exportarPath);
  } else {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
  }
});

/**
 * GET /api/exportar/json
 * Exporta todos los tribunales en formato JSON
 */
app.get('/api/exportar/json', (req, res) => {
  if (!tribunalesData) {
    return res.status(503).json({
      error: 'Datos de tribunales no disponibles',
      message: 'Ejecuta primero: node src/extraer-tribunales-http.js'
    });
  }

  const { competencia_id, corte_id, formato } = req.query;
  let datosExportar = { ...tribunalesData };

  // Aplicar filtros si se especifican
  if (competencia_id || corte_id) {
    let tribunalesFiltrados = [...tribunalesData.tribunales];
    
    if (competencia_id) {
      tribunalesFiltrados = tribunalesFiltrados.filter(t => t.competencia_id === competencia_id);
    }
    
    if (corte_id) {
      tribunalesFiltrados = tribunalesFiltrados.filter(t => t.corte_id === corte_id);
    }
    
    datosExportar.tribunales = tribunalesFiltrados;
  }

  // Formato de respuesta
  if (formato === 'pretty') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="tribunales_pjud_${Date.now()}.json"`);
    res.json(datosExportar);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="tribunales_pjud_${Date.now()}.json"`);
    res.send(JSON.stringify(datosExportar));
  }
});

/**
 * GET /api/exportar/csv
 * Exporta todos los tribunales en formato CSV
 */
app.get('/api/exportar/csv', (req, res) => {
  if (!tribunalesData || !tribunalesData.tribunales) {
    return res.status(503).json({
      error: 'Datos de tribunales no disponibles',
      message: 'Ejecuta primero: node src/extraer-tribunales-http.js'
    });
  }

  const { competencia_id, corte_id } = req.query;
  let tribunales = [...tribunalesData.tribunales];

  // Aplicar filtros
  if (competencia_id) {
    tribunales = tribunales.filter(t => t.competencia_id === competencia_id);
  }
  
  if (corte_id) {
    tribunales = tribunales.filter(t => t.corte_id === corte_id);
  }

  // Generar CSV
  const headers = ['ID', 'Nombre', 'Corte ID', 'Corte Nombre', 'Competencia ID', 'Competencia Nombre'];
  const csvRows = [
    headers.join(','),
    ...tribunales.map(t => [
      t.id,
      `"${t.nombre.replace(/"/g, '""')}"`,
      t.corte_id,
      `"${t.corte_nombre.replace(/"/g, '""')}"`,
      t.competencia_id,
      `"${t.competencia_nombre.replace(/"/g, '""')}"`
    ].join(','))
  ];

  const csv = csvRows.join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="tribunales_pjud_${Date.now()}.csv"`);
  res.send('\ufeff' + csv); // BOM para Excel
});

// Iniciar servidor
if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 API SERVER - Tribunales PJUD');
    console.log('='.repeat(60));
    console.log(`📍 Host: ${HOST}`);
    console.log(`📍 Puerto: ${PORT}`);
    console.log(`🌐 URL: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
    console.log(`📂 Archivo de tribunales: ${TRIBUNALES_FILE}`);
    console.log(`\n📋 Endpoints disponibles:`);
    console.log(`   GET  /                        - Página principal (interfaz web)`);
    console.log(`   GET  /exportar                - Página de exportación`);
    console.log(`   GET  /api/health              - Health check`);
    console.log(`   GET  /api/competencias        - Listar competencias`);
    console.log(`   GET  /api/cortes              - Listar cortes`);
    console.log(`   GET  /api/tribunales          - Listar tribunales`);
    console.log(`   GET  /api/tribunales/:id      - Obtener tribunal por ID`);
    console.log(`   GET  /api/tribunales/buscar   - Buscar tribunales`);
    console.log(`   GET  /api/tribunales/por-corte/:corte_id`);
    console.log(`   GET  /api/tribunales/por-competencia/:competencia_id`);
    console.log(`   GET  /api/exportar/json       - Exportar JSON`);
    console.log(`   GET  /api/exportar/csv        - Exportar CSV`);
    console.log(`   POST /api/tribunales/recargar - Recargar datos`);
    console.log(`\n📋 Endpoints de Scraping:`);
    console.log(`   POST /api/scraping/ejecutar       - Ejecutar scraping (sin autenticación)`);
    console.log(`   GET  /api/scraping/resultado/:rit - Obtener resultado (requiere token)`);
    console.log(`   GET  /api/scraping/listar         - Listar RITs procesados (requiere token)`);
    console.log(`   DELETE /api/scraping/resultado/:rit - Eliminar resultado (requiere token)`);
    console.log(`   GET  /api/scraping/pdf/:rit/:archivo - Servir PDF directamente (sin autenticación)`);
    console.log(`       Ejemplo: /api/scraping/pdf/16707-2019/16707_2019_mov_7_rojo.pdf`);
    console.log(`       O: /api/scraping/pdf/16707-2019/mov/7/rojo`);
    console.log('\n💡 Para obtener el token por defecto, verifica el archivo storage/tokens.json');
    console.log('='.repeat(60) + '\n');
  });
}

module.exports = app;

