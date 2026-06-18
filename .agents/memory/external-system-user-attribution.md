---
name: External endpoint system-user attribution
description: How /api/external/* writes must attribute records to the shared Acclaim system user across environments
---

External (SOS-facing) write endpoints attribute records to a shared "Acclaim system user" via a user foreign key (e.g. documents.uploadedBy, messages.senderId — both reference users.id). That system user MUST be resolved dynamically at request time:

1. `getUserByEmail('email@acclaim.law')`
2. fallback `getUser('acclaim-system-user')`
3. if still missing, return an explicit 500 — never create on the fly (avoids duplicate-key races).

**Why:** dev and production (Azure) databases have different user id values. A hardcoded user id works in dev but violates the FK in prod, so the insert throws and the route's catch returns a generic HTTP 500 with no useful detail. This exact bug made SOS document uploads fail with 500 in prod while messages (which already used the dynamic lookup) worked.

**How to apply:** whenever adding/auditing an `/api/external/*` route that sets any user FK (uploadedBy, senderId, recordedBy, performedBy, etc.) for system-originated writes, use the email-based lookup above. Treat any hardcoded user id literal in these routes as an environment-coupling bug. Note these external routes currently have NO API auth (pre-existing design).
