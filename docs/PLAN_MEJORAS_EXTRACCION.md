# Plan de Mejoras: Extracción de Información Completa

## 🎯 Objetivo General
Extraer toda la información disponible de la causa judicial desde el modal de detalle, incluyendo header, tabla de movimientos con diferenciación de PDFs, y normalización de filtros.

---

## 📋 Tareas Identificadas

### 1. **Extraer Información del Header del Modal** ⚠️ PRIORITARIO

**URL**: `https://oficinajudicialvirtual.pjud.cl/indexN.php#modalDetalleCivil`

**Información a extraer del header:**
```
ROL: C-1370-2020
F. Ing.: 30/09/2020
PROMOTORA CMR FALABELLA S.
Est. Adm.: Sin archivar
Proc.: Ejecutivo Obligación de Dar
Ubicación: Digital
Estado Proc.: Tramitación
Etapa: 2 Excepciones
Tribunal: 1º Juzgado De Letras De Talagante
```

**Estructura JSON esperada:**
```json
{
  "causa": {
    "rit": "C-1370-2020",
    "fecha_ingreso": "30/09/2020",
    "caratulado": "PROMOTORA CMR FALABELLA S.",
    "estado_administrativo": "Sin archivar",
    "procedimiento": "Ejecutivo Obligación de Dar",
    "ubicacion": "Digital",
    "estado_procesal": "Tramitación",
    "etapa": "2 Excepciones",
    "tribunal": "1º Juzgado De Letras De Talagante"
  }
}
```

**Archivos a modificar:**
- `src/form.js` - Agregar función para extraer header del modal
- `src/dataProcessor.js` - Agregar función para procesar header
- `src/exporter.js` - Incluir header en JSON estructurado

---

### 2. **Diferenciar PDFs por Color de Icono** 🔴🔵

**Problema identificado:**
- Los PDFs tienen iconos de diferentes colores (rojo y azul)
- Los iconos azules = Documentos oficiales del tribunal
- Los iconos rojos = Documentos subidos por el abogado

**Cambios necesarios:**
- Identificar el color del icono antes de descargar
- Agregar campo `tipo_pdf` en el movimiento: `"oficial"` o `"abogado"`
- Guardar PDFs en carpetas separadas o con prefijo diferente

**Estructura esperada:**
```json
{
  "indice": 14,
  "tiene_pdf": true,
  "tipo_pdf": "oficial", // o "abogado"
  "pdf_path": "16707_2019_doc_14_oficial.pdf",
  "pdf_ruta_completa": "outputs/oficiales/16707_2019_doc_14.pdf"
}
```

**Archivos a modificar:**
- `src/pdfDownloader.js` - Detectar color del icono
- `src/dataProcessor.js` - Agregar campo `tipo_pdf`
- `src/exporter.js` - Incluir tipo_pdf en JSON

---

### 3. **Separar Información de Tabla por Tópicos** 📊

**Columnas de la tabla de movimientos:**
```
Folio | Doc. | Anexo | Etapa | Trámite | Desc. Trámite | Fec. Trámite | Foja | Georref.
```

**Estructura esperada:**
```json
{
  "movimientos": [
    {
      "indice": 14,
      "folio": "...",
      "documento": "...",
      "anexo": "...",
      "etapa": "...",
      "tramite": "...",
      "descripcion_tramite": "...",
      "fecha_tramite": "...",
      "foja": "...",
      "georref": "..."
    }
  ]
}
```

**Archivos a modificar:**
- `src/table.js` - Extraer todas las columnas de la tabla
- `src/dataProcessor.js` - Mapear columnas a campos descriptivos

---

### 4. **Normalizar Filtros de Corte y Tribunal** 🎯

**Problema identificado:**
- Antes de llegar al detalle, se listan varias causas con distintas lupas
- Los números de corte y tribunal no tienen lista definida
- Se obtienen más resultados de los necesarios
- Necesitamos filtro más específico (corte + tribunal específico)

**Solución propuesta:**
- Validar que la causa encontrada coincida exactamente con el RIT buscado
- Si hay múltiples resultados, verificar que coincida el RIT exacto
- Agregar validación después de buscar para confirmar que es la causa correcta
- Opcional: Normalizar códigos de corte y tribunal a nombres/IDs consistentes

**Archivos a modificar:**
- `src/form.js` - Agregar validación post-búsqueda
- `src/navigation.js` - Verificar que el resultado es el correcto

---

### 5. **Estructura de JSON Final Mejorada** 📄

**Estructura completa esperada:**
```json
{
  "causa": {
    "rit": "C-1370-2020",
    "fecha_ingreso": "30/09/2020",
    "caratulado": "PROMOTORA CMR FALABELLA S.",
    "estado_administrativo": "Sin archivar",
    "procedimiento": "Ejecutivo Obligación de Dar",
    "ubicacion": "Digital",
    "estado_procesal": "Tramitación",
    "etapa": "2 Excepciones",
    "tribunal": "1º Juzgado De Letras De Talagante"
  },
  "metadata": { ... },
  "estado_actual": { ... },
  "movimientos": [
    {
      "indice": 1,
      "folio": "...",
      "documento": "...",
      "anexo": "...",
      "etapa": "...",
      "tramite": "...",
      "descripcion_tramite": "...",
      "fecha_tramite": "...",
      "foja": "...",
      "georref": "...",
      "tiene_pdf": true,
      "tipo_pdf": "oficial",
      "pdf_path": "...",
      "pdf_ruta_completa": "..."
    }
  ],
  "partes": [ ... ]
}
```

---

## 🔄 Orden de Implementación

### Fase 1: Extracción del Header (ALTA PRIORIDAD)
1. ✅ Crear función `extractHeaderInfo()` en `form.js`
2. ✅ Procesar header en `dataProcessor.js`
3. ✅ Incluir en JSON estructurado
4. ✅ Testear con una causa

### Fase 2: Diferenciación de PDFs (MEDIA PRIORIDAD)
1. ✅ Identificar selector para iconos rojos vs azules
2. ✅ Modificar `pdfDownloader.js` para detectar color
3. ✅ Agregar campo `tipo_pdf` en movimientos
4. ✅ Organizar PDFs por tipo (opcional: carpetas separadas)

### Fase 3: Separación por Tópicos de Tabla (ALTA PRIORIDAD)
1. ✅ Verificar que `table.js` extrae todas las columnas
2. ✅ Mapear columnas a campos descriptivos
3. ✅ Actualizar estructura JSON

### Fase 4: Normalización de Filtros (MEDIA PRIORIDAD)
1. ✅ Agregar validación post-búsqueda de RIT
2. ✅ Verificar que la causa encontrada es la correcta
3. ✅ Opcional: Normalizar códigos de corte/tribunal

---

## 📝 Notas Técnicas

### Selectores a verificar:
- Header del modal: `#modalDetalleCivil .modal-header` o similar
- Iconos PDF rojos: `i.fa-file-pdf-o.text-danger` o similar
- Iconos PDF azules: `i.fa-file-pdf-o.text-primary` o similar
- Columnas de tabla: Verificar todas las `<th>` en header

### Validaciones necesarias:
- Verificar que el RIT encontrado coincide con el buscado
- Validar que todos los campos del header estén presentes
- Asegurar que la tabla tenga todas las columnas esperadas

---

## ✅ Checklist de Implementación

- [ ] Fase 1: Extraer header del modal
- [ ] Fase 1: Procesar campos del header
- [ ] Fase 1: Incluir en JSON estructurado
- [ ] Fase 2: Detectar color de icono PDF
- [ ] Fase 2: Agregar campo tipo_pdf
- [ ] Fase 3: Extraer todas las columnas de tabla
- [ ] Fase 3: Mapear columnas a campos descriptivos
- [ ] Fase 4: Validar RIT después de búsqueda
- [ ] Fase 4: Normalizar filtros de corte/tribunal
- [ ] Testing: Verificar que toda la información se extrae correctamente

---

## 🚀 Próximos Pasos Inmediatos

1. **Analizar HTML del modal** para identificar selectores exactos del header
2. **Identificar selectores de iconos PDF** rojos vs azules
3. **Verificar estructura de tabla** para mapear todas las columnas
4. **Implementar Fase 1** (extracción de header)
5. **Implementar Fase 2** (diferenciación de PDFs)
6. **Implementar Fase 3** (separación por tópicos)

---

**Fecha de creación**: 2026-01-16  
**Estado**: Planificación completada, listo para implementación


