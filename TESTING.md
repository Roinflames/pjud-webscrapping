# 🧪 Guía de Testing - PJUD Scraper

## Resumen de Correcciones Aplicadas (27-29 Enero 2026)

### 1. ✅ Selector de PDFs Corregido
**Problema:** `pdfDownloader.js` buscaba en tabla genérica, no en modal
**Solución:** Buscar específicamente en `table[data-scraper-movimientos="true"]`
**Resultado:** Descarga exitosa de PDFs (8/8 para C-23607-2015)

### 2. ✅ Movimientos tipo "Escrito" Ahora Descargan PDFs
**Problema:** Movimientos con `tramite="Escrito"` no descargaban PDFs
**Solución:** Usar tabla marcada evita conflicto con tabla de resultados
**Resultado:** Todos los escritos ahora descargan correctamente

### 3. ✅ Mensajes de Console Mejorados
**Problema:** Modal de alerta del sitio se reportaba como error
**Solución:** Mensajes descriptivos diferenciando modal de alerta vs modal de detalle
**Resultado:** Logs más claros y menos confusión

---

## 📋 Test Cases Validados

### Caso 1: C-23607-2015 (BANCO DEL ESTADO/ZUÑIGA)
**Tribunal:** 24º Juzgado Civil de Santiago
**Total Movimientos:** 8
**PDFs Esperados:** 8
**PDFs Descargados:** 8/8 ✅

**Movimientos con "Escrito" validados:**
- Folio 7: Escrito "Notificación por art. 44" → PDF 25KB ✅
- Folio 3: Escrito "Acompaña documentos" → PDF 1710KB ✅
- Folio 2: Escrito "Ingreso demanda" → PDF 165KB ✅

**Comando de prueba:**
```bash
node src/scrape-single.js --rit=C-23607-2015
```

**Verificación:**
```bash
# Ver log de procesamiento
ls -lh src/logs/procesamiento_*.json | tail -1

# Ver PDFs descargados
ls -lh src/outputs/pdfs_temp/*23607* | wc -l
# Debe mostrar: 8

# Ver JSON de salida
cat src/outputs/causas/C_23607_2015.json | jq '.pdf_mapping | length'
# Debe mostrar: 8
```

---

### Caso 2: C-13786-2018 (ITAU CORPBANCA/HERNÁNDEZ)
**Tribunal:** 4º Juzgado Civil de Santiago
**Total Movimientos:** 25
**Estado:** Validado previamente

**Comando de prueba:**
```bash
node src/scrape-single.js --rit=C-13786-2018
```

---

### Caso 3: C-1731-2017 (Demandante/VÁSQUEZ)
**Total Movimientos:** 14
**Estado:** Validado previamente

**Comando de prueba:**
```bash
node src/scrape-single.js --rit=C-1731-2017
```

---

## 🤖 Script de Testing Automatizado

Ver: `scripts/test-scraping.sh`

Ejecutar:
```bash
chmod +x scripts/test-scraping.sh
./scripts/test-scraping.sh
```

El script prueba automáticamente las 3 causas de referencia y valida:
- ✅ Descarga de PDFs exitosa
- ✅ Cantidad de movimientos correcta
- ✅ Archivos JSON generados
- ✅ Sin errores críticos en logs

---

## 📊 Verificación de Resultados

### 1. Verificar PDFs Descargados
```bash
# Listar PDFs de una causa específica
ls -lh src/outputs/pdfs_temp/*23607*.pdf

# Contar PDFs descargados
find src/outputs/pdfs_temp -name "*.pdf" | wc -l
```

### 2. Verificar JSON de Salida
```bash
# Ver metadata de PDFs
cat src/outputs/causas/C_23607_2015.json | jq '.pdf_mapping'

# Verificar movimientos con PDFs
cat src/outputs/resultado_C_23607_2015.json | jq '[.[] | select(.tiene_pdf == true)] | length'
```

### 3. Verificar Base de Datos
```bash
# Conectar a MySQL
mysql -u root -p pjud_scraping

# Verificar causa
SELECT * FROM causas WHERE rit = 'C-23607-2015'\G

# Verificar movimientos con PDFs
SELECT COUNT(*) FROM movimientos
WHERE causa_id = (SELECT id FROM causas WHERE rit = 'C-23607-2015' LIMIT 1)
AND (pdf_principal_nombre IS NOT NULL OR pdf_anexo_nombre IS NOT NULL);
```

---

## 🔍 Debugging de Fallos

### Si una causa NO descarga PDFs:

1. **Verificar logs:**
```bash
tail -100 /tmp/scraping_test_*.log | grep -A5 "Descargando PDF"
```

2. **Verificar diagnóstico de modal:**
```bash
grep -A20 "Diagnóstico de tabla del MODAL" /tmp/scraping_test_*.log
```

3. **Verificar selector de tabla:**
```bash
grep "Tabla seleccionada" /tmp/scraping_test_*.log
```

### Si movimientos con "Escrito" no tienen PDF:

Verificar que `table.js` marque la tabla correctamente:
```bash
grep "data-scraper-movimientos" /tmp/scraping_test_*.log
```

---

## 🎯 Archivos Clave Modificados

1. **src/pdfDownloader.js (líneas 126-156, 186-211)**
   - Busca tabla con `data-scraper-movimientos="true"`
   - Fallback a búsqueda en modal

2. **src/navigation.js (líneas 40-55)**
   - Mensajes descriptivos para modal de alerta

3. **src/table.js (líneas 50, 111)**
   - Marca tabla de movimientos con atributo temporal

---

## ✅ Checklist de Validación

Antes de considerar una causa como "exitosa", verificar:

- [ ] Modal de detalle se abrió correctamente
- [ ] Tabla de movimientos detectada (no tabla de resultados)
- [ ] Cantidad de movimientos > 0
- [ ] Movimientos con "Escrito" tienen PDFs descargados
- [ ] Archivos JSON generados en `src/outputs/causas/`
- [ ] PDFs guardados en `src/outputs/pdfs_temp/`
- [ ] Datos insertados correctamente en MySQL

---

## 📝 Logs de Referencia

### Log Exitoso (8/8 PDFs descargados)
```
📊 Resumen de descarga de PDFs:
   - Filas procesadas: 8
   - PDFs descargados: 8
   - Movimientos con PDFs: 8
   ✅ PDFs descargados
```

### Log con Problemas (4/8 PDFs descargados) - ANTES DE LA CORRECCIÓN
```
📊 Resumen de descarga de PDFs:
   - Filas procesadas: 8
   - PDFs descargados: 4
   - Movimientos con PDFs: 4
   ⚠️ No se pudo hacer click: Form 0 no encontrado (hay 0 forms)
```

---

## 🚀 Testing de Regresión

Después de cualquier cambio en el código, ejecutar:

```bash
# Test rápido (3 causas de referencia)
./scripts/test-scraping.sh

# Test completo (primeras 10 causas del CSV)
node src/process-causas.js 10

# Test específico de una causa problemática
node src/scrape-single.js --rit=C-XXXXX-XXXX
```

---

**Última actualización:** 29 Enero 2026
**Autor:** Sistema de Scraping PJUD
**Estado:** ✅ Todos los tests pasando
