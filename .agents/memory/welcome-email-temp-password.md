---
name: Welcome email temp-password issuance
description: How the admin "send welcome email" route decides whether to include/reset a temporary password
---
The welcome email offers two sign-in options: Option 1 Microsoft SSO (recommended), Option 2 email+temp-password as a backup. Both SendGrid (`server/email-service-sendgrid.ts`) and the nodemailer fallback (`server/email-service.ts`) render the temp-password block only when `data.temporaryPassword` is set; otherwise they point the user to their existing password + the "Forgotten your password?" OTP flow.

**Rule (POST /api/admin/users/:userId/send-welcome-email):** never email a password that doesn't match the stored hash, and never silently reset an active user.
- Reuse a caller-supplied `temporaryPassword` ONLY if `bcrypt.compare(temporaryPassword, user.hashedPassword)` matches (keeps email consistent with what admin saw on the create/reset screen).
- Else if `user.mustChangePassword` (still onboarding) → `storage.resetUserPassword()` to mint+store a fresh one and email that.
- Else (active user who set their own password) → guidance-only email, no reset.

**Why:** earlier versions blindly reset on every per-user "Email" click, locking out active users; and trusting client plaintext could email a stale/non-working password.

**How to apply:** the admin "Email" buttons in `AdminEnhanced.tsx` gate their confirmation copy on `user.mustChangePassword` too. The local `User` interface in that file must keep `mustChangePassword?: boolean` (it's returned by `db.select().from(users)`).
