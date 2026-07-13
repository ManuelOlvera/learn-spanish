"use client";

import { useEffect, useState } from "react";
import { LETTER_CASES, type LetterCase } from "@learn-spanish/core";
import { getSelectedKid } from "@/lib/kid";
import { getLetterCase, setLetterCase } from "@/lib/letter-case";
import { feedbackSticker } from "@/lib/feedback";

/** What each option draws — the choice is the picture, no reading needed. */
const CASE_FACES: Record<LetterCase, string> = {
  upper: "A",
  lower: "a",
  both: "Aa",
};

/**
 * The letters shelf's case switch: uppercase (the learning default),
 * lowercase, or both together. Per-kid, remembered on this device; every
 * letter card and game face follows it (see lib/emoji.ts cardFace).
 */
export function LetterCasePicker() {
  // null until mounted — the preference lives in localStorage (client-only).
  const [selected, setSelected] = useState<LetterCase | null>(null);

  useEffect(() => {
    const kid = getSelectedKid();
    setSelected(kid === null ? "upper" : getLetterCase(kid));
  }, []);

  function pick(letterCase: LetterCase) {
    const kid = getSelectedKid();
    if (kid !== null) {
      setLetterCase(kid, letterCase);
    }
    setSelected(letterCase);
    feedbackSticker();
  }

  if (selected === null) {
    return <div aria-hidden className="h-20" />;
  }

  return (
    <div
      role="radiogroup"
      aria-label="Which letter case to show"
      className="flex items-center gap-4"
    >
      {LETTER_CASES.map((letterCase) => (
        <button
          type="button"
          key={letterCase}
          role="radio"
          aria-checked={selected === letterCase}
          aria-label={`Show ${letterCase === "both" ? "both cases" : `${letterCase}case letters`}`}
          onClick={() => pick(letterCase)}
          className="sticker flex h-20 w-20 items-center justify-center rounded-2xl text-4xl font-extrabold active:translate-x-1 active:translate-y-1 active:shadow-none"
          style={
            selected === letterCase
              ? ({ "--sticker-face": "var(--color-lime)" } as React.CSSProperties)
              : undefined
          }
        >
          {CASE_FACES[letterCase]}
        </button>
      ))}
    </div>
  );
}
