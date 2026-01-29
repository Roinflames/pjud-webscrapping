#!/bin/bash

# Script de testing automatizado para PJUD Scraper
# Prueba 3 causas de referencia y valida resultados

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🧪 =========================================="
echo "🧪 Testing Automatizado - PJUD Scraper"
echo "🧪 =========================================="
echo ""

# Causas de referencia para testing
declare -a TEST_CAUSAS=(
  "C-23607-2015"  # 8 movimientos, 8 PDFs, incluye Escritos
  "C-13786-2018"  # 25 movimientos
  "C-1731-2017"   # 14 movimientos
)

# Contadores
PASSED=0
FAILED=0
TOTAL=${#TEST_CAUSAS[@]}

# Función para validar una causa
validate_causa() {
  local RIT=$1
  local RIT_CLEAN=$(echo "$RIT" | sed 's/-/_/g')

  echo ""
  echo "📋 Testing: $RIT"
  echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # 1. Ejecutar scraping
  echo "   🔄 Ejecutando scraping..."
  if node "$PROJECT_DIR/src/scrape-single.js" --rit="$RIT" > /tmp/test_$RIT_CLEAN.log 2>&1; then
    echo "   ✅ Scraping completado sin errores"
  else
    echo "   ❌ ERROR: Scraping falló"
    FAILED=$((FAILED + 1))
    return 1
  fi

  # 2. Verificar archivo JSON de salida
  JSON_FILE="$PROJECT_DIR/src/outputs/causas/${RIT_CLEAN}.json"
  if [ -f "$JSON_FILE" ]; then
    echo "   ✅ JSON generado: ${RIT_CLEAN}.json"
  else
    echo "   ❌ ERROR: JSON no encontrado"
    FAILED=$((FAILED + 1))
    return 1
  fi

  # 3. Verificar cantidad de movimientos > 0
  MOVIMIENTOS=$(cat "$JSON_FILE" | jq -r '.metadata.total_movimientos // 0' 2>/dev/null || echo "0")
  if [ "$MOVIMIENTOS" -gt 0 ]; then
    echo "   ✅ Movimientos extraídos: $MOVIMIENTOS"
  else
    echo "   ⚠️  ADVERTENCIA: 0 movimientos extraídos"
  fi

  # 4. Verificar PDFs descargados
  PDF_COUNT=$(find "$PROJECT_DIR/src/outputs/pdfs_temp" -name "*${RIT_CLEAN}*.pdf" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$PDF_COUNT" -gt 0 ]; then
    echo "   ✅ PDFs descargados: $PDF_COUNT archivos"
  else
    echo "   ⚠️  ADVERTENCIA: 0 PDFs descargados"
  fi

  # 5. Verificar que no haya errores críticos en el log
  ERROR_COUNT=$(grep -c "❌ Error" /tmp/test_$RIT_CLEAN.log 2>/dev/null || echo "0")
  if [ "$ERROR_COUNT" -eq 0 ]; then
    echo "   ✅ Sin errores críticos en log"
  else
    echo "   ⚠️  ADVERTENCIA: $ERROR_COUNT errores encontrados en log"
  fi

  # 6. Validación específica para C-23607-2015 (debe tener 8 PDFs)
  if [ "$RIT" == "C-23607-2015" ]; then
    if [ "$PDF_COUNT" -eq 8 ]; then
      echo "   ✅ Validación especial: 8/8 PDFs (incluye Escritos)"
    else
      echo "   ❌ ERROR: Esperaba 8 PDFs, encontró $PDF_COUNT"
      FAILED=$((FAILED + 1))
      return 1
    fi
  fi

  echo "   ✅ Test PASADO"
  PASSED=$((PASSED + 1))
  return 0
}

# Ejecutar tests
for CAUSA in "${TEST_CAUSAS[@]}"; do
  validate_causa "$CAUSA"
done

# Resumen
echo ""
echo "🧪 =========================================="
echo "🧪 Resumen de Tests"
echo "🧪 =========================================="
echo "   Total:   $TOTAL causas"
echo "   Pasados: $PASSED ✅"
echo "   Fallidos: $FAILED ❌"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "🎉 ¡Todos los tests pasaron exitosamente!"
  exit 0
else
  echo "⚠️  Algunos tests fallaron. Revisar logs en /tmp/test_*.log"
  exit 1
fi
