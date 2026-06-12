---
name: Payment report date semantics
description: Which date field payment-based reports must use for buckets/trends/exports.
---

# Payment report date semantics

All payment-based reports must compute dates from `payments.paymentDate` (the actual
date the payment was made/recorded), **never** `payments.createdAt` (auto-set when the
payment record is pushed into the portal, e.g. via the external/SOS integration).

**Why:** The two dates can differ significantly — a payment made weeks ago may only be
ingested into the portal today. Reporting on `createdAt` misattributes recovery to the
wrong period. The client explicitly confirmed they want every report dated by
`paymentDate`.

**How to apply:** Any 30/60/90-day bucket, monthly trend, period filter, or "Payment
Date" export column over payments must read `paymentDate`. `paymentDate` is `.notNull()`
in the schema, so a `|| createdAt` fallback is only defensive (never triggers for valid
rows). Note `createdAt` on *messages* is correct for message timestamps — this rule is
about payment records only.
