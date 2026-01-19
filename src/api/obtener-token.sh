#!/bin/bash
# Script para obtener el token de la API

TOKEN_FILE="src/storage/tokens.json"

if [ -f "$TOKEN_FILE" ]; then
    echo "🔑 Token de la API:"
    echo ""
    cat "$TOKEN_FILE" | grep -o '"token": "[^"]*"' | head -1 | cut -d'"' -f4
    echo ""
else
    echo "⚠️  El archivo de tokens aún no existe."
    echo "💡 El token se crea automáticamente cuando inicias el servidor."
    echo ""
    echo "Para iniciar el servidor:"
    echo "  npm run api:start"
fi