# 🔍 Extraer Todos los Tribunales del PJUD

Scripts para extraer todas las opciones de tribunales disponibles en el PJUD usando los IDs de corte proporcionados.

## 📋 Scripts Disponibles

### 1. `extraer-tribunales-http.js` (Recomendado)
Script optimizado que usa Playwright para navegar y extraer todos los tribunales de cada corte.

**Ventajas:**
- ✅ Funciona con la estructura actual del PJUD
- ✅ Maneja cookies y sesiones automáticamente
- ✅ Extrae datos directamente del DOM
- ✅ Usa los IDs de corte proporcionados

**Ejecutar:**
```bash
node src/extraer-tribunales-http.js
```

### 2. `descubrir-endpoints-pjud.js`
Script para descubrir los endpoints AJAX que usa el PJUD para cargar opciones dinámicamente.

**Ejecutar:**
```bash
node src/descubrir-endpoints-pjud.js
```

### 3. `extraer-tribunales-curl.js`
Script que intenta usar curl para hacer peticiones HTTP directas (requiere conocer los endpoints).

**Ejecutar:**
```bash
node src/extraer-tribunales-curl.js
```

## 🎯 IDs de Corte Disponibles

El script usa estos IDs de corte (proporcionados):

| ID | Nombre |
|----|--------|
| 10 | C.A. de Arica |
| 11 | C.A. de Iquique |
| 15 | C.A. de Antofagasta |
| 20 | C.A. de Copiapó |
| 25 | C.A. de La Serena |
| 30 | C.A. de Valparaíso |
| 35 | C.A. de Rancagua |
| 40 | C.A. de Talca |
| 45 | C.A. de Chillan |
| 46 | C.A. de Concepción |
| 50 | C.A. de Temuco |
| 55 | C.A. de Valdivia |
| 56 | C.A. de Puerto Montt |
| 60 | C.A. de Coyhaique |
| 61 | C.A. de Punta Arenas |
| 90 | C.A. de Santiago |
| 91 | C.A. de San Miguel |

## 📊 Archivos Generados

### `tribunales_pjud_completo.json`
Estructura completa con todas las relaciones:

```json
{
  "fecha_extraccion": "2026-01-16T...",
  "competencias": [...],
  "cortes": [
    {
      "competencia": { "id": "3", "nombre": "Civil" },
      "cortes": [
        {
          "corte": { "id": "90", "nombre": "C.A. de Santiago" },
          "tribunales": [
            { "value": "276", "text": "27 Juzgado Civil de Santiago" },
            ...
          ]
        }
      ]
    }
  ],
  "resumen": {
    "total_competencias": 7,
    "total_cortes": 17,
    "total_tribunales": 500
  }
}
```

### `tribunales_pjud_ids.json`
Versión simplificada con solo IDs:

```json
{
  "competencias": [...],
  "cortes": [...],
  "tribunales": [
    {
      "id": "276",
      "nombre": "27 Juzgado Civil de Santiago",
      "corte_id": "90",
      "corte_nombre": "C.A. de Santiago",
      "competencia_id": "3",
      "competencia_nombre": "Civil"
    }
  ]
}
```

## 💡 Uso de los Resultados

### Buscar tribunal por nombre:
```javascript
const ids = require('./outputs/tribunales_pjud_ids.json');

const tribunal = ids.tribunales.find(t => 
  t.nombre.includes('27 Juzgado Civil de Santiago')
);
console.log(`ID: ${tribunal.id}, Corte: ${tribunal.corte_id}`);
```

### Obtener todos los tribunales de una corte:
```javascript
const tribunalesSantiago = ids.tribunales.filter(t => 
  t.corte_id === '90' // C.A. de Santiago
);
```

### Obtener todos los tribunales de una competencia:
```javascript
const tribunalesCiviles = ids.tribunales.filter(t => 
  t.competencia_id === '3' // Civil
);
```

### Buscar por corte y competencia:
```javascript
const tribunales = ids.tribunales.filter(t => 
  t.corte_id === '90' && t.competencia_id === '3'
);
```

## ⚙️ Configuración

Asegúrate de tener el archivo `.env`:

```env
OJV_URL=https://oficinajudicialvirtual.pjud.cl/indexN.php
```

## ⏱️ Tiempo de Ejecución

El script puede tardar varios minutos porque:
- Procesa 7 competencias
- Para cada competencia, procesa 17 cortes
- Para cada corte, extrae todos los tribunales

**Estimado:** 10-20 minutos dependiendo de la velocidad de conexión.

## 🔄 Optimizaciones

Si quieres acelerar el proceso:

1. **Procesar solo una competencia específica:**
   - Edita el script y filtra `COMPETENCIAS` a solo la que necesitas

2. **Procesar solo cortes específicos:**
   - Edita el array `CORTES` para incluir solo los que necesitas

3. **Reducir delays:**
   - Cambia `await page.waitForTimeout(2000)` a valores menores (ej: 1000)

## 📝 Notas

- Cada corte tiene muchos tribunales
- Cada tribunal pertenece a una corte específica
- Los tribunales pueden variar según la competencia
- Los datos se actualizan periódicamente en el PJUD

## 🆘 Solución de Problemas

### Error: "No se cargaron tribunales"
- Verifica tu conexión a internet
- El PJUD puede estar lento, aumenta los timeouts
- Algunas combinaciones competencia/corte pueden no tener tribunales

### Error: "Timeout esperando selector"
- Aumenta el timeout en `waitForFunction`
- Verifica que el PJUD esté accesible

### Error: "No se encontró el enlace"
- Verifica que la URL en `.env` sea correcta
- El sitio puede haber cambiado su estructura


