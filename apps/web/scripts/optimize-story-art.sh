#!/usr/bin/env bash
# Resize freshly generated story art into the committed asset folder.
#
#   apps/web/art-source/<story-id>/<page>.png   (originals, gitignored —
#                                                whatever the generator made)
#        │  sips -Z 900, JPEG q75
#        ▼
#   apps/web/src/story-art/<story-id>-<page>.jpg  (committed, imported by
#                                                  lib/story-art.ts)
#
# One folder per story, pages numbered 1..n — the folder name IS the story id
# (see packages/core/src/infrastructure/story-pack.ts), which is what lets the
# output filename match the `image` key a page declares.
#
# JPEG, not PNG, and measured rather than assumed: this art *looks* flat but is
# rendered with soft gradients and continuous tone, so 24-bit PNG (sips does no
# palette quantization) lands at ~700-900 KB a page — 5 MB for one story. The
# same page at JPEG q75 is ~115 KB with no ringing visible in a 384px-wide card.
# WebP would be better still, but sips can only *read* it and this repo has no
# cwebp/magick; a build must never need a tool the machine may not have.
# See docs/adr/009-story-art-assets.md.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
src="$here/art-source"
out="$here/src/story-art"
# The picture area is ~384px wide at the card's max width; 900 covers 2× screens.
width=900
quality=75
# Per-image ceiling, ~30% above what a page of this art actually costs.
budget=$((150 * 1024))

mkdir -p "$out"
shopt -s nullglob nocaseglob

stories=("$src"/*/)
if [ ${#stories[@]} -eq 0 ]; then
  echo "No story folders in $src."
  echo "Drop generated pages in art-source/<story-id>/<page>.png — e.g."
  echo "  art-source/rana-lluvia/1.png … 6.png"
  exit 0
fi

fail=0
total=0
for dir in "${stories[@]}"; do
  story="$(basename "$dir")"
  pages=("$dir"*.png)
  if [ ${#pages[@]} -eq 0 ]; then
    echo "$story — no PNGs, skipped"
    continue
  fi
  echo "$story"
  for f in "${pages[@]}"; do
    page="$(basename "${f%.*}")"
    if ! [[ "$page" =~ ^[0-9]+$ ]]; then
      echo "  ✗ $(basename "$f") — page files must be numbered (1.png, 2.png …)"
      fail=1
      continue
    fi
    name="$story-$((10#$page)).jpg"
    sips -Z "$width" -s format jpeg -s formatOptions "$quality" "$f" \
      --out "$out/$name" >/dev/null
    size=$(wc -c < "$out/$name")
    total=$((total + size))
    if [ "$size" -gt "$budget" ]; then
      echo "  ✗ $name — $((size / 1024)) KB, over the $((budget / 1024)) KB budget"
      fail=1
    else
      echo "  ✓ $name — $((size / 1024)) KB"
    fi
  done
done

echo
echo "Total committed art: $((total / 1024)) KB"

if [ "$fail" -eq 1 ]; then
  echo
  echo "Over budget, or badly named. Flat vector art this size should fit"
  echo "comfortably — an oversized file usually means the generator returned"
  echo "something photographic or heavily textured. Regenerate it with the"
  echo "style block in docs/story-art-prompts.md rather than raising the ceiling."
  exit 1
fi

echo
echo "Now register each image in apps/web/src/lib/story-art.ts and set the"
echo "matching \`image\` key on that page in story-pack.ts."
