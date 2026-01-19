#!/bin/bash

# Script para respaldar y limpiar archivos generados por el scraping
# Comprime todos los archivos en un RAR y luego los elimina

OUTPUT_DIR="src/outputs"
BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RAR_FILE="${BACKUP_DIR}/scraping_backup_${TIMESTAMP}.rar"

# Crear directorio de backups si no existe
mkdir -p "${BACKUP_DIR}"

echo "📦 Respaldando archivos del scraping..."

# Contar archivos a respaldar
JSON_COUNT=$(find "${OUTPUT_DIR}" -name "resultado_*.json" -o -name "movimientos_*.json" | wc -l | tr -d ' ')
CSV_COUNT=$(find "${OUTPUT_DIR}" -name "resultado_*.csv" | wc -l | tr -d ' ')
PDF_COUNT=$(find "${OUTPUT_DIR}" -name "*_doc_*.pdf" | wc -l | tr -d ' ')

echo "   📄 JSONs encontrados: ${JSON_COUNT}"
echo "   📊 CSVs encontrados: ${CSV_COUNT}"
echo "   📑 PDFs encontrados: ${PDF_COUNT}"

# Verificar si hay archivos para respaldar
TOTAL_FILES=$((JSON_COUNT + CSV_COUNT + PDF_COUNT))

if [ "${TOTAL_FILES}" -eq 0 ]; then
    echo "   ℹ️  No hay archivos para respaldar"
    exit 0
fi

# Crear RAR con todos los archivos generados
echo "   📦 Comprimiendo archivos en ${RAR_FILE}..."

# Verificar si rar está instalado
if command -v rar &> /dev/null; then
    # Usar rar si está disponible
    rar a -r "${RAR_FILE}" "${OUTPUT_DIR}/resultado_*.json" \
        "${OUTPUT_DIR}/resultado_*.csv" \
        "${OUTPUT_DIR}/movimientos_*.json" \
        "${OUTPUT_DIR}/*_doc_*.pdf" \
        > /dev/null 2>&1
elif command -v zip &> /dev/null; then
    # Usar zip como alternativa (cambiar extensión)
    RAR_FILE="${RAR_FILE%.rar}.zip"
    cd "${OUTPUT_DIR}" && zip -q -r "../${RAR_FILE}" \
        resultado_*.json \
        resultado_*.csv \
        movimientos_*.json \
        *_doc_*.pdf 2>/dev/null
    cd - > /dev/null
else
    echo "   ❌ Error: No se encontró 'rar' ni 'zip'. Instala uno de ellos."
    echo "      macOS: brew install rar  o  brew install zip"
    exit 1
fi

if [ $? -eq 0 ]; then
    # Obtener tamaño del archivo
    if [ -f "${RAR_FILE}" ]; then
        FILE_SIZE=$(du -h "${RAR_FILE}" | cut -f1)
        echo "   ✅ Backup creado: ${RAR_FILE} (${FILE_SIZE})"
    else
        echo "   ⚠️  El archivo de backup podría no haberse creado correctamente"
    fi
    
    # Eliminar archivos originales
    echo "   🗑️  Eliminando archivos originales..."
    
    find "${OUTPUT_DIR}" -name "resultado_*.json" -delete
    find "${OUTPUT_DIR}" -name "resultado_*.csv" -delete
    find "${OUTPUT_DIR}" -name "movimientos_*.json" -delete
    find "${OUTPUT_DIR}" -name "*_doc_*.pdf" -delete
    
    echo "   ✅ Archivos eliminados"
    echo "   📦 Backup guardado en: ${RAR_FILE}"
else
    echo "   ❌ Error al crear el backup. Los archivos NO fueron eliminados."
    exit 1
fi


