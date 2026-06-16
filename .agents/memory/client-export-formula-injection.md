---
name: Client-side export formula injection
description: Sanitise data-originated strings before writing them to spreadsheet cells in client-side Excel exports.
---

When building client-side Excel/CSV exports (ExcelJS in the client report pages), any
data-originated string written to a cell (case name, account number, organisation name, etc.)
must be guarded against spreadsheet formula injection: if the value begins with `=`, `+`, `-`,
`@`, tab or CR, prefix it with a single apostrophe so the spreadsheet treats it as text.

**Why:** values like `=cmd|...` opened in Excel/Sheets execute as formulas — a stored-data → CSV/XLSX
injection vector. Flagged in code review on the recovery-performance export.

**How to apply:** add a small `safeCell(v)` helper (`/^[=+\-@\t\r]/.test(s) ? "'"+s : s`) and wrap
every user/data string passed to `sheet.addRow(...)`. Numeric/date/formatter outputs are safe.
HTML exports use a separate `esc()` escape for `& < > "`. Note: the other existing report pages
(RecoveryAnalysisReport, CaseSummaryReport, etc.) do NOT yet sanitise — apply this if touching them.
