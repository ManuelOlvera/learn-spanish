"use client";

import { useState } from "react";
import { isComboMilestone } from "@learn-spanish/core";
import { feedbackCorrect, feedbackRacha, feedbackWrong } from "@/lib/feedback";

/** Shared consecutive-correct tracking: sounds per answer, ⚡ at milestones. */
export function useCombo() {
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
    feedbackWrong();
  }

  function reset() {
    setCombo(0);
    setRacha(null);
  }

  return { racha, correct, wrong, reset };
}
