/**
 * Metrics Server - Exposes Prometheus metrics via HTTP
 * Run standalone: node src/monitoring/metrics-server.js
 */

const express = require('express');
const metricsCollector = require('./metrics-collector');

const app = express();
const PORT = process.env.METRICS_PORT || 9091;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'pjud-scraper-metrics',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Metrics endpoint (Prometheus format)
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    const metrics = await metricsCollector.getMetrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Metrics endpoint (JSON format - for debugging)
app.get('/metrics/json', async (req, res) => {
  try {
    const metrics = await metricsCollector.getMetricsJSON();
    res.json({
      timestamp: new Date().toISOString(),
      metrics,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Root endpoint with documentation
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>PJUD Scraper - Metrics Server</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          h1 { color: #333; }
          .endpoint { background: #f4f4f4; padding: 15px; margin: 10px 0; border-radius: 5px; }
          code { background: #e0e0e0; padding: 2px 6px; border-radius: 3px; }
          a { color: #0066cc; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>PJUD Scraper - Metrics Server</h1>
        <p>Prometheus metrics exporter for PJUD web scraper monitoring.</p>

        <h2>Available Endpoints:</h2>

        <div class="endpoint">
          <h3>📊 <a href="/metrics">/metrics</a></h3>
          <p>Prometheus metrics in text format (scrape this endpoint)</p>
          <code>curl http://localhost:${PORT}/metrics</code>
        </div>

        <div class="endpoint">
          <h3>📋 <a href="/metrics/json">/metrics/json</a></h3>
          <p>Metrics in JSON format (for debugging)</p>
          <code>curl http://localhost:${PORT}/metrics/json</code>
        </div>

        <div class="endpoint">
          <h3>❤️ <a href="/health">/health</a></h3>
          <p>Health check endpoint</p>
          <code>curl http://localhost:${PORT}/health</code>
        </div>

        <h2>Metrics Categories:</h2>
        <ul>
          <li><strong>Business Metrics:</strong> causas processed, PDFs extracted/downloaded, movimientos</li>
          <li><strong>Security:</strong> CAPTCHA detections, blocked requests, circuit breaker state</li>
          <li><strong>Performance:</strong> operation durations, active operations, page load times</li>
          <li><strong>Errors:</strong> error counts by type and severity</li>
          <li><strong>System:</strong> CPU, memory, Node.js metrics</li>
        </ul>

        <h2>Prometheus Configuration:</h2>
        <pre style="background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto;">
scrape_configs:
  - job_name: 'pjud-scraper'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:${PORT}']
        </pre>
      </body>
    </html>
  `);
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('📊 PJUD Scraper - Metrics Server');
  console.log('='.repeat(60));
  console.log(`✅ Server listening on http://0.0.0.0:${PORT}`);
  console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
  console.log(`📋 JSON: http://localhost:${PORT}/metrics/json`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
  console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Metrics server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Metrics server closed');
    process.exit(0);
  });
});

module.exports = app;
