# PJUD Scraping Standard (HARD RULE)

## 🎯 Goal
All PJUD scraping flows (scripts, workers, APIs, tests) **MUST** delegate the actual scraping to:
- `src/process-causas.js` → `processCausa(page, context, config, outputDir)` (and/or `processMultipleCausas`)

**No other file may implement its own end-to-end scraping flow.**

## 📋 Definition: "scraping flow"
Any code that does one or more of:
- opens browser / creates context / navigates to PJUD OJV
- fills PJUD form (`fillForm`)
- opens detail modal (`detalleCausaCivil` / `openDetalle`)
- extracts results table / movements table (`extractTable`)
- downloads PDFs / ebook
- builds final JSON/NDJSON payloads

**If a file does this without calling `processCausa`, it's a violation.**

## ✅ Allowed structure

### Entry points (scripts/workers/APIs) may:
- read inputs (CSV/DB/queue/request)
- map inputs to `ScrapingConfig`
- call `processCausa` (or `processMultipleCausas`)
- post-process result (persist to DB / enqueue / return HTTP)

### Only the engine (`process-causas.js` + its helpers) may:
- interact with PJUD page for scraping
- implement "how we scrape"

## 🚫 Hard bans
- **DO NOT** create new functions like: `fillForm2`, `openDetalle2`, `extractTable2`, `scrapeXyz`, `processRit` clones.
- **DO NOT** import Playwright directly in non-engine modules (except thin wrappers that call the engine).
- **DO NOT** add new PJUD selectors outside the engine helpers.

## 🔄 Refactor policy
- Do not delete legacy files until usage is proven:
  1) confirmed not referenced by `package.json` scripts
  2) not imported by API routes/workers
  3) not used in deployment docs
- Prefer "compat shims":
  - keep old filename but replace internals with calls to `processCausa`
  - log a deprecation warning

## 📦 Deliverables per change-set
- Update docs describing the new single-engine rule (this file).
- Update references in `package.json` scripts if needed.
- Add at least one smoke test entrypoint that calls the engine with a known config (can be manual-run test).

## ✅ Acceptance criteria (must hold)
- Grep results show only ONE real engine:
  ```bash
  rg -n "chromium|playwright|startBrowser|fillForm|openDetalle|extractTable|detalleCausaCivil" src
  ```
  - only engine + helpers contain scraping steps; others are adapters.

## 📚 Engine API

### `processCausa(page, context, config, outputDir)`
Main scraping function. Returns:
```javascript
{
  success: boolean,
  rol: string,
  fecha: string,
  caratulado: string,
  movimientos: number,
  json_path: string
}
```

### `processMultipleCausas(limit, requireTribunal)`
Batch processing from CSV. Uses `processCausa` internally.

### `ScrapingConfig` format
```javascript
{
  rit: string,              // "C-3030-2017"
  competencia: string,      // "3"
  corte: string,            // "90"
  tribunal: string,         // "61"
  tipoCausa: string,        // "C"
  rol: string,              // "3030"
  año: string,              // "2017"
  caratulado: string,       // optional
  causa_id: number,         // optional
  agenda_id: number,        // optional
  cliente: string,          // optional
  rut: string,              // optional
  abogado_id: number,       // optional
  cuenta_id: number         // optional
}
```

## 🔍 Verification
Run this to find violations:
```bash
# Find files that do scraping without using processCausa
rg -l "fillForm|openDetalle|extractTable" src --type js | \
  grep -v "process-causas.js" | \
  grep -v "form.js" | \
  grep -v "table.js" | \
  grep -v "browser.js" | \
  grep -v "navigation.js"
```

Any results should be adapters that call `processCausa`, not implementers.
