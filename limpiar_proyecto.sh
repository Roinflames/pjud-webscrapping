#!/bin/bash

# Script para limpiar archivos innecesarios del proyecto de scraping

echo "🧹 Limpiando proyecto..."

# Crear carpeta para documentación SQL
mkdir -p docs/sql
mkdir -p docs/consultas

# Mover archivos SQL a docs/sql
echo "📁 Moviendo archivos SQL a docs/sql..."
mv *.sql docs/sql/ 2>/dev/null || true

# Mover documentación MD relacionada con BD a docs/
echo "📄 Moviendo documentación de BD a docs..."
mv CONSULTA_DATOS_CAUSA.md docs/ 2>/dev/null || true
mv GUIA_BUSCAR_DATOS.md docs/ 2>/dev/null || true
mv SOLUCION_TABLA_NO_EXISTE.md docs/ 2>/dev/null || true

# Eliminar archivos binarios de Node.js que no deberían estar en el proyecto
echo "🗑️ Eliminando archivos binarios innecesarios..."
rm -f src/npm src/npm.cmd src/npx src/npx.cmd src/nodevars.bat 2>/dev/null || true
rm -f src/node-v16.14.0-x64.msi 2>/dev/null || true
rm -f src/node_etw_provider.man 2>/dev/null || true

# Eliminar archivos que no se usan
echo "🗑️ Eliminando archivos no utilizados..."
rm -f request.php 2>/dev/null || true
rm -f assets/request.json 2>/dev/null || true

# Eliminar helpers.js vacío (si está vacío)
if [ ! -s src/utils/helpers.js ]; then
    echo "🗑️ Eliminando helpers.js vacío..."
    rm -f src/utils/helpers.js 2>/dev/null || true
fi

# Actualizar Run.bat para que apunte al proyecto correcto
echo "✏️ Actualizando Run.bat..."
cat > src/Run.bat << 'EOF'
@echo off
cd /d "%~dp0"
node index.js
pause
EOF

echo "✅ Limpieza completada!"
echo ""
echo "📁 Archivos movidos a docs/"
echo "🗑️ Archivos innecesarios eliminados"
echo ""
echo "Archivos SQL → docs/sql/"
echo "Documentación BD → docs/"



