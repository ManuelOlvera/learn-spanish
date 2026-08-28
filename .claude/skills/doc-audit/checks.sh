#!/usr/bin/env bash
# Mechanical staleness sweep for the docs. Facts only — every finding here is
# something a command can settle. Judgement calls are the skill's job, not this
# script's. Run from the repo root:  bash .claude/skills/doc-audit/checks.sh
#
# Exit code is always 0. Read the output; DRIFT lines are wrong, CHECK lines
# need a human to look.

cd "$(git rev-parse --show-toplevel)" || exit 1
DOCS=(README.md .claude/CLAUDE.md)
while IFS= read -r f; do DOCS+=("$f"); done < <(find docs -name '*.md' | sort)

# The docs that describe the app AS IT IS. Everything else states its claims as
# of a date on purpose: features/shipped.md is an append-log, fable-review/ is
# archived, ADRs record a decision at a moment, bugs.md quotes a parent. A
# figure or a path in those is a record, not a mistake — never audit them.
LIVING=(README.md .claude/CLAUDE.md docs/README.md docs/architecture-diagrams.md
        docs/runbooks.md docs/features/roadmap.md docs/features/pairing.md)

ok()    { printf '  OK     %s\n' "$*"; }
drift() { printf '  DRIFT  %s\n' "$*"; }
check() { printf '  CHECK  %s\n' "$*"; }
hdr()   { printf '\n=== %s\n' "$*"; }
where() { grep -rn "$1" "${DOCS[@]}" 2>/dev/null | sed 's/^/         /'; }

# ---------------------------------------------------------------- 1. the window
hdr "Window since the last audit"
STAMP=.claude/skills/doc-audit/log.md
if [ -f "$STAMP" ]; then
  LAST=$(grep -m1 -oE '^- [0-9]{4}-[0-9]{2}-[0-9]{2} +[0-9a-f]{7,40}' "$STAMP" | awk '{print $3}')
  [ -n "$LAST" ] && echo "  last audit at $LAST"
fi
if [ -n "${LAST:-}" ] && git cat-file -e "$LAST" 2>/dev/null; then
  RANGE="$LAST..HEAD"
else
  RANGE="$(git log -1 --format=%H --before='4 weeks ago' 2>/dev/null || echo '')..HEAD"
  echo "  no usable stamp — falling back to the last 4 weeks"
fi
echo "  range: $RANGE"
git log --oneline "$RANGE" 2>/dev/null | sed 's/^/         /'
echo "  files touched:"
git diff --name-only "$RANGE" 2>/dev/null | sed 's/^/         /'

# ------------------------------------------------------- 2. the content counts
# The numbers most likely to be stale, because /add-content changes them and the
# README states them in prose. Secret decks are counted apart: the README says
# both the visible figure and the "N total" that includes El misterio.
hdr "Content counts"
PACK=packages/core/src/infrastructure/starter-pack.ts
DECKS=$(grep -c '^    id: "' "$PACK")
CARDS=$(grep -c '^      { id: "' "$PACK")
SECRET=$(grep -c '^    secret: true' "$PACK")
SECRET_CARDS=$(awk '/^    secret: true/{f=1} f&&/^      \{ id: "/{c++} f&&/^  \},/{f=0} END{print c+0}' "$PACK")
VIS_DECKS=$((DECKS - SECRET)); VIS_CARDS=$((CARDS - SECRET_CARDS))
SHELVES=$(grep -c '^    nameSpanish:' packages/core/src/infrastructure/deck-groups.ts)
STORIES=$(grep -c '^  {' packages/core/src/infrastructure/story-pack.ts)
STORY_DOCS=$(ls docs/storybook/*.md 2>/dev/null | grep -vc README.md)
echo "  decks: $DECKS total ($VIS_DECKS visible + $SECRET secret)"
echo "  cards: $CARDS total ($VIS_CARDS visible + $SECRET_CARDS secret)"
echo "  shelves: $SHELVES   cuentos: $STORIES (with $STORY_DOCS storybook prompt files)"
# Only the LIVING docs are held to the current figures. features/shipped.md is
# an append-log — "26 decks / 304 words" in a July entry is a correct record of
# that day, and "correcting" it would destroy the log. fable-review/ is archived,
# and ADRs and bugs.md date their own claims. Nothing below reads them.
for n in "$VIS_DECKS" "$DECKS" "$VIS_CARDS" "$CARDS"; do
  grep -rqE "\b$n (decks|words)\b" "${LIVING[@]}" 2>/dev/null \
    || check "no living doc states $n — the README should carry $VIS_DECKS/$DECKS decks and $VIS_CARDS/$CARDS words"
done
[ "$STORIES" = "$STORY_DOCS" ] || drift "$STORIES cuentos in story-pack.ts but $STORY_DOCS prompt files in docs/storybook/"
grep -rn "themed home-screen" README.md | sed 's/^/  CHECK  /'
echo "         (there are $SHELVES shelves; the README spells the number in words)"
echo "  every count claim in the living docs — eyeball these, since a number can"
echo "  be about one game rather than the whole pack:"
grep -rnoE "[0-9]+ (decks|words|cuentos|shelves)" "${LIVING[@]}" 2>/dev/null | sed 's/^/         /'

# ---------------------------------------------- 3. tests and the coverage floor
hdr "Tests and coverage"
if ! command -v pnpm >/dev/null; then
  check "pnpm not on PATH — skipping the suite; run it yourself before trusting this section"
else
  OUT=$(pnpm test 2>&1)
  if echo "$OUT" | grep -qE "Tests +[0-9]+ passed"; then
    echo "$OUT" | grep -E "Tests +[0-9]+|Test Files" | sed 's/^/         /'
  else
    check "the suite is NOT green — fix that before trusting any count"
    echo "$OUT" | tail -20 | sed 's/^/         /'
  fi
  # CLAUDE.md states a coverage floor; hold the real number to it
  FLOOR=$(grep -oE 'Coverage floor: *[0-9]+' .claude/CLAUDE.md | grep -oE '[0-9]+$')
  PCT=$(echo "$OUT" | grep -E '^ *All files' | awk -F'|' '{gsub(/ /,"",$2); print $2}')
  if [ -n "$PCT" ] && [ -n "$FLOOR" ]; then
    awk -v p="$PCT" -v f="$FLOOR" 'BEGIN{ if (p+0 < f+0) printf "  DRIFT  coverage %s%% is under the stated %s%% floor\n", p, f;
                                          else printf "  OK     coverage %s%% clears the %s%% floor\n", p, f }'
  fi
fi

# --------------------------------------------- 4. the localStorage key inventory
# architecture-diagrams.md carries the key inventory. A key added in code and not
# added there is invisible to anyone reasoning about sync, migrations or a reset.
hdr "localStorage key inventory"
comm -23 \
  <(grep -rhoE '"palabras[.:][a-zA-Z0-9_.:-]*"' apps/web/src packages/core/src --include='*.ts' --include='*.tsx' | tr -d '"' | sort -u) \
  <(grep -rhoE 'palabras[.:][a-zA-Z0-9_.:-]*' docs/architecture-diagrams.md | sort -u) \
  | while read -r k; do
      # a key only ever touched through sessionStorage is not a localStorage gap
      if grep -rl "$k" apps/web/src packages/core/src 2>/dev/null | xargs grep -Ll sessionStorage | grep -q .; then
        drift "$k is used in code but not in the docs/architecture-diagrams.md inventory"
      else
        ok "$k is sessionStorage only — outside this inventory by definition"
      fi
    done
comm -13 \
  <(grep -rhoE '"palabras[.:][a-zA-Z0-9_.:-]*"' apps/web/src packages/core/src --include='*.ts' --include='*.tsx' | tr -d '"' | sort -u) \
  <(grep -rhoE 'palabras[.:][a-zA-Z0-9_.:-]*' docs/architecture-diagrams.md | sort -u) \
  | while read -r k; do check "$k is documented but not in code — a retired key (ADR 012 keeps one on purpose) or a typo?"; done

# ------------------------------------------------------------- 5. env and SQL
hdr "Environment variables and migrations"
grep -ohE 'NEXT_PUBLIC_[A-Z0-9_]+' packages/config/src/env.ts | sort -u | while read -r v; do
  grep -rq "$v" README.md docs/ 2>/dev/null && ok "$v is documented" || drift "$v is validated in env.ts but named in no doc"
done
ls supabase/migrations/*.sql 2>/dev/null | while read -r m; do
  grep -rq "$(basename "$m")" docs/runbooks.md docs/README.md 2>/dev/null \
    || check "$(basename "$m") is not named in the runbook — it is applied by hand, so it has to be findable"
done

# ---------------------------------------------------------------- 6. toolchain
hdr "Toolchain versions"
# Only lines that ASSERT a version count. A doc saying "built with Next.js" is
# prose, not a claim about 15.5.21 — matching the bare word buries the signal.
audit_version() {
  local name=$1 val=$2 bad=0
  while IFS= read -r hit; do
    said=$(echo "$hit" | grep -oiE "$name[ :]+v?[0-9][0-9.]*" | grep -oE '[0-9][0-9.]*' | head -1 | sed 's/\.$//')
    case "$val" in "$said"*) ;; *) drift "$name is $val, doc says $said"; echo "         $hit"; bad=1;; esac
  done < <(grep -rniE "$name[ :]+v?[0-9][0-9.]*" "${DOCS[@]}" 2>/dev/null)
  [ $bad -eq 0 ] && ok "$name $val"
}
pkgv() { grep -m1 "\"$2\":" "$1" | grep -oE '[0-9][0-9.]*'; }
audit_version "Next\.js"      "$(pkgv apps/web/package.json next)"
audit_version "Tailwind"      "$(pkgv apps/web/package.json tailwindcss)"
audit_version "TypeScript"    "$(pkgv apps/web/package.json typescript)"
audit_version "vitest"        "$(pkgv packages/core/package.json vitest)"
audit_version "pnpm"          "$(grep packageManager package.json | grep -oE '[0-9][0-9.]*')"

# ------------------------------------------------------------------- 7. links
hdr "Relative links"
BROKEN=0
while IFS= read -r line; do
  loc=${line%%	*}; link=${line#*	}
  f=${loc%%:*}; d=$(dirname "$f"); t=${link%%#*}
  case "$t" in http*|mailto*|"") continue;; esac
  [ -e "$d/$t" ] || { drift "$loc -> $t"; BROKEN=1; }
done < <(grep -rnoE '\]\([^)]+\)' "${DOCS[@]}" | sed 's/](/\t/;s/)$//')
[ $BROKEN -eq 0 ] && ok "every relative link resolves"

# ------------------------------------------------------------------ 8. indexes
hdr "docs/README.md index coverage"
MISS=0
while IFS= read -r p; do
  grep -q "$(basename "$p")\|$(dirname "$p")/" docs/README.md || { drift "docs/$p is not in the index"; MISS=1; }
done < <(find docs -name '*.md' ! -name 'README.md' | sed 's|^docs/||' | sort)
[ $MISS -eq 0 ] && ok "every doc is indexed"
# every index row must carry a living / append-log / archived marker
grep -n '^- \[' docs/README.md | grep -v '\[living\]\|\[append-log\]\|\[archived\]' \
  | sed 's/^/  DRIFT  index row with no living\/append-log\/archived marker: /'
echo "  ADR numbering:"
ls docs/adr | grep -oE '^[0-9]+' | sort | uniq -d | sed 's/^/  DRIFT  duplicate ADR number /'
python3 - <<'PY'
import os, re
ns = sorted(int(m.group(1)) for f in os.listdir('docs/adr')
            if (m := re.match(r'(\d+)-', f)) and f != '000-template.md')
gaps = [n for n in range(1, max(ns) + 1) if n not in ns]
print(f"  {'DRIFT  gap at ADR ' + str(gaps) if gaps else 'OK     001-%03d, no gaps' % max(ns)}")
idx = open('docs/README.md', encoding='utf-8').read()
for f in sorted(os.listdir('docs/adr')):
    if f.endswith('.md') and f not in idx:
        print(f"  DRIFT  adr/{f} has no row in the docs index")
PY

# ------------------------------------------------------------------- 9. skills
hdr "Skills"
for s in .claude/skills/*/; do
  n=$(basename "$s")
  grep -q "/$n\b\|\`$n\`" .claude/CLAUDE.md || drift "/$n exists but CLAUDE.md does not list it"
done
grep -oE '`/[a-z-]+`' .claude/CLAUDE.md | tr -d '`/' | sort -u | while read -r n; do
  [ -d ".claude/skills/$n" ] || check "CLAUDE.md mentions /$n but .claude/skills/$n does not exist"
done

# ------------------------------------------------ 10. paths named in the docs
hdr "Source paths named in the docs"
grep -rhoE '`(apps|packages|supabase|docs)/[a-zA-Z0-9_./@-]+`' "${LIVING[@]}" | tr -d '`' | sed 's:/$::' | sort -u | while read -r p; do
  [ -e "$p" ] || drift "docs point at $p — no such path"
done

# ------------------------------------------------------------------ 11. dates
hdr "Dated claims"
echo "  today: $(date '+%Y-%m-%d')   last commit: $(git log -1 --format=%ad --date=short)"
grep -rnoE '(as of|current as of|reviewed|last audited)[^.]*20[0-9]{2}-?[0-9]*-?[0-9]*' "${DOCS[@]}" | sed 's/^/  CHECK  /'

# -------------------------------------------------------------- 12. the inbox
hdr "docs/bugs.md"
python3 - <<'PY'
import re
t = open('docs/bugs.md', encoding='utf-8').read()
items = re.findall(r'^\s*[-*] .*', t, re.M)
done = [i for i in items if '~~' in i]
print(f"  {len(items)} items, {len(done)} struck through as resolved")
print("  CHECK  anything still open here that the window's commits actually fixed?")
PY
