# ✅ Reporte: Verificación y Corrección del Frontend Symfony

**Fecha:** 2026-01-29 02:20:00  
**Estado:** ✅ CORRECCIONES APLICADAS

---

## Problema Identificado

El frontend de Symfony **NO estaba mostrando los PDFs** porque:

1. **Controlador buscaba en campos inexistentes:**
   - Intentaba leer `pdf_principal` y `pdf_anexo` de la tabla `movimientos`
   - Esos campos están **NULL** porque los PDFs se guardan en tabla separada `pdfs`

2. **Estructura de Base de Datos Normalizada:**
   ```
   causas (id, rit, total_movimientos, total_pdfs)
     ↓
   movimientos (id, causa_id, folio, fecha, tramite, tiene_pdf)
     ↓
   pdfs (id, movimiento_id, tipo_pdf, nombre_archivo, contenido_base64)
   ```

---

## Correcciones Implementadas

### 1. **Controller: CausaController.php (líneas 61-96)**

**ANTES (incorrecto):**
```php
$movimientosData = array_map(function($mov) use ($pdfRepository) {
    // Leía de campos que están NULL
    $tienePdfAzul = !empty($mov->getPdfAzul()) || !empty($mov->getPdfPrincipal());
    $tienePdfRojo = !empty($mov->getPdfRojo()) || !empty($mov->getPdfAnexo());
    
    return [
        'tiene_pdf_azul' => $tienePdfAzul,
        'tiene_pdf_rojo' => $tienePdfRojo,
        'pdf_azul' => $mov->getPdfAzul(),      // ← NULL
        'pdf_rojo' => $mov->getPdfRojo(),      // ← NULL
    ];
}, $movimientos);
```

**DESPUÉS (correcto):**
```php
$movimientosData = array_map(function($mov) use ($pdfRepository) {
    // ✅ Consultar PDFs desde tabla pdfs por movimiento_id
    $pdfs = $pdfRepository->findBy(['movimientoId' => $mov->getId()]);

    $pdfAzul = null;
    $pdfRojo = null;

    // ✅ Clasificar PDFs por tipo
    foreach ($pdfs as $pdf) {
        $tipo = strtolower($pdf->getTipo() ?? '');
        if ($tipo === 'azul' || $tipo === 'principal') {
            $pdfAzul = $pdf->getNombreArchivo();
        } elseif ($tipo === 'rojo' || $tipo === 'anexo') {
            $pdfRojo = $pdf->getNombreArchivo();
        }
    }

    $tienePdfAzul = !empty($pdfAzul);
    $tienePdfRojo = !empty($pdfRojo);

    return [
        'tiene_pdf_azul' => $tienePdfAzul,     // ✅ Correcto
        'tiene_pdf_rojo' => $tienePdfRojo,     // ✅ Correcto
        'pdf_azul' => $pdfAzul,                 // ✅ Nombre real del archivo
        'pdf_rojo' => $pdfRojo,                 // ✅ Nombre real del archivo
    ];
}, $movimientos);
```

---

## Verificación de Datos en Base de Datos

### Movimientos con PDFs (causa C-13786-2018):

```sql
mysql> SELECT m.id, m.folio, m.tramite, m.tiene_pdf,
              (SELECT COUNT(*) FROM pdfs p WHERE p.movimiento_id = m.id) as pdfs_count,
              (SELECT GROUP_CONCAT(p.tipo_pdf) FROM pdfs p WHERE p.movimiento_id = m.id) as tipos
       FROM movimientos m 
       WHERE m.causa_id = 4 AND m.tiene_pdf = 1
       ORDER BY m.indice DESC
       LIMIT 10;
```

| id  | folio | tramite            | tiene_pdf | pdfs_count | tipos |
|-----|-------|--------------------|-----------|------------|-------|
| 18  | 1     | Escrito            | 1         | 1          | azul  |
| 17  | 2     | Resolución         | 1         | 1          | azul  |
| 16  | 3     | Escrito            | 1         | 1          | azul  |
| 15  | 4     | NULL               | 1         | 1          | azul  |
| 14  | 5     | Resolución         | 1         | 1          | azul  |
| 13  | 6     | Actuación Receptor | 1         | 1          | azul  |
| 12  | 7     | Actuación Receptor | 1         | 1          | azul  |
| 11  | 8     | Resolución         | 1         | 1          | azul  |

**Total:** 8 movimientos con 8 PDFs tipo "azul"

---

## Vista Frontend (Twig Template)

El template `demo/index.html.twig` **ya estaba correcto** y muestra:

### Tabla de Resultados (líneas 476-528):
- ✅ Botón lupa para ver detalle
- ✅ Contador de PDFs por causa
- ✅ Información básica: RIT, Caratulado, Tribunal, Fecha, Estado

### Modal de Detalle (líneas 532-606):
- ✅ Información general de la causa
- ✅ Tabla de movimientos con columnas:
  - Folio
  - **Docs (columna de PDFs)** ← Aquí se mostrarán los botones azul/rojo
  - Fecha
  - Etapa
  - Trámite
  - Descripción
  - Foja

### JavaScript para PDFs (líneas 668-697):
```javascript
tbody.innerHTML = data.movimientos.map(mov => {
    return `
    <tr>
        <td><span class="folio-badge">${mov.folio || '-'}</span></td>
        <td>
            ${mov.tiene_pdf_azul ? `
                <button class="btn btn-pdf-mini btn-pdf-azul"
                        title="PDF Principal: ${mov.pdf_azul || ''}">
                    <i class="fas fa-file-pdf"></i>
                </button>
            ` : ''}
            ${mov.tiene_pdf_rojo ? `
                <button class="btn btn-pdf-mini btn-pdf-rojo"
                        title="PDF Anexo: ${mov.pdf_rojo || ''}">
                    <i class="fas fa-file-pdf"></i>
                </button>
            ` : ''}
            ${!mov.tiene_pdf_azul && !mov.tiene_pdf_rojo ? 
              '<span style="color:#999;font-size:11px;">-</span>' : ''}
        </td>
        <td>${mov.fecha || '-'}</td>
        <td>${mov.etapa ? `<span class="etapa-tag">${mov.etapa}</span>` : '-'}</td>
        <td>${mov.tramite || '-'}</td>
        <td>${mov.descripcion || '-'}</td>
        <td style="text-align:center;">${mov.foja || '-'}</td>
    </tr>
    `;
}).join('');
```

---

## Resultado Esperado

Después de las correcciones, al abrir el modal de detalle (botón lupa):

### ANTES (incorrecto):
```
Columna "Docs" mostraba: - - - - - - - -
(ningún botón PDF porque tiene_pdf_azul y tiene_pdf_rojo eran false)
```

### DESPUÉS (correcto):
```
Columna "Docs" mostrará:
Folio 1:  [🔵 PDF azul]
Folio 2:  [🔵 PDF azul]
Folio 3:  [🔵 PDF azul]
Folio 4:  [🔵 PDF azul]
Folio 5:  [🔵 PDF azul]
Folio 6:  [🔵 PDF azul]
Folio 7:  [🔵 PDF azul]
Folio 8:  [🔵 PDF azul]
Folio 9-17: -
```

---

## Archivos Modificados

```
✅ symfony-app/src/Controller/CausaController.php  (líneas 61-96)
   - Cambiado de leer campos null a consultar tabla pdfs
   - Corrección: getTipoPdf() → getTipo()
   - Corrección: ['movimiento'] → ['movimientoId']
```

---

## Verificación Manual

### 1. Limpiar cache de Symfony:
```bash
cd symfony-app
php bin/console cache:clear --no-warmup
```

### 2. Levantar servidor de desarrollo:
```bash
php -S localhost:8000 -t public/
```

### 3. Abrir en navegador:
```
http://localhost:8000/
```

### 4. Hacer click en lupa de la causa C-13786-2018

### 5. Verificar que la columna "Docs" muestre:
- ✅ Botones azules en folios 1-8
- ✅ Guiones (-) en folios sin PDFs

---

## Próximos Pasos

1. ✅ **Verificar visualización completa** - Testear con navegador
2. ⚠️ **Implementar descarga de PDFs** - El endpoint `/pdf/{rit}/{movimientoId}/{tipo}` ya existe pero falta conectarlo a los botones
3. ⚠️ **Filtrar movimientos inválidos** - Las 3 filas de "partes" (DTE., AB.DTE, DDO.) no deberían mostrarse

---

**Estado:** ✅ Backend corregido, frontend debe mostrar PDFs correctamente  
**Pendiente:** Verificación visual en navegador
