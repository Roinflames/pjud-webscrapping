# 📊 Guía de Prueba de Carga - Sistema PJUD

Esta guía explica cómo realizar pruebas de carga para determinar los recursos de hosting necesarios.

## 🎯 Objetivo

Determinar:
- **RAM necesaria** (mínimo y recomendado)
- **CPU necesaria** (vCPU mínimo)
- **Disco necesario** (considerando PDFs)
- **Capacidad de procesamiento** (RITs por hora/día)

---

## 🚀 Ejecutar Prueba de Carga

### Opción 1: Prueba Automatizada (Recomendada)

```bash
# Prueba básica (3 escenarios, 10 minutos)
node scripts/test-carga.js

# Prueba completa (4 escenarios, 30 minutos)
node scripts/test-carga.js --scenarios 4 --duration 30

# Prueba extendida (4 escenarios, 60 minutos)
node scripts/test-carga.js --scenarios 4 --duration 60
```

### Opción 2: Monitoreo Manual

```bash
# Monitoreo en tiempo real
bash scripts/monitor-recursos.sh

# O usar herramientas del sistema
htop
# o
top
```

---

## 📊 Escenarios de Prueba

### Escenario 1: Carga Normal
- **Scraping**: 1 cada 5 minutos (12 por hora)
- **API**: 10 peticiones/minuto (600 por hora)
- **Listener**: Verificación cada 10 segundos
- **Uso esperado**: ~20-30% CPU, ~1-2GB RAM

### Escenario 2: Carga Media
- **Scraping**: 1 cada 2 minutos (30 por hora)
- **API**: 30 peticiones/minuto (1,800 por hora)
- **Listener**: Verificación cada 5 segundos
- **Uso esperado**: ~40-50% CPU, ~2-3GB RAM

### Escenario 3: Carga Alta
- **Scraping**: 1 cada minuto (60 por hora)
- **API**: 60 peticiones/minuto (3,600 por hora)
- **Listener**: Verificación cada 2 segundos
- **Uso esperado**: ~60-70% CPU, ~3-4GB RAM

### Escenario 4: Carga Pico (Máxima)
- **Scraping**: 1 cada 30 segundos (120 por hora)
- **API**: 100 peticiones/minuto (6,000 por hora)
- **Listener**: Verificación cada segundo
- **Uso esperado**: ~80-90% CPU, ~4-5GB RAM

---

## 📈 Interpretar Resultados

### Ejemplo de Salida:

```
==========================================
📊 REPORTE DE PRUEBA DE CARGA
==========================================
⏱️  Duración: 10.00 minutos
📈 Escenarios ejecutados: 3

💻 RECURSOS:
   CPU promedio: 45.23%
   CPU pico: 78.50%
   RAM promedio: 2.15 GB
   RAM pico: 3.42 GB
   RAM total disponible: 4.00 GB

📊 ACTIVIDAD:
   Peticiones API: 1,250
   Tareas scraping: 25
   Errores: 0

💡 RECOMENDACIONES:
   RAM recomendada: 5 GB (mínimo 4 GB)
   CPU recomendada: 2 vCPU (mínimo 2 vCPU)
   Disco: 50 GB mínimo (PDFs se acumulan)
```

### Cómo Interpretar:

1. **CPU Pico**: Si supera 80%, necesitas más vCPU
2. **RAM Pico**: Si supera 80% de la RAM total, necesitas más memoria
3. **Errores**: Si hay errores, puede ser por falta de recursos

---

## 🔍 Métricas a Observar

### Durante la Prueba:

1. **CPU Usage**: No debería superar 80% constantemente
2. **Memory Usage**: No debería superar 80% de la RAM total
3. **Disk I/O**: Verificar que no haya cuellos de botella
4. **Network**: Verificar ancho de banda si hay muchas peticiones API

### Después de la Prueba:

1. **Reporte JSON**: Se guarda en `logs/test-carga-report.json`
2. **Recomendaciones**: El script genera recomendaciones automáticas
3. **Tendencias**: Observar si el uso aumenta con el tiempo

---

## 💡 Recomendaciones por Escenario

### Si tu carga es Normal (Escenario 1):
- **RAM**: 2-3 GB
- **CPU**: 2 vCPU
- **Disco**: 30 GB
- **Hosting**: VPS Básico

### Si tu carga es Media (Escenario 2):
- **RAM**: 3-4 GB
- **CPU**: 2 vCPU
- **Disco**: 50 GB
- **Hosting**: VPS Básico/Intermedio

### Si tu carga es Alta (Escenario 3):
- **RAM**: 4-6 GB
- **CPU**: 2-4 vCPU
- **Disco**: 50-100 GB
- **Hosting**: VPS Intermedio

### Si tu carga es Pico (Escenario 4):
- **RAM**: 6-8 GB
- **CPU**: 4 vCPU
- **Disco**: 100 GB
- **Hosting**: VPS Avanzado o Cloud

---

## 🛠️ Pruebas Adicionales

### Prueba de Estrés (Stress Test)

```bash
# Ejecutar múltiples instancias simultáneas
for i in {1..5}; do
  node scripts/test-carga.js --scenarios 4 --duration 10 &
done
wait
```

### Prueba de Memoria (Memory Leak Test)

```bash
# Ejecutar por varias horas para detectar memory leaks
node scripts/test-carga.js --scenarios 3 --duration 240  # 4 horas
```

### Prueba de Disco (Disk Usage)

```bash
# Simular descarga de muchos PDFs
# Crear script que genere archivos grandes
# Monitorear uso de disco
df -h
du -sh src/outputs/
```

---

## 📋 Checklist de Prueba

- [ ] Ejecutar prueba básica (10 minutos)
- [ ] Ejecutar prueba completa (30-60 minutos)
- [ ] Verificar CPU no supera 80%
- [ ] Verificar RAM no supera 80%
- [ ] Verificar no hay errores
- [ ] Revisar reporte JSON generado
- [ ] Comparar con requisitos de hosting
- [ ] Ajustar configuración si es necesario

---

## 🚨 Problemas Comunes

### CPU muy alta (>90%)
**Solución**: 
- Reducir frecuencia de scraping
- Aumentar vCPU
- Optimizar código

### RAM muy alta (>90%)
**Solución**:
- Aumentar RAM
- Limpiar archivos antiguos
- Optimizar uso de memoria en Playwright

### Errores frecuentes
**Solución**:
- Verificar logs: `pm2 logs`
- Aumentar recursos
- Revisar configuración

---

## 📊 Ejemplo de Resultados Reales

### Prueba en Servidor con 4GB RAM, 2 vCPU:

```
Duración: 30 minutos
Escenarios: 3 (Normal, Media, Alta)

Resultados:
- CPU promedio: 42%
- CPU pico: 76%
- RAM promedio: 2.1 GB
- RAM pico: 3.2 GB

Recomendaciones:
- RAM: 4 GB (suficiente)
- CPU: 2 vCPU (suficiente)
- Disco: 50 GB (recomendado)
```

**Conclusión**: VPS con 4GB RAM y 2 vCPU es suficiente para carga media-alta.

---

## 📞 Siguiente Paso

Después de la prueba:

1. **Revisar reporte** en `logs/test-carga-report.json`
2. **Comparar** con planes de hosting disponibles
3. **Contratar** el plan que cumpla con las recomendaciones
4. **Configurar** el servidor siguiendo `docs/HOSTING_RECOMENDACIONES.md`

---

**¿Necesitas ayuda interpretando los resultados?** Revisa el reporte JSON generado o ejecuta el monitoreo en tiempo real.
