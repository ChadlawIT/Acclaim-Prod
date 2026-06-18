---
name: Document vs message notification gating
description: Conditions for a user to receive document-upload vs message notification emails (they differ on SSO)
---

**Document-upload notifications** (all paths — in-portal Documents, OrgDocuments, Case Documents, and the external/SOS push endpoint) send to a user when ALL hold:

- `!orgUser.isAdmin`
- `orgUser.email` is set
- `orgUser.documentNotifications !== false` (the user-facing toggle)
- the case is NOT muted for that user (`isCaseMuted`)
- the user is NOT blocked from the case (`isUserBlockedFromCase`)

There is intentionally **no `azureId` (SSO) requirement** on document notifications: local username/password users must also be told about new documents.

**Why:** the four document flows originally also required `orgUser.azureId`, which silently skipped any user who had never signed in via Microsoft SSO — so local-auth users never heard about new documents even with the toggle on. The SSO gate was removed from document notifications on 16 June 2026 at the user's request.

**Message notifications still DO require `azureId`** (`emailNotifications !== false && …azureId`, two gates in routes.ts). These were deliberately left unchanged — only document notifications were in scope. If asked to do the same for messages, lift the `azureId` condition from those message gates too.

**How to apply:** when adding/auditing a document notification flow, do NOT reintroduce an `azureId` gate. When debugging a missing *message* (not document) notification, check `azureId` first.
