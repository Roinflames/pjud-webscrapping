# Estado Actual del Proyecto - PJUD WebScrapping

## Última sesión: 2026-01-26

### Tarea principal
Implementación de estrategia para recuperación de contexto entre sesiones de Claude Code.

### Estado
En progreso - Configurando estructura de archivos para persistencia de contexto.

### Archivos modificados esta sesión
- `.claude/session-context.md` (nuevo)
- `.claude/history/` (nueva estructura)

### Próximos pasos
- [ ] Validar que la estructura funciona en próximas sesiones
- [ ] Probar flujo de "resume el contexto del proyecto"

---

## Decisiones Recientes

| Fecha | Decisión | Razón |
|-------|----------|-------|
| 2026-01-26 | Crear `.claude/session-context.md` | Persistir estado entre sesiones |
| 2026-01-26 | Mover `prompt/` a `.claude/history/` | Centralizar archivos de Claude en `.claude/` |

---

## Contexto del Proyecto

### Branch actual
`front-estable`

### Cambios pendientes (no commiteados)
- `src/browser.js` - modificado
- `src/config/pjud_config.json` - modificado
- `src/database/db-mariadb.js` - modificado
- `src/exporter.js` - modificado
- `src/table.js` - modificado
- `src/scraping-masivo.js` - nuevo (sin trackear)

### Estado del scraper
- **Causas totales**: 3,221
- **Competencia**: Civil (3) - hardcodeado
- **Modo**: Batch processing con checkpoints

---

## Problemas Activos

- [ ] Ninguno reportado en esta sesión

---

## Cómo usar este archivo

Al iniciar una nueva sesión, pedir a Claude:
> "Resume el contexto del proyecto"

Claude leerá automáticamente:
1. `CLAUDE.md` - documentación técnica
2. `.claude/session-context.md` - este archivo
3. `git status` - cambios actuales
4. `.claude/history/` - prompts históricos relevantes
