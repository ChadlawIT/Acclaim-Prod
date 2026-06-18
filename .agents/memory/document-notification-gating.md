---
name: Document upload notification gating
description: Conditions that must all hold for a user to receive a document-upload email
---

A user only receives a document-upload notification email when ALL of these are true (applies to every upload path — in-portal admin upload, org documents, case documents, and the external/SOS push endpoint):

- `!orgUser.isAdmin`
- `orgUser.email` is set
- `orgUser.documentNotifications !== false` (the user-facing toggle)
- `orgUser.azureId` is set (i.e. the user has signed in via Microsoft/Azure SSO at least once)
- the case is NOT muted for that user (`isCaseMuted`)
- the user is NOT blocked from the case (`isUserBlockedFromCase`)

**Why:** the `azureId` requirement is the surprising one — a user can have the document-notification toggle ON and still receive nothing because they have never logged in via Azure SSO (so `azureId` is null). This caused confusion ("notifications on but no email") for an SOS-pushed document.

**How to apply:** when a user reports a missing document notification, check `azureId` first, then the toggle, then mute/block. If non-SSO (local-auth) users should also be notified, the `azureId` gate must be removed/relaxed consistently across ALL these flows, not just one route. The external/SOS document endpoint defaults notifications ON but honours `sendNotifications=false` in the request body.
