---
name: Dialog mobile scroll & pinned close
description: How the base shadcn DialogContent keeps its close (X) reachable on tall/mobile dialogs, and the constraint this places on command.tsx.
---

# Base DialogContent structure (client/src/components/ui/dialog.tsx)

The base `DialogContent` is a **non-scrolling flex-col outer** (`flex flex-col max-h-[90dvh] overflow-hidden`) wrapping a **scrolling inner div** (`grid min-h-0 gap-4 overflow-y-auto p-6`) that holds `{children}`. The close (X) button is `absolute` on the outer (which never scrolls), so it stays pinned in the top-right while content scrolls — even for the ~16 call sites that still pass their own `max-h-[Xvh] overflow-y-auto` (those land on the outer; the inner absorbs the scroll so the outer never actually overflows).

**Why:** Original bug — tall dialogs (reply message, case detail) opened taller than the mobile viewport; the X was off-screen and content couldn't be scrolled to reach it. Earlier attempt used a `sticky` first-child close with negative grid margins (`mb-[-2.25rem]`) — rejected as brittle (grid tracks don't collapse reliably).

**How to apply:** Padding/gap now live on the **inner wrapper**, not the outer. Any consumer that needs different padding on the content area must target the inner wrapper, e.g. `command.tsx` uses `[&>div]:p-0` on its `DialogContent` className (its old plain `p-0` only affected the outer, which no longer has padding). If you restructure the wrapper (remove/rename the inner div), update that `[&>div]` selector or command/CommandDialog padding breaks. `min-h-0` on the inner div is required for the flex child to shrink and scroll.
