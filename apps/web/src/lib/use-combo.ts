"use client";

import { useState } from "react";
import { isComboMilestone } from "@learn-spanish/core";
import { feedbackCorrect, feedbackRacha, feedbackWrong } from "@/lib/feedback";

interface Options {
  /** Set false when the game plays its own wrong-answer sound — el globo
   *  hisses air out of the balloon, and the generic buzzer on top of it
   *  both muddies the metaphor and doubles the volume. */
  readonly wrongSound?: boolean;
}

/** Shared consecutive-correct tracking: sounds per answer, ⚡ at milestones. */
export function useCombo(options?: Options) {
  const [combo, setCombo] = useState(0);
  const [racha, setRacha] = useState<number | null>(null);

  function correct() {
    const next = combo + 1;
    setCombo(next);
    if (isComboMilestone(next)) {
      setRacha(next);
      feedbackRacha();
    } else {
      feedbackCorrect(next);
    }
  }

  function wrong() {
    setCombo(0);
    if (options?.wrongSound !== false) {
      feedbackWrong();
    }
  }

  function reset() {
    setCombo(0);
    setRacha(null);
  }

  return { racha, correct, wrong, reset };
}
