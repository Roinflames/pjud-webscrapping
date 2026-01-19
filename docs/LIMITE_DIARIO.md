# ⚖️ Sistema de Límite Diario de Causas

## 📋 Descripción

Se ha implementado un sistema de **límite diario** de causas procesadas para cumplir con las condiciones de uso del PJUD y evitar sobrecargar el servidor.

## 🔧 Funcionalidad

### Características implementadas:

1. ✅ **Tracking diario**: Se guarda un contador de causas procesadas por día
2. ✅ **Límite configurable**: Por defecto 150 causas/día (recomendado: 100-200)
3. ✅ **Validación automática**: Verifica el límite antes de procesar
4. ✅ **Detección de horario pico**: Advertencia en horario laboral (lunes-viernes, 9-17hrs)
5. ✅ **Persistencia**: El contador se guarda en `src/daily_limit.json`
6. ✅ **Reinicio automático**: El contador se reinicia cada día

---

## 📊 Cómo Funciona

### Archivo de tracking: `src/daily_limit.json`

```json
{
  "date": "2026-01-16",
  "count": 45,
  "lastUpdate": "2026-01-16T14:30:00.000Z"
}
```

- **date**: Fecha actual en formato YYYY-MM-DD
- **count**: Cantidad de causas procesadas hoy
- **lastUpdate**: Última actualización (timestamp ISO)

### Proceso:

1. **Al iniciar**: Verifica cuántas causas se procesaron hoy
2. **Antes de procesar**: Compara con el límite diario
3. **Si alcanzó el límite**: Detiene el procesamiento y muestra mensaje
4. **Después de cada causa**: Incrementa el contador (solo si fue exitosa)
5. **Al día siguiente**: El contador se reinicia automáticamente

---

## 🚀 Uso

### Comando básico:
```bash
node src/process-csv-causas.js [limit] [resumeFromLast] [dailyLimit]
```

### Ejemplos:

```bash
# Procesar 10 causas con límite diario por defecto (150)
node src/process-csv-causas.js 10

# Procesar 50 causas, empezando desde el inicio, con límite diario de 200
node src/process-csv-causas.js 50 false 200

# Procesar 20 causas, continuando desde el último, con límite diario de 100
node src/process-csv-causas.js 20 true 100
```

### Parámetros:

| Parámetro | Descripción | Default |
|-----------|-------------|---------|
| `limit` | Cantidad de causas a procesar en esta ejecución | `5` |
| `resumeFromLast` | Continuar desde el último RIT procesado (`true`/`false`) | `true` |
| `dailyLimit` | Límite diario de causas procesadas | `150` |

---

## 📈 Ejemplo de Salida

### Al iniciar:
```
⚖️ Verificando límites de procesamiento...
   📊 Causas procesadas hoy: 45/150
   📋 Causas restantes hoy: 105
   ⏰ ADVERTENCIA: Estás en horario pico (lunes-viernes, 9-17hrs)
   💡 Considera ejecutar fuera de horario laboral para menor carga al servidor

📊 Causas válidas para procesar: 500
   Empezando desde: 1
   Límite solicitado: 50 causas
   Límite diario restante: 105 causas
   ✅ Procesando: 50 causas (limitado por cuota diaria)
```

### Durante el procesamiento:
```
   📊 Progreso diario: 46/150 causas (104 restantes hoy)
   📊 Progreso diario: 47/150 causas (103 restantes hoy)
   ...
```

### Si alcanza el límite:
```
⚠️ ⚠️ ⚠️ LÍMITE DIARIO ALCANZADO ⚠️ ⚠️ ⚠️
   Has procesado 150 causas hoy.
   El límite diario es de 150 causas.
   Por favor, espera hasta mañana para continuar.
   Esto ayuda a cumplir con las condiciones de uso del PJUD.

   💡 Puedes modificar el límite en el código si es necesario.
```

---

## ⚙️ Configuración

### Cambiar el límite diario por defecto:

Edita `src/process-csv-causas.js` y modifica:

```javascript
const DEFAULT_DAILY_LIMIT = 150; // Cambiar a tu límite preferido
```

### Límites recomendados:

- **Conservador**: 100 causas/día (para uso muy cuidadoso)
- **Moderado**: 150 causas/día (recomendado por defecto)
- **Generoso**: 200 causas/día (máximo recomendado)

**IMPORTANTE**: Más de 200 causas/día podría considerarse sobrecarga del servidor.

---

## 🔍 Verificación del Contador

### Ver cuántas causas se procesaron hoy:

```bash
cat src/daily_limit.json
```

### Reiniciar contador manualmente (si es necesario):

```bash
# El contador se reinicia automáticamente cada día, pero si necesitas reiniciarlo manualmente:
echo '{"date":"2026-01-16","count":0,"lastUpdate":"'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"}' > src/daily_limit.json
```

---

## ⚠️ Importante

1. **El límite diario es acumulativo**: Si procesas 50 causas en la mañana y 100 en la tarde, el total es 150.

2. **Solo cuenta causas exitosas**: Las causas que fallan NO cuentan para el límite diario.

3. **Reinicio automático**: El contador se reinicia a las 00:00:00 cada día.

4. **Persistencia**: El contador se guarda en `src/daily_limit.json` y persiste entre ejecuciones.

5. **Cumplimiento legal**: Este sistema ayuda a cumplir con las condiciones de uso del PJUD (Artículo CUARTO).

---

## 📝 Notas Técnicas

- El contador se actualiza **después** de cada causa exitosa
- Si una causa falla, NO se incrementa el contador
- El límite se verifica **antes** de procesar cada lote de causas
- Si se alcanza el límite durante el procesamiento, se detiene inmediatamente
- El sistema detecta automáticamente si es un nuevo día y reinicia el contador

---

**Última actualización**: 2026-01-16  
**Estado**: ✅ Implementado y funcional


