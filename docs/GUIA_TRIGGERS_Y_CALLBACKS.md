# 🔄 Guía: Triggers y Callbacks para Procesar Datos Después de INSERT

Esta guía explica cómo ejecutar procesos automáticamente después de insertar datos en la tabla `pjud_movimientos_intermedia`.

---

## 📋 Dos Opciones Disponibles

### 1. **Triggers de MySQL** (Recomendado para procesos pesados)
- Se ejecutan directamente en la base de datos
- No requieren modificar el código JavaScript
- Más eficientes para operaciones de BD
- Se ejecutan siempre, incluso si insertas datos manualmente

### 2. **Callbacks en JavaScript** (Recomendado para lógica de negocio)
- Se ejecutan desde el código Node.js
- Más flexibles para lógica compleja
- Pueden hacer llamadas a APIs, enviar emails, etc.
- Solo se ejecutan cuando usas el script de scraping

---

## 🗄️ Opción 1: Triggers de MySQL

### Instalación

1. Abre phpMyAdmin o tu cliente MySQL
2. Selecciona la base de datos `codi_ejamtest`
3. Ve a la pestaña "SQL"
4. Copia y pega el trigger que necesites desde `docs/sql/triggers_ejemplo.sql`
5. Ejecuta el SQL

### Ejemplo Rápido: Copiar a Tabla Final

```sql
DELIMITER $$

CREATE TRIGGER after_insert_movimiento_intermedia
AFTER INSERT ON pjud_movimientos_intermedia
FOR EACH ROW
BEGIN
  INSERT INTO pjud_movimientos_final (
    rit, competencia_id, corte_id, folio, etapa, desc_tramite, fec_tramite
  ) VALUES (
    NEW.rit, NEW.competencia_id, NEW.corte_id, NEW.folio,
    NEW.etapa, NEW.desc_tramite, NEW.fec_tramite
  );
END$$

DELIMITER ;
```

### Ver Triggers Activos

```sql
SHOW TRIGGERS FROM codi_ejamtest;
```

### Eliminar un Trigger

```sql
DROP TRIGGER IF EXISTS after_insert_movimiento_intermedia;
```

---

## 💻 Opción 2: Callbacks en JavaScript

### Uso Básico

1. **Registra tus callbacks ANTES de ejecutar el scraping:**

```javascript
const { registrarCallback } = require('./importar_intermedia_sql');

// Callback que se ejecuta después de cada INSERT individual
registrarCallback('afterInsert', async (movimiento, connection) => {
  console.log(`Movimiento insertado: ${movimiento.id}`);
  
  // Tu lógica aquí
  await connection.query(`
    INSERT INTO otra_tabla (rit, movimiento_id) 
    VALUES (?, ?)
  `, [movimiento.rit, movimiento.id]);
});

// Callback que se ejecuta después de insertar TODOS los movimientos de un RIT
registrarCallback('afterBatch', async (batchInfo, connection) => {
  const { rit, totalMovimientos } = batchInfo;
  console.log(`Batch completado: ${rit} con ${totalMovimientos} movimientos`);
  
  // Tu lógica aquí
});

// Callback para manejar errores
registrarCallback('onError', async (error, context) => {
  console.error(`Error: ${error.message}`);
  // Tu lógica de manejo de errores
});
```

2. **Ejecuta tu script normalmente:**

```bash
node src/index.js
# o
node src/process-csv-causas.js 10
```

### Ejemplo Completo

Crea un archivo `src/mis_callbacks.js`:

```javascript
const { registrarCallback } = require('./importar_intermedia_sql');

// Registrar callbacks
registrarCallback('afterInsert', async (movimiento, connection) => {
  // Ejemplo: Copiar a tabla final
  if (movimiento.desc_tramite && movimiento.desc_tramite.includes('Demanda')) {
    await connection.query(`
      INSERT INTO pjud_eventos_importantes 
      (rit, tipo_evento, desc_tramite) 
      VALUES (?, 'DEMANDA', ?)
    `, [movimiento.rit, movimiento.desc_tramite]);
  }
});

// Importar en tu script principal
require('./mis_callbacks');
```

Luego en `src/index.js` o `src/process-csv-causas.js`, agrega al inicio:

```javascript
// Cargar callbacks personalizados
require('./mis_callbacks');
```

---

## 🎯 Casos de Uso Comunes

### 1. Copiar Datos a Tabla Final

**Con Trigger:**
```sql
CREATE TRIGGER copiar_a_final
AFTER INSERT ON pjud_movimientos_intermedia
FOR EACH ROW
BEGIN
  INSERT INTO pjud_movimientos_final SELECT * FROM pjud_movimientos_intermedia WHERE id = NEW.id;
END;
```

**Con Callback:**
```javascript
registrarCallback('afterInsert', async (mov, conn) => {
  await conn.query('INSERT INTO pjud_movimientos_final SET ?', [mov]);
});
```

### 2. Actualizar Estadísticas

**Con Trigger:**
```sql
CREATE TRIGGER actualizar_stats
AFTER INSERT ON pjud_movimientos_intermedia
FOR EACH ROW
BEGIN
  INSERT INTO stats (rit, total) VALUES (NEW.rit, 1)
  ON DUPLICATE KEY UPDATE total = total + 1;
END;
```

### 3. Detectar Eventos Importantes

**Con Callback:**
```javascript
registrarCallback('afterInsert', async (mov, conn) => {
  if (mov.desc_tramite?.includes('Sentencia')) {
    await conn.query(`
      INSERT INTO eventos_importantes (rit, tipo) 
      VALUES (?, 'SENTENCIA')
    `, [mov.rit]);
  }
});
```

### 4. Enviar Notificaciones

**Con Callback:**
```javascript
registrarCallback('afterInsert', async (mov, conn) => {
  if (mov.desc_tramite?.includes('Terminada')) {
    // Enviar email, webhook, etc.
    await enviarNotificacion(mov.rit, 'Causa terminada');
  }
});
```

---

## ⚙️ Comparación: Triggers vs Callbacks

| Característica | Triggers MySQL | Callbacks JavaScript |
|---------------|----------------|---------------------|
| **Ejecución** | Siempre (incluso INSERTs manuales) | Solo cuando usas el script |
| **Rendimiento** | Muy rápido (en BD) | Depende del código |
| **Flexibilidad** | Limitada a SQL | Muy flexible (APIs, archivos, etc.) |
| **Debugging** | Más difícil | Más fácil (console.log) |
| **Mantenimiento** | En SQL | En JavaScript |
| **Recomendado para** | Operaciones de BD simples | Lógica compleja, APIs, archivos |

---

## 🚀 Recomendación

- **Usa Triggers** para: copiar datos, actualizar estadísticas, validaciones simples
- **Usa Callbacks** para: llamadas a APIs, envío de emails, procesamiento de archivos, lógica compleja

---

## 📝 Archivos de Referencia

- **Triggers:** `docs/sql/triggers_ejemplo.sql`
- **Callbacks:** `src/ejemplo_callbacks.js`
- **Implementación:** `src/importar_intermedia_sql.js`

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo usar ambos a la vez?**  
R: Sí, se ejecutarán ambos. Primero el callback en JavaScript, luego el trigger en MySQL.

**P: ¿Qué pasa si un trigger falla?**  
R: El INSERT completo falla (transacción). Asegúrate de probar tus triggers primero.

**P: ¿Qué pasa si un callback falla?**  
R: Se registra un warning pero el proceso continúa. El INSERT ya se hizo.

**P: ¿Cómo desactivo un trigger?**  
R: `DROP TRIGGER nombre_trigger;`

**P: ¿Cómo desactivo un callback?**  
R: Simplemente no lo registres o comenta la línea `registrarCallback(...)`


