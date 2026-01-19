# 🔍 Extraer Opciones del PJUD

Este script extrae **todas las opciones de IDs internos** disponibles en el formulario de consulta de causas del PJUD.

## 🎯 ¿Qué extrae?

El script extrae todos los valores disponibles para:

- **Competencias** (Civil, Laboral, Penal, etc.)
- **Cortes** (por cada competencia)
- **Tribunales** (por cada corte)
- **Tipos de Causa** (C, L, etc.)

## 🚀 Cómo Ejecutar

### 1. Asegúrate de tener el archivo `.env` configurado:

```env
OJV_URL=https://oficinajudicialvirtual.pjud.cl/indexN.php
```

### 2. Ejecuta el script:

```bash
node src/extraer-opciones-pjud.js
```

## 📊 Archivos Generados

El script genera dos archivos en `src/outputs/`:

### 1. `opciones_pjud.json`
Archivo completo con toda la estructura jerárquica:

```json
{
  "fecha_extraccion": "2026-01-16T...",
  "url": "https://...",
  "competencias": [
    { "value": "3", "text": "Civil" },
    ...
  ],
  "opciones_por_competencia": [
    {
      "competencia": { "value": "3", "text": "Civil" },
      "cortes": [
        {
          "corte": { "value": "90", "text": "C.A. de Santiago" },
          "tribunales": [
            { "value": "276", "text": "27 Juzgado Civil de Santiago" },
            ...
          ]
        }
      ]
    }
  ],
  "tipos_causa": [
    { "value": "C", "text": "Civil" },
    ...
  ],
  "resumen": {
    "total_competencias": 7,
    "total_cortes": 50,
    "total_tribunales": 500,
    "total_tipos_causa": 5
  }
}
```

### 2. `ids_pjud.json`
Archivo simplificado con solo los IDs y nombres:

```json
{
  "competencias": [
    { "id": "3", "nombre": "Civil" }
  ],
  "cortes": [
    { "id": "90", "nombre": "C.A. de Santiago", "competencia_id": "3" }
  ],
  "tribunales": [
    { "id": "276", "nombre": "27 Juzgado Civil de Santiago", "corte_id": "90", "competencia_id": "3" }
  ],
  "tipos_causa": [
    { "id": "C", "nombre": "Civil" }
  ]
}
```

## 💡 Uso de los Resultados

### Buscar un Tribunal específico:

```javascript
const ids = require('./outputs/ids_pjud.json');

// Buscar tribunal por nombre
const tribunal = ids.tribunales.find(t => 
  t.nombre.includes('27 Juzgado Civil de Santiago')
);
console.log(`ID del tribunal: ${tribunal.id}`);
```

### Buscar todos los tribunales de una Corte:

```javascript
const tribunalesSantiago = ids.tribunales.filter(t => 
  t.corte_id === '90' // C.A. de Santiago
);
```

### Buscar todos los tribunales de una Competencia:

```javascript
const tribunalesCiviles = ids.tribunales.filter(t => 
  t.competencia_id === '3' // Civil
);
```

## ⚙️ Configuración del Script

El script está configurado para:

- **headless: false** - Muestra el navegador (para debugging)
- **slowMo: 100** - Delay de 100ms entre acciones (simula comportamiento humano)
- **timeout: 60000** - 60 segundos de timeout para cargar páginas

Si quieres que sea más rápido, puedes cambiar en el código:

```javascript
const browser = await chromium.launch({ 
  headless: true,  // Oculto
  slowMo: 0        // Sin delay
});
```

## ⚠️ Notas Importantes

1. **Tiempo de ejecución**: El script puede tardar varios minutos porque:
   - Selecciona cada competencia
   - Para cada competencia, selecciona cada corte
   - Para cada corte, extrae los tribunales

2. **Dependencias**: Los campos del formulario tienen dependencias:
   - Primero se selecciona **Competencia**
   - Luego se habilita **Corte**
   - Luego se habilita **Tribunal**
   - Finalmente se habilita **Tipo Causa**

3. **Actualización**: Los IDs pueden cambiar en el tiempo. Ejecuta este script periódicamente para mantener los datos actualizados.

## 🔄 Actualizar Configuración

Una vez que tengas los IDs, puedes actualizar `src/config/pjud_config.json`:

```json
{
  "rit": "16707-2019",
  "competencia": "3",
  "corte": "90",
  "tribunal": "276",
  "tipoCausa": "C"
}
```

## 📝 Ejemplo de Salida en Consola

```
🔍 Iniciando extracción de opciones del PJUD...

🌐 Navegando a: https://oficinajudicialvirtual.pjud.cl/indexN.php
✅ Modal cerrado
🖱️ Navegando a "Consulta causas"...
✅ En página de consulta de causas
✅ Formulario disponible

📋 Extrayendo Competencias...
   ✅ Encontradas 7 competencias
      - 1: Corte Suprema
      - 2: Corte Apelaciones
      - 3: Civil
      ...

📋 Extrayendo Cortes por Competencia...

   🔍 Procesando Competencia: 3 - Civil
      ✅ Encontradas 15 cortes
         - 90: C.A. de Santiago
         ...

      🔍 Procesando Corte: 90 - C.A. de Santiago
         ✅ Encontrados 50 tribunales
            - 276: 27 Juzgado Civil de Santiago
            ...

📊 Resumen:
   - Competencias: 7
   - Cortes: 50
   - Tribunales: 500
   - Tipos de Causa: 5

✅ Extracción completada exitosamente!
```


