---
name: Acclaim message direction & embedded sender
description: How message direction (Outgoing vs Incoming) is determined and why it can't rely solely on senderIsAdmin
---

# Acclaim message direction & embedded sender

All Acclaim-side messages coming through the external/SOS API are stored under a single shared
system account (`email@acclaim.law`, id `acclaim-system-user`), with the real handler name
embedded in the message content as `"Handler Name:\n\nbody"`.

`resolveEmbeddedSender()` in `server/storage.ts` detects this prefix and relabels the sender as
`Acclaim (Handler)`, strips the prefix from content, and sets `senderIsAdmin: true`.

**Rule:** message direction (the Outgoing/Incoming badge in Messages Report, computed frontend-side
from `senderIsAdmin` relative to the viewer) must NOT rely solely on the joined `users.isAdmin`,
because the system account may not be flagged admin — that made every Acclaim message read as
"Incoming".

**Why:** if you classify direction purely on the DB admin flag, embedded system-account messages
get mis-classified.

**How to apply:** only treat the `"Name:\n\nbody"` prefix as an embedded sender when the message
genuinely originates from the Acclaim system account (guard on senderEmail/senderId). Without the
origin guard, a genuine client message that happens to start with `"X:\n\nbody"` would be wrongly
flipped to Acclaim/outgoing. Both `getMessagesForUser` branches and `getMessagesForCase` select
`senderEmail` + `senderId`, so the guard works at every call site.
