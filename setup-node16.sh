#!/bin/bash
# Script de instalación para Node 16.20.2

set -e

echo "=================================================="
echo "🔧 Setup para Node 16.20.2"
echo "=================================================="
echo ""

# Verificar versión de Node
NODE_VERSION=$(node --version)
echo "📦 Node actual: $NODE_VERSION"

if [[ ! "$NODE_VERSION" =~ ^v16\. ]]; then
    echo "⚠️  ADVERTENCIA: Este proyecto requiere Node 16.x"
    echo "   Versión actual: $NODE_VERSION"
    echo ""
    echo "Para cambiar a Node 16.20.2:"
    echo "  - Con nvm: nvm install 16.20.2 && nvm use 16.20.2"
    echo "  - Con homebrew: brew install node@16"
    echo ""
    read -p "¿Continuar de todas formas? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🗑️  Limpiando instalación anterior..."
rm -rf node_modules package-lock.json

echo ""
echo "📥 Instalando dependencias compatibles con Node 16..."
npm install

echo ""
echo "🎭 Instalando navegador Firefox para Playwright..."
npx playwright install firefox

echo ""
echo "✅ Instalación completada"
echo ""
echo "=================================================="
echo "🧪 Verificación"
echo "=================================================="
node --version
npm list playwright 2>&1 | grep "playwright@"
echo ""

echo "=================================================="
echo "📝 Comandos disponibles:"
echo "=================================================="
echo "  npm run test:5causas:dry    # Test sin ejecutar scraping"
echo "  npm run test:5causas        # Test con 5 causas"
echo "  npm run scrape:batch        # Batch processing"
echo "  npm run api:start           # Iniciar API"
echo ""
echo "✅ Sistema listo para Node 16.20.2"
