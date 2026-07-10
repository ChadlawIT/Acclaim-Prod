---
name: ExcelJS dynamic import interop
description: ExcelJS CJS/ESM interop fix required in both static and dynamic imports — production bundles wrap the module differently.
---

## Rule
Any import of `exceljs` (static or dynamic) must resolve the actual constructor via `.default` fallback.

**Dynamic import (routes.ts etc.):**
```ts
const ExcelJSMod = await import("exceljs");
const ExcelJS = (ExcelJSMod as any).default ?? ExcelJSMod;
const wb = new ExcelJS.Workbook();
```

**Static import (email-service-sendgrid.ts etc.):**
```ts
import ExcelJSModule from 'exceljs';
const ExcelJS: typeof ExcelJSModule = (ExcelJSModule as any).default ?? ExcelJSModule;
```

**Why:** In the Azure production bundle (esbuild), `await import("exceljs")` returns the module namespace object where `.Workbook` is undefined. The real Workbook class lives on `.default`. Dev (tsx) works without the fix because tsx resolves CJS differently — so the bug is production-only and easy to miss.

**How to apply:** Every new use of ExcelJS anywhere in the server — whether static import at file top or dynamic import inside a function — must include this `.default ?? mod` pattern.
