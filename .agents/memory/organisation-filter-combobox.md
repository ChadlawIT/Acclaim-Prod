---
name: Organisation filter combobox
description: Reusable searchable org dropdown for report filters and where to reuse it
---

# OrganisationFilterCombobox

`client/src/components/OrganisationFilterCombobox.tsx` is the shared searchable
(Popover + shadcn Command) organisation dropdown used by all report filters.

**Conventions that must be preserved:**
- Option values are `String(org.id)`; the all-orgs sentinel is `"all"`.
  Downstream filter logic uses `parseInt(orgFilter)`, so any new caller must keep this.
- It sorts organisations alphabetically via `name.localeCompare`.

**Why:** Org dropdowns across report screens + AdminEnhanced were plain unsorted
shadcn `Select`s. Requirement was alphabetical + searchable everywhere.

**How to apply:** For any NEW org dropdown, prefer this component. The two
AdminEnhanced org selectors (create-user form ~L3400, assign-user dialog ~L5727)
are bespoke (own search Input / Command) and sort inline with
`.sort((a,b)=>a.name.localeCompare(b.name))` — not the shared component.
