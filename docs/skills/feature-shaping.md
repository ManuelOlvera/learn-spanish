# Feature shaping (used by /shape)

Turn a vague feature request into a small, explicit, agreed scope **before any
code**. The failure this prevents: guessing at scope and building the wrong or
oversized thing.

## The forcing questions

Ask in one tight round; infer from the codebase what you safely can, ask only
what you can't.

1. **Who is it for?** Which kid/persona, and what can they *not* do (read,
   type, sit still)?
2. **What is the one behavior that must work?** One sentence. If it needs
   "and", it's two features.
3. **What's the cut-line?** What is explicitly deferred? A slice with no
   deferred items is too big.
4. **Where does it live?** Which layers (`domain` / `application` /
   `infrastructure` / `apps/web`) does it touch — and which does it *not*?
5. **How will we know it works?** The unit test and the observable
   click-through behavior.

## The shape block

Write the answers down as a short approval block: *Problem & user · The one
behavior · In scope / Out of scope · Affected layers · How we'll know.*
Get an explicit yes before coding. Record scope cuts the user makes during
approval — they override the proposed shape.

## Rules

- No architecture, file lists, or code during shaping — that's planning,
  which happens after the yes.
- Reuse existing content/adapters before proposing new content or dependencies;
  new content is usually the hidden cost.
- Deferred ≠ dropped: park cut items in `docs/features/roadmap.md`.
