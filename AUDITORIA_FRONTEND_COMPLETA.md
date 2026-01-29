# 🔍 Auditoría Completa del Frontend Symfony

**Fecha:** 2026-01-29  
**Estado:** ⚠️ PROBLEMAS IDENTIFICADOS

---

## Datos Extraídos por el Scraping

### Estructura del JSON Legacy (`resultado_C_13786_2018.json`):

```
Total filas: 25
├─ Filas 1-3: CABECERA DE CAUSA ⚠️ NO SE PARSEA
│  ├─ Fila 1: ROL + Fecha Ingreso + Caratulado
│  ├─ Fila 2: Estado Administrativo + Procedimiento + Ubicación
│  └─ Fila 3: Estado Procesal + Etapa + Tribunal
│
├─ Filas 4-22: MOVIMIENTOS REALES (19 movimientos)
│  ├─ 16 con campo "tramite" (Escrito, Resolución, Actuación Receptor)
│  └─ 3 con descripción pero sin tramite formal
│
└─ Filas 23-25: PARTES DEL JUICIO ⚠️ SE GUARDAN COMO MOVIMIENTOS
   ├─ DDO. (Demandado)
   ├─ AB.DTE (Abogado Demandante)
   └─ DTE. (Demandante)
```

---

## Datos en Base de Datos

### Tabla `causas` (ID=4, RIT=C-13786-2018):

| Campo             | Valor en BD          | Valor Real (del scraping)                          | Estado |
|-------------------|----------------------|----------------------------------------------------|---------|
| rit               | C-13786-2018         | ✅ C-13786-2018                                    | ✅ OK  |
| caratulado        | PROMOTORA CMR...     | "ITAU CORPBANCA/HERNÁNDEZ"                         | ⚠️ Parcial |
| tribunal_nombre   | **NULL**             | "4º Juzgado Civil de Santiago"                     | ❌ FALTA |
| fecha_ingreso     | **NULL**             | "09/05/2018"                                       | ❌ FALTA |
| estado            | **NULL**             | "Tramitación" o "Archivada"                        | ❌ FALTA |
| etapa             | **NULL**             | "Notificación demanda y su proveído"               | ❌ FALTA |
| total_movimientos | 21                   | **17** (reales, sin cabecera/partes)               | ⚠️ Incorrecto |
| total_pdfs        | 8                    | ✅ 8                                               | ✅ OK  |

**Problema:** Los campos de cabecera están en las filas 1-3 del JSON pero **NO se parsean** al guardar.

---

### Tabla `movimientos` (causa_id=4):

| Tipo                  | Cantidad | Problema                                          |
|-----------------------|----------|---------------------------------------------------|
| Filas de cabecera     | 0        | ✅ No se guardaron (eran 3 en JSON)              |
| Movimientos reales    | **18**   | ⚠️ Debería ser 17 (hay 1 fila extra "Ebook")    |
| Partes (DDO, DTE)     | **3**    | ❌ NO deberían estar en movimientos              |
| **Total en BD**       | **21**   | Debería ser 17                                    |

**Detalle de filas problemáticas:**

```sql
id=21: folio='DTE.' etapa='ITAU CORPBANCA' ❌ PARTE (demandante)
id=20: folio='AB.DTE' etapa='WILLIAM...' ❌ PARTE (abogado)
id=19: folio='DDO.' etapa='GABRIEL...' ❌ PARTE (demandado)
id=1:  folio='Texto Demanda:\nTexto Demanda' etapa='Ebook:\nDescargar Ebook' ❌ BASURA
```

---

## Frontend: Qué Se Muestra vs Qué Debería Mostrarse

### Vista Principal (Tabla de Causas)

**Controlador:** `CausaController::index()` (líneas 20-38)  
**Template:** `demo/index.html.twig` (líneas 476-528)

| Campo | Muestra | Debería Mostrar | Estado |
|-------|---------|-----------------|---------|
| RIT | C-13786-2018 | ✅ C-13786-2018 | ✅ OK |
| Caratulado | "PROMOTORA CMR..." | "ITAU CORPBANCA/HERNÁNDEZ" | ⚠️ Parcial |
| Tribunal | **-** | "4º Juzgado Civil de Santiago" | ❌ FALTA |
| Fecha Ingreso | **-** | "09/05/2018" | ❌ FALTA |
| Estado | "Sin Info" | "Archivada" | ❌ FALTA |
| Total PDFs | 8 | ✅ 8 | ✅ OK |

**Captura de código:**
```twig
<td>{{ causa.caratulado|default('-') }}</td>
<td>{{ causa.tribunalNombre|default('-') }}</td>  {# NULL → '-' #}
<td>{{ causa.fechaIngreso|default('-') }}</td>    {# NULL → '-' #}
```

---

### Modal de Detalle (Vista Lupa)

**Controlador:** `CausaController::detalle()` (líneas 42-101)  
**Template:** `demo/index.html.twig` (líneas 532-716)

#### Sección "Información General"

| Campo | Muestra | Debería Mostrar | Estado |
|-------|---------|-----------------|---------|
| RIT/ROL | C-13786-2018 | ✅ C-13786-2018 | ✅ OK |
| Caratulado | "PROMOTORA CMR..." | "ITAU CORPBANCA/HERNÁNDEZ" | ⚠️ Parcial |
| Tribunal | **-** | "4º Juzgado Civil de Santiago" | ❌ FALTA |
| Fecha Ingreso | **-** | "09/05/2018" | ❌ FALTA |
| Estado | "SIN_INFORMACION" | "Archivada" | ❌ FALTA |
| Etapa | **-** | "Notificación demanda y su proveído" | ❌ FALTA |

**Captura de código:**
```javascript
document.getElementById('detailTribunal').textContent = data.causa.tribunal || '-';  // NULL → '-'
document.getElementById('detailFechaIngreso').textContent = data.causa.fecha_ingreso || '-';
document.getElementById('detailEstado').textContent = data.causa.estado || 'SIN_INFORMACION';
document.getElementById('detailEtapa').textContent = data.causa.etapa || '-';
```

#### Sección "Movimientos Procesales"

**Tabla con columnas:** Folio | Docs | Fecha | Etapa | Trámite | Descripción | Foja

**Filas mostradas:** 21 (incluye 4 filas basura)

| Folio | Tipo | Debería Mostrarse | Estado |
|-------|------|-------------------|--------|
| 1-17 | Movimientos reales | ✅ SÍ | ✅ OK |
| DTE. | Parte (demandante) | ❌ NO | ❌ BASURA |
| AB.DTE | Parte (abogado) | ❌ NO | ❌ BASURA |
| DDO. | Parte (demandado) | ❌ NO | ❌ BASURA |
| "Texto Demanda..." | Ebook/Basura | ❌ NO | ❌ BASURA |

**Captura de código JS:**
```javascript
tbody.innerHTML = data.movimientos.map(mov => {
    return `
    <tr>
        <td><span class="folio-badge">${mov.folio || '-'}</span></td>  
        // ← Aquí se muestran "DTE.", "AB.DTE", "DDO.", "Texto Demanda..."
        ...
```

#### Columna "Docs" (Botones PDF)

**Estado actual:** ✅ FUNCIONANDO CORRECTAMENTE

| Folio | PDFs en BD | Botones Mostrados | Estado |
|-------|------------|-------------------|--------|
| 1 | 1 azul | ✅ 1 botón azul | ✅ OK |
| 2 | 1 azul | ✅ 1 botón azul | ✅ OK |
| 3 | 1 azul | ✅ 1 botón azul | ✅ OK |
| 4-8 | 1 azul c/u | ✅ 1 botón azul c/u | ✅ OK |
| 9-17 | 0 | ✅ "-" | ✅ OK |

**Código corregido (líneas 62-96):**
```php
$pdfs = $pdfRepository->findBy(['movimientoId' => $mov->getId()]);
foreach ($pdfs as $pdf) {
    $tipo = strtolower($pdf->getTipo() ?? '');
    if ($tipo === 'azul' || $tipo === 'principal') {
        $pdfAzul = $pdf->getNombreArchivo();
    }
}
```

---

## Problemas Críticos Identificados

### 1. **Cabecera de Causa NO se Parsea** ❌

**Ubicación:** `src/process-causas.js` (líneas 461-482)

**Problema:** Al guardar la causa, se usan valores hardcodeados o NULL:

```javascript
const causaData = {
  rit: config.rit,
  caratulado: payload.cabecera?.caratulado || null,  // ← payload.cabecera está vacío
  tribunal_nombre: payload.cabecera?.tribunal || null,
  fecha_ingreso: payload.cabecera?.fecha_ingreso || null,
  estado: payload.estado_actual?.estado || null,
  etapa: payload.estado_actual?.etapa || null,
  // ...
};
```

**Causa raíz:** La función `processTableData()` no parsea las filas 1-3 de cabecera.

**Solución requerida:** Parsear las primeras 3 filas del `rows` array para extraer:
- Fila 1: `folio="ROL: C-13786-2018"` → RIT, Fecha Ingreso, Caratulado
- Fila 2: `folio="Est. Adm.: Archivada"` → Estado, Procedimiento
- Fila 3: `folio="Estado Proc.: Tramitación"` → Etapa, Tribunal

---

### 2. **Partes del Juicio se Guardan como Movimientos** ❌

**Ubicación:** `src/process-causas.js` (líneas 495-503)

**Problema:** El filtro actual solo verifica:
```javascript
const folioEsNumerico = /^\d+$/.test(String(mov.folio));
const tieneTramitoYDesc = mov.tramite && mov.desc_tramite;
const esMovimiento = folioEsNumerico || tieneTramitoYDesc;
```

Esto **NO filtra** filas como:
- `folio="DTE."` (no es numérico, pero tampoco tiene tramite)
- `folio="Texto Demanda:\nTexto Demanda"` (no es numérico ni tiene tramite)

**Solución requerida:** Mejorar filtro para excluir:
```javascript
const esParteOBasura = /^(DTE\.|AB\.DTE|DDO\.|Texto|Ebook:)/i.test(String(mov.folio));
if (esParteOBasura) continue;
```

---

### 3. **Total de Movimientos Incorrecto** ⚠️

**Ubicación:** `src/process-causas.js` (línea 477)

**Problema:**
```javascript
total_movimientos: datosProcesados.movimientos.length,  // ← 0 (array vacío)
```

**Valor actual en BD:** 21 (incluye 4 filas basura)  
**Valor correcto:** 17 (movimientos reales únicamente)

**Solución requerida:** Contar después del filtrado:
```javascript
total_movimientos: movimientosGuardados,  // Usar contador después del loop
```

---

## Comparación: PJUD Real vs Symfony App

### PJUD Real (sitio oficial):

**Modal de detalle muestra:**
1. ✅ Cabecera completa: RIT, Caratulado, Fecha Ingreso, Tribunal, Estado, Etapa
2. ✅ Tabla de movimientos SIN partes del juicio
3. ✅ Botones PDF azul/rojo por movimiento
4. ✅ Sección separada de "Partes" (demandante, demandado, abogados)

### Symfony App (actual):

**Modal de detalle muestra:**
1. ❌ Cabecera incompleta: RIT ✅ | Otros campos con "-"
2. ❌ Tabla de movimientos CON partes del juicio mezcladas
3. ✅ Botones PDF funcionando correctamente
4. ❌ NO hay sección de "Partes"

---

## Correcciones Requeridas (Prioridad)

### 🔴 CRÍTICO - Parsear Cabecera de Causa

**Archivo:** `src/process-causas.js`

**Cambio necesario:** Antes de guardar en BD (línea 470), parsear filas 1-3:

```javascript
// Parsear cabecera desde primeras filas
const cabecera = parseCabecera(rows.slice(0, 3));

const causaData = {
  rit: config.rit,
  caratulado: cabecera.caratulado || null,        // ✅ "ITAU CORPBANCA/HERNÁNDEZ"
  tribunal_nombre: cabecera.tribunal || null,      // ✅ "4º Juzgado Civil de Santiago"
  fecha_ingreso: cabecera.fecha_ingreso || null,   // ✅ "09/05/2018"
  estado: cabecera.estado || null,                 // ✅ "Archivada"
  etapa: cabecera.etapa || null,                   // ✅ "Notificación demanda..."
  // ...
};

function parseCabecera(headerRows) {
  const cabecera = {};
  
  // Fila 1: ROL: C-13786-2018 | F. Ing.: 09/05/2018 | ITAU CORPBANCA/HERNÁNDEZ
  const fila1 = headerRows[0];
  if (fila1.doc && fila1.doc.includes('F. Ing.:')) {
    cabecera.fecha_ingreso = fila1.doc.replace('F. Ing.:', '').trim();
  }
  if (fila1.anexo) {
    cabecera.caratulado = fila1.anexo.trim();
  }
  
  // Fila 2: Est. Adm.: Archivada | Proc.: ... | Ubicación: ...
  const fila2 = headerRows[1];
  if (fila2.folio && fila2.folio.includes('Est. Adm.:')) {
    cabecera.estado = fila2.folio.replace('Est. Adm.:', '').trim();
  }
  
  // Fila 3: Estado Proc.: Tramitación | Etapa: ... | Tribunal: ...
  const fila3 = headerRows[2];
  if (fila3.doc && fila3.doc.includes('Etapa:')) {
    cabecera.etapa = fila3.doc.replace('Etapa:', '').replace(/^\d+\s*/, '').trim();
  }
  if (fila3.anexo && fila3.anexo.includes('Tribunal:')) {
    cabecera.tribunal = fila3.anexo.replace('Tribunal:', '').trim();
  }
  
  return cabecera;
}
```

---

### 🟡 IMPORTANTE - Filtrar Partes y Basura

**Archivo:** `src/process-causas.js` (líneas 495-503)

**Cambio necesario:**

```javascript
// Filtrar filas de cabecera, partes y basura
const folioStr = String(mov.folio || '').trim();

// Excluir partes (DTE., AB.DTE, DDO.)
const esPartedelJuicio = /^(DTE\.|AB\.DTE|DDO\.)\s*$/i.test(folioStr);

// Excluir basura (Texto Demanda, Ebook, etc.)
const esBasura = /^(Texto|Ebook:|Descargar)/i.test(folioStr);

// Un movimiento válido debe tener folio numérico O (tramite Y desc_tramite)
const folioEsNumerico = /^\d+$/.test(folioStr);
const tieneTramitoYDesc = mov.tramite && mov.desc_tramite;
const esMovimiento = (folioEsNumerico || tieneTramitoYDesc) && !esPartedelJuicio && !esBasura;

if (!esMovimiento) {
  continue; // Saltar filas no válidas
}
```

---

### 🟡 IMPORTANTE - Corregir Total de Movimientos

**Archivo:** `src/process-causas.js` (línea 477)

**Cambio necesario:**

```javascript
// ANTES (incorrecto):
total_movimientos: datosProcesados.movimientos.length,  // 0

// DESPUÉS (correcto):
total_movimientos: 0,  // Se actualizará después con el contador real
```

Y después del loop (línea 549):

```javascript
console.log(`   ✅ ${movimientosGuardados} movimientos guardados`);

// ✅ Actualizar total_movimientos en la causa
await query(
  'UPDATE causas SET total_movimientos = ? WHERE id = ?',
  [movimientosGuardados, causaId]
);

console.log(`   ✅ Datos guardados en MySQL`);
```

---

### 🟢 OPCIONAL - Agregar Sección de Partes en Frontend

**Archivo:** `symfony-app/templates/demo/index.html.twig`

**Agregar después de la sección de movimientos (línea 602):**

```twig
<!-- Partes del Juicio -->
<div class="detail-section">
    <h5><i class="fas fa-users"></i> Partes del Juicio</h5>
    <div id="partesBody">
        <p style="color:#999;">Cargando partes...</p>
    </div>
</div>
```

**Y en el controlador agregar endpoint para obtener partes desde las filas filtradas.**

---

## Resumen de Estado

| Componente | Estado | Completitud |
|------------|--------|-------------|
| **Scraping** | ✅ Funciona | 100% - Extrae TODO |
| **Guardado en BD** | ⚠️ Parcial | 70% - Falta parsear cabecera |
| **Frontend: Tabla Principal** | ⚠️ Incompleto | 60% - Faltan campos NULL |
| **Frontend: Modal Detalle** | ⚠️ Con basura | 75% - Muestra filas extra |
| **Frontend: Botones PDF** | ✅ Funciona | 100% - Correctamente |

---

## Próximos Pasos

1. 🔴 **Implementar `parseCabecera()`** en `process-causas.js`
2. 🔴 **Mejorar filtro de movimientos** para excluir partes/basura
3. 🟡 **Actualizar `total_movimientos`** después del guardado
4. 🟡 **Re-scrapear la causa C-13786-2018** con las correcciones
5. 🟢 **Verificar frontend** muestra toda la información completa

---

**Generado:** 2026-01-29  
**Autor:** Auditoría Completa del Sistema
