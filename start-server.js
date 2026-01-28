/**
 * Servidor de desarrollo con reverse proxy
 *
 * Levanta:
 *   - PHP built-in server en puerto 8081 (sirve public/)
 *   - Node.js proxy en puerto 3001 que redirige todo al PHP server
 *   - Opcionalmente, el API server de Node.js en puerto 3000
 *
 * Uso:
 *   node start-server.js
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const PHP_PORT = 8081;
const PROXY_PORT = 3001;
const PUBLIC_DIR = path.join(__dirname, 'public');

// 1. Iniciar PHP built-in server
console.log(`\n[PHP] Iniciando servidor PHP en puerto ${PHP_PORT}...`);
const phpServer = spawn('php', ['-S', `localhost:${PHP_PORT}`, '-t', PUBLIC_DIR], {
  stdio: ['ignore', 'pipe', 'pipe']
});

phpServer.stdout.on('data', (data) => {
  const line = data.toString().trim();
  if (line) console.log(`[PHP] ${line}`);
});

phpServer.stderr.on('data', (data) => {
  const line = data.toString().trim();
  if (line && !line.includes('Development Server')) {
    console.log(`[PHP] ${line}`);
  }
});

phpServer.on('error', (err) => {
  console.error('[PHP] Error al iniciar servidor PHP:', err.message);
  process.exit(1);
});

// 2. Crear reverse proxy
const proxy = http.createServer((req, res) => {
  const options = {
    hostname: 'localhost',
    port: PHP_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('[PROXY] Error:', err.message);
    res.writeHead(502);
    res.end('Bad Gateway');
  });

  req.pipe(proxyReq);
});

// Esperar un segundo para que PHP levante
setTimeout(() => {
  proxy.listen(PROXY_PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('  SERVIDOR DE DESARROLLO');
    console.log('='.repeat(50));
    console.log(`  PHP Server:   http://localhost:${PHP_PORT}`);
    console.log(`  Reverse Proxy: http://localhost:${PROXY_PORT}`);
    console.log(`  Directorio:    ${PUBLIC_DIR}`);
    console.log('='.repeat(50));
    console.log(`\n  Abrir: http://localhost:${PROXY_PORT}\n`);
  });
}, 1000);

// Cleanup
function cleanup() {
  console.log('\n[SHUTDOWN] Deteniendo servidores...');
  phpServer.kill();
  proxy.close();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

phpServer.on('close', (code) => {
  if (code !== null) {
    console.log(`[PHP] Servidor PHP terminado con codigo ${code}`);
  }
});
