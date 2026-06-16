---
name: Legacy primary organisationId still required
description: Why users must keep a legacy users.organisationId even though junction userOrganisations exists
---

Users have a legacy `users.organisationId` (single "primary" org) AND a junction table `userOrganisations` (many orgs with roles). Org access is normally resolved by merging both.

**Rule:** When creating or assigning a multi-org user, always set one org as the legacy `users.organisationId` (the primary) and put the rest in the junction table. Do NOT leave `organisationId` null and rely on junction-only.

**Why:** Several org-scoped endpoints hard-fail on `!user.organisationId` and use it directly for writes/authorisation — at least `POST /api/cases` and `POST /api/cases/:id/payments` in server/routes.ts. A junction-only user (legacy null) silently loses the ability to create cases/payments despite having org assignments.

**How to apply:** In multi-select org assignment flows, dedupe the selected ids, use the first as the legacy primary, and add only the remaining to the junction table (avoids double-counting in the org count badge, which sums legacy + junction).
