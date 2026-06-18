---
name: Notification email gating (documents & messages)
description: Conditions for a user to receive document-upload and message notification emails; SSO gate history
---

**Document-upload notifications** (in-portal Documents, OrgDocuments, Case Documents, external/SOS push) send to a user when ALL hold:
- `!isAdmin`, `email` set, `documentNotifications !== false`, case not muted (`isCaseMuted`), user not blocked (`isUserBlockedFromCase`).

**Message notifications** (admin→user, admin→organisation) send when:
- admin→user: `email` set, `!isAdmin`, `emailNotifications !== false`, not muted, not blocked.
- admin→org: `!isAdmin`, `email` set, `emailNotifications !== false`.

There is intentionally **no `azureId` (Microsoft SSO) requirement** on either document or message notifications. Local username/password users must receive both.

**Why:** all these flows originally also required `azureId`, which silently skipped users who had never signed in via Microsoft SSO — so local-auth users never heard about new documents or messages even with their toggle on. The SSO gate was removed from **document** notifications on 16 June 2026 and from **message** notifications immediately after, both at the user's request.

**Still SSO-gated:** `server/scheduled-reports.ts` skips users with no `azureId` (`if (!user.azureId)`) — scheduled email reports still only go to SSO users. Left unchanged because only document/message notifications were in scope; lift it there too if asked.

**How to apply:** do NOT reintroduce an `azureId` gate on document or message notification flows. Recipient eligibility is now toggle + non-admin + email + mute/block only.
