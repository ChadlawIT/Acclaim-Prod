---
name: External SOS API — message attachments
description: How the external SOS-facing message endpoint handles optional/multiple attachments and why.
---

# External SOS message endpoint attachments

`POST /api/external/cases/:externalRef/messages` accepts optional file attachments in the same request as the message (multipart). Files are sent under a single canonical multipart field `attachments`, capped at 10 via `upload.array('attachments', 10)` (true ingress cap); per-file 25MB via global multer limit. A wrapper middleware catches MulterError and returns 413 (too large) / 400 (too many/unexpected) with temp-file cleanup.

**Schema constraint:** the `messages` table has only single-attachment columns (attachmentFileName/Path/Size/Type). So with multiple files, only the FIRST file is shown inline on the message thread; EVERY file (incl. the first) is saved as a `documents` row linked to caseId + organisationId (uploadedBy = resolved Acclaim system user). This mirrors the portal UI's own message-with-attachment behaviour and the standalone `/documents` endpoint.

**Why bounded multer + cleanup:** external endpoint is unauthenticated (see below), so an unbounded `upload.any()` is a disk/DoS risk. `upload.array(field, max)` enforces a real ingress cap (note: `upload.fields` caps each field independently, not a true total — don't use it for a global cap). Multer writes temp files before validation, so a `cleanupTempFiles()` (fs.unlink best-effort) runs on every early return + catch, and the multer-error wrapper cleans partial writes. Per-file document-insert failure intentionally does NOT unlink (first file is referenced by the saved message).

**Pre-existing TODO (not introduced here):** all `/api/external/*` routes lack API-key auth. SOS currently calls them unauthenticated; adding auth must be coordinated so it doesn't break SOS. Track separately.
