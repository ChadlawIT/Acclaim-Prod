---
name: Azure auto-invite on user creation
description: Portal already auto-invites new users to Azure as B2B guests; the real gate is a Graph permission in Azure, not code
---

The portal **already** sends a Microsoft B2B guest invitation automatically when an admin creates a user. `inviteUserToAzure()` (server/azure-auth.ts) gets an app-only client-credentials token and calls Microsoft Graph `POST /invitations`. It is invoked from the create-user route (`POST /api/admin/users`) in the background.

**It is non-blocking by design:** if the invite fails, user creation still succeeds and the failure is only written to logs as `[Azure Invite] …`. So "invites aren't arriving" looks like nothing happening at all.

**The operational gate is in Azure, not the code:** the app registration must be granted the Microsoft Graph **application** permission **`User.Invite.All`** with **admin consent**. Without it Graph returns 403 `Authorization_RequestDenied` and no invite email is sent.

**Why:** AADSTS90072 ("account needs to be added as an external user in the tenant first") is the textbook B2B-guest error in a standard Entra workforce tenant — which is why the build targets the `/invitations` (B2B guest) model first. If logs show a CIAM / Entra External ID tenant rejecting `/invitations`, the fallback is the CIAM local-account model instead.

**How to apply:** before rebuilding any Azure-invite feature, check this function already exists. If invites don't arrive, first check Graph `User.Invite.All` consent and the `[Azure Invite]` deployment logs — don't assume the code is missing.

There is now a **"Resend invite"** (Send icon, label "Invite") button per user in the admin Users tab. It hits `POST /api/admin/users/:userId/resend-invite`, runs the invite **synchronously**, and returns the real Graph/token error text to the admin toast — use this to diagnose silent failures without Azure log access. `inviteUserToAzure` now returns full status+body on failure.
