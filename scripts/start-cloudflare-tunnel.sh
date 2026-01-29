#!/bin/bash

# Script para iniciar el servidor API y Cloudflare Tunnel
# Uso: ./scripts/start-cloudflare-tunnel.sh

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 =========================================="
echo "🚀 Iniciando PJUD Scraper API + Cloudflare"
echo "🚀 =========================================="
echo ""

# Verificar que cloudflared esté instalado
if ! command -v cloudflared &> /dev/null; then
    echo "❌ ERROR: cloudflared no está instalado"
    echo "   Instalar con: brew install cloudflare/cloudflare/cloudflared"
    exit 1
fi

echo "✅ cloudflared instalado: $(which cloudflared)"
echo ""

# Verificar que Node.js esté disponible
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js no está instalado"
    exit 1
fi

echo "✅ Node.js instalado: $(node --version)"
echo ""

# Paso 1: Iniciar el servidor API en background
echo "📡 Paso 1/3: Iniciando servidor API..."
cd "$PROJECT_DIR"

# Verificar si ya hay un servidor corriendo
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Puerto 3000 ya está en uso. Deteniendo proceso anterior..."
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Iniciar servidor API
nohup npm run api:start > /tmp/pjud-api.log 2>&1 &
API_PID=$!

echo "   Esperando que el servidor API inicie..."
sleep 3

# Verificar que el servidor esté corriendo
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "   ✅ Servidor API corriendo en http://localhost:3000"
    echo "   📝 PID: $API_PID"
    echo "   📋 Logs: tail -f /tmp/pjud-api.log"
else
    echo "   ❌ ERROR: El servidor API no inició correctamente"
    echo "   Ver logs: cat /tmp/pjud-api.log"
    exit 1
fi

echo ""

# Paso 2: Verificar autenticación de Cloudflare
echo "🔐 Paso 2/3: Verificando autenticación de Cloudflare..."

if [ ! -f "$HOME/.cloudflared/cert.pem" ] && [ ! -f "$HOME/.cloudflared/credentials.json" ]; then
    echo "⚠️  No se encontró autenticación de Cloudflare"
    echo ""
    echo "📋 Pasos para autenticar:"
    echo "   1. Ejecutar: cloudflared tunnel login"
    echo "   2. Se abrirá un navegador para autorizar el túnel"
    echo "   3. Seleccionar el dominio donde quieres el túnel"
    echo "   4. Volver a ejecutar este script"
    echo ""
    echo "🔗 Documentación: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/"
    exit 1
fi

echo "   ✅ Autenticación de Cloudflare encontrada"
echo ""

# Paso 3: Iniciar Cloudflare Tunnel
echo "🌐 Paso 3/3: Iniciando Cloudflare Tunnel..."

# Opción 1: Túnel rápido (sin configuración)
echo ""
echo "   Selecciona el modo de túnel:"
echo "   1) Túnel rápido (temporal, sin dominio)"
echo "   2) Túnel configurado (requiere setup previo)"
echo ""
read -p "   Opción (1 o 2): " TUNNEL_MODE

if [ "$TUNNEL_MODE" == "1" ]; then
    echo ""
    echo "🚀 Iniciando túnel rápido..."
    echo "   ⚠️  Este túnel es temporal y se cerrará al detener el script"
    echo ""

    # Iniciar túnel rápido
    cloudflared tunnel --url http://localhost:3000

elif [ "$TUNNEL_MODE" == "2" ]; then
    echo ""
    echo "🚀 Iniciando túnel configurado..."

    # Verificar si existe el archivo de configuración
    if [ ! -f "$PROJECT_DIR/cloudflare-tunnel.yaml" ]; then
        echo "   ❌ ERROR: No se encontró cloudflare-tunnel.yaml"
        echo "   Ejecutar primero: cloudflared tunnel create pjud-scraper-api"
        exit 1
    fi

    # Iniciar túnel configurado
    cloudflared tunnel --config "$PROJECT_DIR/cloudflare-tunnel.yaml" run pjud-scraper-api

else
    echo "   ❌ Opción inválida"
    exit 1
fi

# Cleanup al detener el script
trap "echo '\n🛑 Deteniendo servicios...'; kill $API_PID 2>/dev/null; exit" INT TERM EXIT
