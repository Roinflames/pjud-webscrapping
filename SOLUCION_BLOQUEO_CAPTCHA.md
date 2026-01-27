# 🛡️ Solución: Bloqueo y CAPTCHA del PJUD

## Problema
El PJUD ha implementado reCAPTCHA y posiblemente ha bloqueado la IP debido a demasiadas solicitudes.

## ✅ Soluciones Implementadas

### 1. **Detección Automática de CAPTCHA/Bloqueo**
- ✅ Detección de iframes de reCAPTCHA
- ✅ Detección de mensajes de bloqueo en la página
- ✅ Verificación de URLs y títulos que indican bloqueo
- ✅ Búsqueda de palabras clave relacionadas con bloqueo

### 2. **Rotación de User-Agents**
- ✅ 5 user-agents diferentes rotando aleatoriamente
- ✅ Headers HTTP adicionales para parecer más real
- ✅ Configuración de idioma español

### 3. **Delays Aumentados**
- ✅ Delay entre causas: **5-15 segundos** (antes: 0.5-1.5s)
- ✅ Delay después de errores: **3-5 segundos** (antes: 1.5-2.5s)
- ✅ Pausa extendida cuando se detecta CAPTCHA: **30-60 segundos**

### 4. **Manejo de Bloqueos**
- ✅ Detección automática después de cada causa
- ✅ Pausa extendida y recarga cuando se detecta bloqueo
- ✅ Guardado automático de causas pendientes si se detiene
- ✅ Mensajes claros sobre qué hacer

## 🚨 Qué Hacer Si Te Bloquearon

### Opción 1: Esperar (Recomendado)
```bash
# Espera 1-2 horas antes de continuar
# El bloqueo suele ser temporal
```

### Opción 2: Usar VPN/Proxy
```bash
# Cambia tu IP usando una VPN o proxy
# Luego ejecuta el scraping nuevamente
```

### Opción 3: Reducir Velocidad Manualmente
Edita `src/process-causas.js` y aumenta los delays:
```javascript
// Línea ~270: Aumentar delay entre causas
const delay = 10000 + Math.random() * 20000; // 10-30 segundos
```

### Opción 4: Procesar en Lotes Pequeños
```bash
# Procesa solo 10-20 causas a la vez
node src/process-causas.js 10
```

## 📋 Archivos Modificados

1. **`src/utils/captcha-detector.js`** (NUEVO)
   - Detecta CAPTCHA y bloqueos
   - Maneja recuperación automática

2. **`src/browser.js`**
   - Rotación de user-agents
   - Headers HTTP adicionales

3. **`src/process-causas.js`**
   - Verificación de CAPTCHA después de cada causa
   - Delays aumentados significativamente
   - Guardado de causas pendientes

4. **`src/form.js`**
   - Verificación de CAPTCHA antes y después de búsquedas

5. **`src/navigation.js`**
   - Verificación de CAPTCHA antes de navegar

## 🔍 Cómo Verificar Si Estás Bloqueado

El script ahora detecta automáticamente bloqueos y muestra mensajes como:
```
❌ CAPTCHA/Bloqueo detectado después de procesar causa X
   Tipo: captcha
   Razón: iframe[title*="reCAPTCHA"]
```

## ⚙️ Configuración Recomendada

### Para Evitar Bloqueos:
1. **Procesa en horarios de menor tráfico** (madrugada)
2. **Usa delays largos** (5-15 segundos mínimo)
3. **Procesa en lotes pequeños** (10-50 causas)
4. **Considera usar VPN/proxy** si es necesario

### Si Ya Estás Bloqueado:
1. **Espera 1-2 horas**
2. **Cambia tu IP** (VPN/proxy)
3. **Reduce la velocidad** aún más
4. **Procesa menos causas por sesión**

## 📊 Monitoreo

El script ahora:
- ✅ Detecta bloqueos automáticamente
- ✅ Guarda causas pendientes si se detiene
- ✅ Muestra mensajes claros sobre el estado
- ✅ Intenta recuperarse automáticamente

## 🚀 Ejecución Segura

```bash
# Procesar solo 10 causas con delays largos
node src/process-causas.js 10

# Si funciona bien, aumentar gradualmente
node src/process-causas.js 50
node src/process-causas.js 100
```

---

**Nota:** Si el bloqueo persiste después de esperar, considera contactar al administrador del PJUD o usar métodos alternativos de acceso a los datos.


