# 🚀 Guía Completa de Ejecución del Scraping

## 📋 Requisitos Previos

### 1. Verificar que tienes Node.js instalado:
```bash
node --version
```

### 2. Instalar dependencias:
```bash
npm install
```

### 3. Configurar variables de entorno:
```bash
# Verificar que existe el archivo .env
cat .env

# Si no existe, crearlo:
echo "OJV_URL=https://oficinajudicialvirtual.pjud.cl/home/index.php" > .env
```

---

## 🎯 Ejecutar el Scraping

### Opción 1: Procesar TODAS las causas (3,221 causas)

```bash
node src/process-csv-causas.js 0
```

**Características:**
- ✅ Modo headless (sin ventana del navegador)
- ✅ Procesa todas las causas del CSV
- ✅ Muestra progreso en tiempo real
- ✅ No descarga PDFs duplicados
- ✅ Genera movimientos estructurados

---

### Opción 2: Procesar un número específico de causas

```bash
# Procesar 10 causas
node src/process-csv-causas.js 10

# Procesar 100 causas
node src/process-csv-causas.js 100

# Procesar 500 causas
node src/process-csv-causas.js 500
```

---

### Opción 3: Procesar una causa específica (modo de prueba)

```bash
node src/index.js
```

Este modo usa la configuración de `src/config/pjud_config.json` para procesar una sola causa.

---

## 📊 Qué Verás Durante la Ejecución

### Inicio:
```
🚀 Iniciando procesamiento de TODAS las causas (modo headless)...

📂 Leyendo CSV de causas...
📋 Columnas del CSV: [...]
📊 Causas válidas: 3221
   ✅ Todas las causas con RIT son civiles (competencia = 3)

📊 Causas válidas para procesar: 3221
   Procesando TODAS las causas (3221)
```

### Durante el procesamiento:
```
============================================================
[150/3221] Progreso: 4.7%
⏱️  Tiempo estimado restante: 45.2 minutos
📋 Procesando causa ID: 123 | RIT: C-13786-2018

📋 Procesando causa: C-13786-2018
   Caratulado: PROMOTORA CMR FALABELLA S.A/YÁ
📝 Llenando formulario...
✅ Formulario disponible
📋 Competencia: 3 (Civil - todas las causas con RIT son civiles)
...
✅ Extraídas 29 movimientos
📋 Movimientos estructurados guardados en: movimientos_C_13786_2018.json
📄 Se encontraron 20 PDFs.
⏭️  PDF 1 ya existe, omitiendo: C_13786_2018_doc_1.pdf
⬇️ Descargando PDF 2/20...
📊 Resumen PDFs: 15 descargados, 5 omitidos (ya existían)

📊 Resumen parcial (10/3221):
   ✅ Exitosas: 8 | ❌ Fallidas: 2
```

### Al finalizar:
```
📊 Resumen de procesamiento:
   ✅ Exitosas: 3000
   ❌ Fallidas: 221

📝 Log completo guardado en: src/logs/procesamiento_[timestamp].json

❌ Causas fallidas guardadas en: src/logs/causas_fallidas_[timestamp].json
   Total fallidas: 221
   También guardado en: src/outputs/causas_fallidas.json
```

---

## 📁 Archivos Generados

### Por cada causa exitosa:

1. **`resultado_C_[RIT].json`**
   - Formato array (compatibilidad con código anterior)
   - Ubicación: `src/outputs/`

2. **`resultado_C_[RIT].csv`**
   - CSV con los datos de la tabla
   - Ubicación: `src/outputs/`

3. **`movimientos_C_[RIT].json`** ⭐ NUEVO
   - Movimientos estructurados del PJUD
   - Estructura clara con campos: rit, fecha, caratulado, juzgado, folio
   - Ubicación: `src/outputs/`

4. **`C_[RIT]_doc_N.pdf`**
   - PDFs descargados de la causa
   - Solo descarga los que no existen (evita duplicados)
   - Ubicación: `src/outputs/`

### Al finalizar el proceso:

1. **`causas_fallidas.json`**
   - JSON con todas las causas que NO se pudieron buscar
   - Incluye: causa_id, rit, caratulado, cliente, rut, error
   - Ubicación: `src/outputs/causas_fallidas.json`

2. **`procesamiento_[timestamp].json`**
   - Log completo con todos los resultados
   - Ubicación: `src/logs/`

---

## ⏱️ Tiempo Estimado

- **Por causa**: ~30-60 segundos (depende de cantidad de PDFs)
- **3,221 causas**: ~27-54 horas aproximadamente
- **100 causas**: ~50-100 minutos aproximadamente

**Nota:** El tiempo puede variar según:
- Velocidad de conexión
- Carga del servidor PJUD
- Cantidad de PDFs por causa

---

## 🔄 Reanudar el Scraping

Si el proceso se detiene, puedes reanudarlo:

1. **Los PDFs ya descargados NO se volverán a descargar**
2. **Los archivos JSON/CSV existentes se sobrescribirán**
3. **Ejecuta nuevamente:**
   ```bash
   node src/process-csv-causas.js 0
   ```

El sistema procesará todas las causas, pero omitirá los PDFs que ya existen.

---

## 🛠️ Solución de Problemas

### Error: "No se encontró OJV_URL en .env"
```bash
# Crear archivo .env
echo "OJV_URL=https://oficinajudicialvirtual.pjud.cl/home/index.php" > .env
```

### Error: "No se encontró configuración"
```bash
# Verificar que existe el archivo de configuración
ls src/config/pjud_config.json
```

### El proceso se detiene o falla
- Revisa los logs en `src/logs/`
- Verifica la conexión a internet
- El proceso puede continuar desde donde se quedó (PDFs no se re-descargarán)

---

## 📊 Monitorear el Progreso

### Ver cuántas causas se han procesado:
```bash
ls -1 src/outputs/resultado_*.json | wc -l
```

### Ver cuántos PDFs se han descargado:
```bash
find src/outputs -name "*.pdf" | wc -l
```

### Ver el tamaño total de outputs:
```bash
du -sh src/outputs/
```

### Ver causas fallidas (si el proceso ya terminó):
```bash
cat src/outputs/causas_fallidas.json | jq 'length'
```

---

## 🎯 Ejecución Recomendada

### Para procesar todas las causas:

```bash
# Ejecutar en segundo plano (recomendado para procesos largos)
nohup node src/process-csv-causas.js 0 > scraping.log 2>&1 &

# Ver el progreso en tiempo real
tail -f scraping.log
```

### Para detener el proceso:
```bash
# Encontrar el proceso
ps aux | grep "node src/process-csv-causas.js"

# Detenerlo (reemplaza PID con el número del proceso)
kill PID
```

---

## ✅ Checklist Antes de Ejecutar

- [ ] Node.js instalado (`node --version`)
- [ ] Dependencias instaladas (`npm install`)
- [ ] Archivo `.env` configurado
- [ ] Archivo `causa.csv` existe en la raíz
- [ ] Conexión a internet estable
- [ ] Espacio suficiente en disco (recomendado: al menos 10GB)

---

## 🚀 Comando Rápido

```bash
# Todo en uno: verificar y ejecutar
node --version && npm install && node src/process-csv-causas.js 0
```

¡Listo para ejecutar! 🎉


