---
name: Statement routes ESM require ban
description: require() in routes.ts helper functions breaks silently in tsx ESM mode after explicit restart; use top-level fs import instead.
---

## Rule
Never use `require()` inside any function in `server/routes.ts`. Use the top-level `import fs from "fs"` (line ~63) directly.

## Why
`tsx server/index.ts` runs the server as an ES module. `require` is not defined in ESM. However, tsx's HMR/watch mode shims `require` during hot reloads, so the code *appears* to work during development restarts triggered by file changes. When the workflow is explicitly restarted (full process restart), the shim is absent and any `require()` call throws `ReferenceError: require is not defined` at runtime — causing 500s with no obvious compile-time warning.

## How to apply
- `findStatementFile` and any other sync helper functions must use the module-level `fs` import.
- Route handlers that do `const fs = await import("fs")` locally are fine for their own use, but closures they call (like `findStatementFile`) will see the top-level `fs`, not the local one — which is the correct behaviour after this fix.
- If a new helper needs fs, add it at module scope using the existing top-level import; do not reach for require().
