#!/bin/bash

# Script para iniciar todos los servicios con Cloudflare Tunnel
# Arquitectura:
#   - Symfony (puerto 8000) → BD: codi_ejamtest
#   - API + Front (puerto 3000) → BD: pjud_api
#   - Cloudflare Tunnel → Expone ambos servicios

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 =========================================="
echo "🚀 Iniciando PJUD Scraper - Todos los Servicios"
echo "🚀 =========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para verificar si un puerto está en uso
check_port() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Función para detener proceso en un puerto
stop_port() {
    if check_port $1; then
        echo -e "${YELLOW}⚠️  Puerto $1 en uso. Deteniendo proceso...${NC}"
        lsof -ti :$1 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

echo "📋 Verificando requisitos..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ ERROR: Node.js no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"

# Verificar PHP
if ! command -v php &> /dev/null; then
    echo -e "${RED}❌ ERROR: PHP no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✅ PHP: $(php --version | head -1)${NC}"

# Verificar Cloudflared
if ! command -v cloudflared &> /dev/null; then
    echo -e "${RED}❌ ERROR: cloudflared no está instalado${NC}"
    echo "   Instalar con: brew install cloudflare/cloudflare/cloudflared"
    exit 1
fi
echo -e "${GREEN}✅ cloudflared instalado${NC}"

# Verificar MySQL
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}⚠️  MySQL CLI no encontrado (opcional)${NC}"
else
    echo -e "${GREEN}✅ MySQL disponible${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 PASO 1: Iniciando Servidor API (puerto 3000)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

stop_port 3000

cd "$PROJECT_DIR"
nohup npm run api:start > /tmp/pjud-api.log 2>&1 &
API_PID=$!

echo "   Esperando que el servidor API inicie..."
sleep 4

if check_port 3000; then
    echo -e "${GREEN}   ✅ Servidor API corriendo en http://localhost:3000${NC}"
    echo "   📝 PID: $API_PID"
    echo "   📋 Logs: tail -f /tmp/pjud-api.log"
    echo "   🗄️  Base de datos: pjud_api"
else
    echo -e "${RED}   ❌ ERROR: El servidor API no inició${NC}"
    echo "   Ver logs: cat /tmp/pjud-api.log"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 PASO 2: Iniciando Symfony App (puerto 8000)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

stop_port 8000

cd "$PROJECT_DIR/symfony-app"
nohup php -S localhost:8000 -t public > /tmp/pjud-symfony.log 2>&1 &
SYMFONY_PID=$!

echo "   Esperando que Symfony inicie..."
sleep 3

if check_port 8000; then
    echo -e "${GREEN}   ✅ Symfony corriendo en http://localhost:8000${NC}"
    echo "   📝 PID: $SYMFONY_PID"
    echo "   📋 Logs: tail -f /tmp/pjud-symfony.log"
    echo "   🗄️  Base de datos: codi_ejamtest"
else
    echo -e "${RED}   ❌ ERROR: Symfony no inició${NC}"
    echo "   Ver logs: cat /tmp/pjud-symfony.log"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 PASO 3: Iniciando Cloudflare Tunnel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "   Selecciona el modo de túnel:"
echo ""
echo "   1) Túnel rápido (temporal, 2 URLs aleatorias)"
echo "   2) Túnel configurado (requiere dominio y setup previo)"
echo ""
read -p "   Opción (1 o 2): " TUNNEL_MODE

if [ "$TUNNEL_MODE" == "1" ]; then
    echo ""
    echo "🚀 Iniciando 2 túneles rápidos..."
    echo "   ⚠️  Estos túneles son temporales y cambiarán si reinicias"
    echo ""

    # Túnel 1: API (puerto 3000)
    nohup cloudflared tunnel --url http://localhost:3000 > /tmp/cloudflared-api.log 2>&1 &
    TUNNEL_API_PID=$!

    # Túnel 2: Symfony (puerto 8000)
    nohup cloudflared tunnel --url http://localhost:8000 > /tmp/cloudflared-symfony.log 2>&1 &
    TUNNEL_SYMFONY_PID=$!

    echo "   Esperando que los túneles inicien..."
    sleep 6

    # Obtener URLs
    API_URL=$(grep -o "https://[a-z0-9-]*\.trycloudflare\.com" /tmp/cloudflared-api.log | head -1)
    SYMFONY_URL=$(grep -o "https://[a-z0-9-]*\.trycloudflare\.com" /tmp/cloudflared-symfony.log | head -1)

    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}   ✅ Todos los servicios están corriendo${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "📡 URLs Públicas:"
    echo ""
    echo -e "   🌐 ${GREEN}API + Documentación:${NC}"
    echo "      $API_URL"
    echo "      $API_URL/api/health"
    echo "      Base de datos: pjud_api"
    echo ""
    echo -e "   🌐 ${GREEN}Symfony App:${NC}"
    echo "      $SYMFONY_URL"
    echo "      Base de datos: codi_ejamtest"
    echo ""
    echo "📋 Servicios Locales:"
    echo "   API:     http://localhost:3000 (PID: $API_PID)"
    echo "   Symfony: http://localhost:8000 (PID: $SYMFONY_PID)"
    echo ""
    echo "📝 Logs:"
    echo "   API:           tail -f /tmp/pjud-api.log"
    echo "   Symfony:       tail -f /tmp/pjud-symfony.log"
    echo "   Tunnel API:    tail -f /tmp/cloudflared-api.log"
    echo "   Tunnel Symfony: tail -f /tmp/cloudflared-symfony.log"
    echo ""
    echo "🛑 Para detener todos los servicios:"
    echo "   pkill -f cloudflared && kill $API_PID $SYMFONY_PID"
    echo ""

    # Mantener el script corriendo
    echo "Presiona Ctrl+C para detener todos los servicios..."
    trap "echo '\n🛑 Deteniendo servicios...'; pkill -f cloudflared; kill $API_PID $SYMFONY_PID 2>/dev/null; exit" INT TERM
    wait

elif [ "$TUNNEL_MODE" == "2" ]; then
    echo ""
    echo "🚀 Iniciando túnel configurado..."

    if [ ! -f "$PROJECT_DIR/cloudflare-tunnel.yaml" ]; then
        echo -e "${RED}   ❌ ERROR: No se encontró cloudflare-tunnel.yaml${NC}"
        echo "   Ejecutar primero: cloudflared tunnel create pjud-scraper"
        exit 1
    fi

    # Iniciar túnel configurado
    cloudflared tunnel --config "$PROJECT_DIR/cloudflare-tunnel.yaml" run pjud-scraper

else
    echo -e "${RED}   ❌ Opción inválida${NC}"
    exit 1
fi
