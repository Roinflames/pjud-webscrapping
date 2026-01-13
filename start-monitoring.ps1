# Script para iniciar el stack completo de monitoreo (PowerShell)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  PJUD Scraper - Iniciando Stack de Monitoreo" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Docker
$dockerExists = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerExists) {
    Write-Host "❌ Docker no está instalado" -ForegroundColor Red
    Write-Host "Por favor instala Docker Desktop: https://www.docker.com/products/docker-desktop"
    exit 1
}

# Verificar Docker Compose
$dockerComposeExists = Get-Command docker-compose -ErrorAction SilentlyContinue
if (-not $dockerComposeExists) {
    Write-Host "❌ Docker Compose no está instalado" -ForegroundColor Red
    exit 1
}

# Verificar Node.js
$nodeExists = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeExists) {
    Write-Host "❌ Node.js no está instalado" -ForegroundColor Red
    Write-Host "Por favor instala Node.js: https://nodejs.org/"
    exit 1
}

Write-Host "✅ Prerequisitos verificados" -ForegroundColor Green
Write-Host ""

# Instalar dependencias de Node.js si es necesario
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias de npm..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
    Write-Host ""
}

# Iniciar Docker Compose
Write-Host "🐳 Iniciando contenedores Docker..." -ForegroundColor Yellow
docker-compose up -d

# Esperar a que los servicios estén listos
Write-Host "⏳ Esperando a que los servicios inicien..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verificar estado de los contenedores
Write-Host ""
Write-Host "📊 Estado de los contenedores:" -ForegroundColor Yellow
docker-compose ps

# Verificar que Prometheus esté corriendo
$prometheusRunning = docker ps | Select-String "pjud-prometheus"
if ($prometheusRunning) {
    Write-Host "✅ Prometheus está corriendo" -ForegroundColor Green
} else {
    Write-Host "❌ Prometheus no está corriendo" -ForegroundColor Red
}

# Verificar que Grafana esté corriendo
$grafanaRunning = docker ps | Select-String "pjud-grafana"
if ($grafanaRunning) {
    Write-Host "✅ Grafana está corriendo" -ForegroundColor Green
} else {
    Write-Host "❌ Grafana no está corriendo" -ForegroundColor Red
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "  Stack de Monitoreo Iniciado" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""

Write-Host "📊 Accede a los servicios:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  🎨 Grafana Dashboard:"
Write-Host "     http://localhost:3000" -ForegroundColor Green
Write-Host "     Usuario: admin / Contraseña: admin"
Write-Host ""
Write-Host "  📈 Prometheus:"
Write-Host "     http://localhost:9090" -ForegroundColor Green
Write-Host ""
Write-Host "  🔔 AlertManager:"
Write-Host "     http://localhost:9093" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 Siguiente paso:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Inicia el servidor de métricas:"
Write-Host "     npm run metrics" -ForegroundColor Green
Write-Host ""
Write-Host "  2. En otra terminal, ejecuta el scraper:"
Write-Host "     npm run scrape" -ForegroundColor Green
Write-Host ""
Write-Host "  3. Observa las métricas en tiempo real en Grafana"
Write-Host ""

Write-Host "📝 Comandos útiles:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Ver logs:          docker-compose logs -f" -ForegroundColor Green
Write-Host "  Detener servicios: docker-compose down" -ForegroundColor Green
Write-Host "  Reiniciar:         docker-compose restart" -ForegroundColor Green
Write-Host ""

Write-Host "¡Listo! 🎉" -ForegroundColor Green
Write-Host ""

# Opcional: Abrir Grafana en el navegador
$openBrowser = Read-Host "¿Quieres abrir Grafana en el navegador? (s/n)"
if ($openBrowser -eq "s" -or $openBrowser -eq "S") {
    Start-Process "http://localhost:3000"
}
