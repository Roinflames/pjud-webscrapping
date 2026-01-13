#!/bin/bash
# Script para iniciar el stack completo de monitoreo

echo "=================================================="
echo "  PJUD Scraper - Iniciando Stack de Monitoreo"
echo "=================================================="

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para verificar si un comando existe
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Verificar Docker
if ! command_exists docker; then
  echo -e "${RED}❌ Docker no está instalado${NC}"
  echo "Por favor instala Docker Desktop: https://www.docker.com/products/docker-desktop"
  exit 1
fi

# Verificar Docker Compose
if ! command_exists docker-compose; then
  echo -e "${RED}❌ Docker Compose no está instalado${NC}"
  exit 1
fi

# Verificar Node.js
if ! command_exists node; then
  echo -e "${RED}❌ Node.js no está instalado${NC}"
  echo "Por favor instala Node.js: https://nodejs.org/"
  exit 1
fi

echo -e "${GREEN}✅ Prerequisitos verificados${NC}\n"

# Instalar dependencias de Node.js si es necesario
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}📦 Instalando dependencias de npm...${NC}"
  npm install
  echo -e "${GREEN}✅ Dependencias instaladas${NC}\n"
fi

# Iniciar Docker Compose
echo -e "${YELLOW}🐳 Iniciando contenedores Docker...${NC}"
docker-compose up -d

# Esperar a que los servicios estén listos
echo -e "${YELLOW}⏳ Esperando a que los servicios inicien...${NC}"
sleep 5

# Verificar estado de los contenedores
echo -e "\n${YELLOW}📊 Estado de los contenedores:${NC}"
docker-compose ps

# Verificar que Prometheus esté corriendo
if docker ps | grep -q pjud-prometheus; then
  echo -e "${GREEN}✅ Prometheus está corriendo${NC}"
else
  echo -e "${RED}❌ Prometheus no está corriendo${NC}"
fi

# Verificar que Grafana esté corriendo
if docker ps | grep -q pjud-grafana; then
  echo -e "${GREEN}✅ Grafana está corriendo${NC}"
else
  echo -e "${RED}❌ Grafana no está corriendo${NC}"
fi

echo -e "\n${GREEN}=================================================="
echo "  Stack de Monitoreo Iniciado"
echo "==================================================${NC}\n"

echo -e "${YELLOW}📊 Accede a los servicios:${NC}"
echo ""
echo -e "  🎨 Grafana Dashboard:"
echo -e "     ${GREEN}http://localhost:3000${NC}"
echo -e "     Usuario: admin / Contraseña: admin"
echo ""
echo -e "  📈 Prometheus:"
echo -e "     ${GREEN}http://localhost:9090${NC}"
echo ""
echo -e "  🔔 AlertManager:"
echo -e "     ${GREEN}http://localhost:9093${NC}"
echo ""

echo -e "${YELLOW}🚀 Siguiente paso:${NC}"
echo ""
echo -e "  1. Inicia el servidor de métricas:"
echo -e "     ${GREEN}npm run metrics${NC}"
echo ""
echo -e "  2. En otra terminal, ejecuta el scraper:"
echo -e "     ${GREEN}npm run scrape${NC}"
echo ""
echo -e "  3. Observa las métricas en tiempo real en Grafana"
echo ""

echo -e "${YELLOW}📝 Comandos útiles:${NC}"
echo ""
echo -e "  Ver logs:          ${GREEN}docker-compose logs -f${NC}"
echo -e "  Detener servicios: ${GREEN}docker-compose down${NC}"
echo -e "  Reiniciar:         ${GREEN}docker-compose restart${NC}"
echo ""

echo -e "${GREEN}¡Listo! 🎉${NC}\n"
