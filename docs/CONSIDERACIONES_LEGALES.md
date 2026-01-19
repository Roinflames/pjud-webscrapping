# ⚖️ Consideraciones Legales - Términos y Condiciones PJUD

## 📋 Resumen de Condiciones de Uso del PJUD

El sistema de **Consulta Unificada de Causas** del Poder Judicial tiene las siguientes restricciones importantes:

### ❌ PROHIBICIONES (Artículo CUARTO)

1. **Uso ilícito o contrario a la Ley o el Orden Público**
2. **Uso/reproducción con propósitos comerciales**
3. **Fines que atenten contra los legítimos derechos de terceros**
4. **Acceso a causas reservadas** (especialmente importante)

---

## 🔍 Análisis del Proyecto Actual

### ✅ Aspectos que CUMPLEN con las condiciones:

1. **Uso interno del despacho**: El scraping está diseñado para gestión interna de causas del despacho, no para comercialización.

2. **Delays implementados**:
   - `slowMo: 300ms` en acciones del navegador
   - `waitForTimeout(1000-2000ms)` entre acciones
   - Delays aleatorios para simular comportamiento humano

3. **Respeto de causas reservadas**: El sistema busca causas específicas por RIT, no accede automáticamente a causas reservadas.

4. **No comercialización directa**: No se vende la información extraída.

### ⚠️ Aspectos a CONSIDERAR:

1. **Volumen de consultas**: Si se procesan muchas causas en poco tiempo, podría considerarse sobrecarga del servidor.

2. **Uso comercial indirecto**: Si el despacho usa la información para prestar servicios comerciales a clientes, podría estar en una zona gris.

3. **Automatización masiva**: El scraping automatizado no está explícitamente permitido ni prohibido en las condiciones.

---

## 🛡️ Recomendaciones de Cumplimiento

### 1. **Aumentar Delays Entre Consultas** (ALTA PRIORIDAD)

**Recomendación**: Agregar delay de **2-5 segundos** entre cada causa procesada.

**Implementación**:
```javascript
// En process-csv-causas.js
await page.waitForTimeout(2000 + Math.random() * 3000); // 2-5 segundos
```

### 2. **Limitar Volumen Diario** (MEDIA PRIORIDAD)

**Recomendación**: No procesar más de **100-200 causas por día** para evitar sobrecarga.

**Implementación**:
- Agregar límite diario en el procesamiento masivo
- Registrar cantidad procesada y detener si se alcanza el límite

### 3. **Usar Sesión de Invitado** (YA IMPLEMENTADO) ✅

**Estado**: Ya está implementado en `index.js`:
```javascript
// Establecer sesión de invitado para "Consulta causas"
await page.evaluate(async () => {
  const accesoConsultaCausas = 'CC';
  // ...
});
```

### 4. **Evitar Consultas Durante Horarios Pico** (MEDIA PRIORIDAD)

**Recomendación**: Evitar ejecutar scraping durante horarios de alta demanda (lunes-viernes, 9-17hrs).

**Implementación**:
- Verificar hora actual antes de iniciar
- Pausar si está en horario de oficina

### 5. **Documentar Uso Interno** (BAJA PRIORIDAD)

**Recomendación**: Mantener documentación clara de que el sistema es para uso interno del despacho.

---

## ⚠️ RIESGOS IDENTIFICADOS

### Riesgo ALTO:
- **Sobrecarga del servidor**: Procesar demasiadas causas muy rápido podría sobrecargar el servidor del PJUD.

### Riesgo MEDIO:
- **Uso comercial indirecto**: Si el despacho cobra por servicios basados en esta información, podría violar el Artículo CUARTO.

### Riesgo BAJO:
- **Detección de automatización**: El sistema ya usa delays y User-Agent real, pero podría mejorarse.

---

## 📝 Checklist de Cumplimiento

- [x] Usar sesión de invitado (ya implementado)
- [x] Delays entre acciones (ya implementado)
- [x] Delay entre consultas de diferentes causas (implementado: 2-4 segundos)
- [x] Límite de volumen diario (IMPLEMENTADO: 150 causas/día por defecto)
- [x] Detección de horarios pico (IMPLEMENTADO: muestra advertencia)
- [ ] Evitar horarios pico automáticamente (OPCIONAL - solo advertencia actualmente)
- [ ] Documentación de uso interno (OPCIONAL)

---

## 🎯 Recomendación Final

### ✅ **El uso actual parece ACEPTABLE** bajo estas condiciones:

1. ✅ El scraping es para **uso interno del despacho** (no comercialización directa)
2. ✅ Ya implementa **delays** y **sesión de invitado**
3. ✅ Busca causas **específicas** (no exploración masiva aleatoria)
4. ✅ No accede a **causas reservadas**

### ⚠️ **MEJORAS RECOMENDADAS** para mayor seguridad:

1. ⚠️ Agregar **delay de 2-5 segundos** entre causas
2. ⚠️ Implementar **límite diario** de consultas (100-200/día)
3. ⚠️ **Documentar** que es para uso interno del despacho

### ❌ **NO HACER**:

1. ❌ Vender la información extraída
2. ❌ Procesar miles de causas en minutos
3. ❌ Acceder a causas reservadas (familia, etc.)
4. ❌ Usar la información para fines contrarios a la ley

---

## 📞 Consulta Legal Recomendada

**IMPORTANTE**: Este análisis NO constituye asesoría legal. Para un uso en producción a gran escala, se recomienda:

1. ✅ Consultar con un abogado especializado en propiedad intelectual y tecnología
2. ✅ Obtener confirmación escrita del Poder Judicial si es posible
3. ✅ Mantener documentación del uso interno

---

## 🔗 Referencias

- **Ley N° 20.886**: Sobre transparencia y acceso a la información pública
- **Acta 37-2016**: Reglamento de consulta unificada de causas
- **Términos y Condiciones PJUD**: [Disponibles en el portal](https://oficinajudicialvirtual.pjud.cl)

---

**Última actualización**: 2026-01-16  
**Estado**: Análisis preliminar - No constituye asesoría legal

