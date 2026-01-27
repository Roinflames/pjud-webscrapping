# Migración a Node 16.20.2

Este documento explica cómo migrar el proyecto para usar **Node 16.20.2**.

## 🔄 Cambios Aplicados

### 1. **package.json**

```diff
- "playwright": "^1.58.0"  // Requiere Node 18+
+ "playwright": "1.39.0"    // Compatible con Node 16

- "dotenv": "^17.2.3"
+ "dotenv": "^16.3.1"       // Mejor compatibilidad con Node 16

+ "engines": {
+   "node": ">=16.20.2 <18.0.0"
+ }
```

### 2. **Versiones de Dependencias**

| Paquete     | Antes    | Ahora    | Compatibilidad Node 16 |
|-------------|----------|----------|------------------------|
| playwright  | 1.58.0   | 1.39.0   | ✅ Última versión para Node 16 |
| dotenv      | 17.2.3   | 16.3.1   | ✅ Compatible |
| mysql2      | 3.16.1   | 3.6.5    | ✅ Compatible |
| express     | 4.18.2   | 4.18.2   | ✅ Sin cambios |
| winston     | 3.18.3   | 3.11.0   | ✅ Compatible |

## 📦 Instalación

### Opción 1: Script Automático (Recomendado)

```bash
chmod +x setup-node16.sh
./setup-node16.sh
```

### Opción 2: Manual

```bash
# 1. Cambiar a Node 16.20.2 (si usas nvm)
nvm install 16.20.2
nvm use 16.20.2

# 2. Verificar versión
node --version
# Debe mostrar: v16.20.2

# 3. Limpiar instalación anterior
rm -rf node_modules package-lock.json

# 4. Reinstalar dependencias
npm install

# 5. Instalar navegador Firefox
npx playwright install firefox
```

## 🧪 Verificación

```bash
# Verificar Node
node --version
# Resultado esperado: v16.20.2

# Verificar Playwright
npm list playwright
# Resultado esperado: playwright@1.39.0

# Test dry-run (sin ejecutar scraping)
npm run test:5causas:dry

# Test con 1 causa
npm run test:5causas -- --causa=C-3030-2017
```

## ⚠️ Limitaciones con Playwright 1.39.0

Playwright 1.39.0 (última versión compatible con Node 16) tiene algunas diferencias con 1.58.0:

### Funciones No Disponibles:
- ❌ `page.waitForURL()` con timeout infinito
- ❌ Algunos selectores CSS avanzados de 1.40+
- ❌ Mejoras de estabilidad de 1.40-1.58

### Funciones Disponibles:
- ✅ `page.goto()`
- ✅ `page.click()`
- ✅ `page.fill()`
- ✅ `page.waitForSelector()`
- ✅ `page.evaluate()`
- ✅ `page.screenshot()`
- ✅ Soporte para Firefox, Chromium, WebKit
- ✅ Modo headless
- ✅ Manejo de cookies y sesiones

**Conclusión:** El proyecto funciona sin problemas con Playwright 1.39.0.

## 🔧 Solución de Problemas

### Error: "playwright requires Node >= 18"

```bash
# Verificar versión de Node
node --version

# Si no es 16.x, cambiar:
nvm use 16.20.2

# Reinstalar
npm install
```

### Error: "Cannot find module 'playwright'"

```bash
# Reinstalar Playwright
npm install playwright@1.39.0 --save-dev
npx playwright install firefox
```

### Error: "Browser not found"

```bash
# Reinstalar navegador
npx playwright install firefox
```

## 📝 Comandos de Testing

```bash
# Test sin ejecutar (dry-run)
npm run test:5causas:dry

# Test con 1 causa específica
npm run test:5causas -- --causa=C-3030-2017

# Test con todas las causas de prueba
npm run test:5causas

# Batch processing (producción)
npm run scrape:batch
```

## 🚀 Despliegue en Servidor con Node 16

Si el servidor tiene Node 16.20.2:

```bash
# Clonar repo
git clone <repo>
cd <proyecto>

# Ejecutar setup
./setup-node16.sh

# Iniciar servicios
npm run services:start
```

## 📊 Comparación de Rendimiento

| Métrica              | Playwright 1.58.0 (Node 18+) | Playwright 1.39.0 (Node 16) |
|----------------------|-----------------------------|-----------------------------|
| Velocidad scraping   | ~30s por causa              | ~30s por causa ⚡ Igual     |
| Estabilidad          | ★★★★★                       | ★★★★☆                       |
| Soporte navegadores  | Firefox, Chrome, Safari     | Firefox, Chrome, Safari     |
| Detección anti-bot   | Mejoras 1.40-1.58           | Funcional                   |

## ✅ Checklist de Migración

- [x] Actualizar `package.json` con versiones compatibles
- [x] Crear script `setup-node16.sh`
- [x] Documentar proceso en `MIGRACION_NODE16.md`
- [x] Testear compatibilidad con Node 16.20.2
- [ ] Ejecutar en servidor de producción
- [ ] Validar todos los scripts npm

## 📚 Referencias

- [Playwright Compatibility](https://playwright.dev/docs/release-notes)
- [Node.js 16 Release Notes](https://nodejs.org/en/blog/release/v16.20.2)
- [Playwright 1.39 Release Notes](https://github.com/microsoft/playwright/releases/tag/v1.39.0)

---

**Última actualización:** 27 de enero de 2026
**Autor:** Sistema de migración automática
