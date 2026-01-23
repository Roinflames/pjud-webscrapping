#!/bin/bash
# Script para actualizar las variables DB_ en .env

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Archivo .env no encontrado"
    exit 1
fi

echo "📝 Actualizando variables DB_ en .env..."

# Backup del archivo original
cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

# Actualizar o agregar variables DB_
if grep -q "^DB_HOST=" "$ENV_FILE"; then
    sed -i '' 's/^DB_HOST=.*/DB_HOST=localhost/' "$ENV_FILE"
else
    echo "DB_HOST=localhost" >> "$ENV_FILE"
fi

if grep -q "^DB_PORT=" "$ENV_FILE"; then
    sed -i '' 's/^DB_PORT=.*/DB_PORT=3306/' "$ENV_FILE"
else
    echo "DB_PORT=3306" >> "$ENV_FILE"
fi

if grep -q "^DB_USER=" "$ENV_FILE"; then
    sed -i '' 's/^DB_USER=.*/DB_USER=root/' "$ENV_FILE"
else
    echo "DB_USER=root" >> "$ENV_FILE"
fi

if grep -q "^DB_PASSWORD=" "$ENV_FILE"; then
    sed -i '' 's/^DB_PASSWORD=.*/DB_PASSWORD=/' "$ENV_FILE"
else
    echo "DB_PASSWORD=" >> "$ENV_FILE"
fi

if grep -q "^DB_NAME=" "$ENV_FILE"; then
    sed -i '' 's/^DB_NAME=.*/DB_NAME=pjud_scraping/' "$ENV_FILE"
else
    echo "DB_NAME=pjud_scraping" >> "$ENV_FILE"
fi

echo "✅ .env actualizado correctamente"
echo ""
echo "📋 Configuración aplicada:"
echo "   DB_HOST=localhost"
echo "   DB_PORT=3306"
echo "   DB_USER=root"
echo "   DB_PASSWORD=(vacío)"
echo "   DB_NAME=pjud_scraping"
echo ""
echo "🧪 Prueba la conexión con:"
echo "   node test-db-connection.js"
