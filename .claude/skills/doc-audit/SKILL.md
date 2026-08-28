---
name: doc-audit
description: The weekly sweep that catches documentation the hygiene rule missed — run it on a cadence, not against a change. Verifies every checkable claim in README.md, CLAUDE.md and docs/ against the code (deck and word counts, the localStorage key inventory, coverage floor, env vars, links, the docs index and its markers), reads the commits since the last audit for behaviour the docs still describe wrongly, fixes what is settled and reports what needs a decision. Do NOT use to document a change you are currently making — CLAUDE.md's Documentation Hygiene rule puts that in the same commit.
---

# Audit the docs against the code

Goal: find the places where the docs and ¡Palabras! have drifted apart, and
close them.

**This is a net, not a workflow.** CLAUDE.md's Documentation Hygiene rule still
stands: a change that affects behaviour, configuration or interfaces carries its
docs in the same commit. What this catches is the residue that rule cannot — the
figures that were true when written and went stale on their own. A deck count
moves every time `/add-content` runs and the README states it in prose; a new
`palabras.*` key gets read and written in three files and never reaches the
inventory. Nobody's commit was ever *about* that.

Run it weekly or so. It is expected to find something most weeks and nothing
after a quiet one; **finding nothing is a valid, reportable result** — do not
manufacture edits to justify the run.

## 1. Establish the window

```sh
bash .claude/skills/doc-audit/checks.sh
```

The first section prints the range since the last recorded audit
(`.claude/skills/doc-audit/log.md`), falling back to four weeks if there is no
stamp. It runs `pnpm test` (with coverage) as part of the sweep, so give it a
minute. Read the whole output before touching a file.

`OK` needs nothing. **`DRIFT` is wrong** and, unless it is in the do-not-touch
list below, fix it. **`CHECK` is a claim a command cannot settle** — read the
line, decide, and most of the time leave it alone.

## 2. The judgement pass — what the script cannot see

The script checks facts. It cannot tell that a screen now behaves differently
from how a doc describes it. So read the commits in the window and ask, for each
one, which doc asserted something it just falsified:

```sh
git log --stat <range>
git diff <range> -- packages/core/src apps/web/src
```

Then hold each claim-bearing doc against it:

| Doc | What goes stale in it |
|---|---|
| `README.md` | The **Features** section — a shipped game with no line, a description of behaviour that has since changed, the deck/word/shelf figures. CLAUDE.md's rule is that this section stays *one line per area*: a long write-up belongs in `features/shipped.md`. |
| `.claude/CLAUDE.md` | Architecture rules a new pattern has quietly overtaken, the stack list, the skills list, a banned practice that is now allowed (or vice versa). |
| `docs/architecture-diagrams.md` | **The localStorage key inventory above all** — it is the only place the full set of keys is written down, and sync, migrations and any reset drill are reasoned about from it. Also the monorepo graph and the sync sequence when a boundary moves. Use `/diagram` rather than hand-editing Mermaid. |
| `docs/features/roadmap.md` | Items built in the window that are still listed as planned, and the build order when it changes. |
| `docs/bugs.md` | The parent's inbox. An item fixed in the window gets struck through with its resolution, in the file's existing style — **never delete the original wording**, and never soften it. |
| `docs/runbooks.md` | Deploy, rollback and Vercel steps that no longer match reality, and any `supabase/migrations/*.sql` applied by hand that the runbook does not name. |
| `docs/features/pairing.md` | Parent-facing instructions — a changed screen name or step makes this actively misleading to someone who does not read code. |
| `docs/README.md` | A new doc with no row, or a row missing its **[living] / [append-log] / [archived]** marker. |

If the window touched sync, the wallet, or anything with an epoch, re-read the
ADR that owns it (004 sync, 006/007 epochs, 008 the counter wallet, 013 the
answer log, 014 the boost) before assuming a doc is wrong.

## 3. Fix, ask, or leave

**Fix without asking** — settled facts with one right answer: a deck or word
count in a living doc, an undocumented `palabras.*` key, a broken link, a missing
index row or marker, a source path that no longer exists, an env var named
nowhere, a roadmap item that shipped.

**Report and ask** — anything where being wrong is a judgement: a Features line
that needs writing from scratch, a claim about *why* something works the way it
does, a doc whose whole framing is now off.

**Leave alone:**

- **`docs/features/shipped.md`. It is an append-log.** "26 decks / 304 words" in
  a July entry is a correct record of that July, not a stale number. Editing a
  past entry destroys the log. New work is *appended*; nothing above is touched.
- **`docs/fable-review/`** — archived, a point-in-time review. Every figure in it
  is meant to read as 2026-07-13.
- **ADRs** — an ADR quoting a decision a later one superseded is doing its job.
  Amend by writing a new ADR, never by rewriting an old one.
- **Struck-through items in `bugs.md`**, in the parent's original wording.
- **`docs/storybook/`** — image-generation prompts and the cast bible. Creative
  content, not a description of the code; it does not drift.
- **The voice.** These docs are written in a particular way — plain, specific,
  the reason attached. Match it. Do not rewrite a paragraph you merely came to
  correct a number in, and do not add headings or bullet lists to a doc that
  does not use them. The Spanish stays Spanish.

## 4. Record the audit

Append one line to `.claude/skills/doc-audit/log.md`, newest first — the date,
the HEAD sha at audit time, and one sentence of what was found. That sha is what
the next run diffs against, so it goes in even when nothing was found.

```
- 2026-08-29  cbab794  Six palabras.* keys missing from the inventory; two dead source paths.
```

## 5. Ship it

**Pushing `main` auto-deploys prod** (ADR 002, git-connected 2026-07-10), so a
docs-only commit still deploys — harmlessly, since no runtime file changed, but
say so rather than implying nothing happened. If the audit touched anything under
`apps/` or `packages/`, it is no longer a docs change: run the full `/ship`
checklist including verify. Then report and stop — never poll prod.

If the audit turned up a *code* bug (a runbook step that no longer works usually
means one), do not fix it here: that is `/investigate`, with its own regression
test.

## The report

Say what was checked, what was fixed, and what was left for a decision.
"Everything is current" is the right answer when it is true — with the window and
the checks named, so it is a claim rather than a shrug.
