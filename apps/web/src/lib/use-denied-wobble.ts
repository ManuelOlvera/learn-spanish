"use client";

import { useState } from "react";
import { feedbackWrong } from "./feedback";

/**
 * The "can't afford it" beat shared by every buy button: a wrong-buzz plus a
 * nonce bump. Put the nonce in the button's `key` so React remounts it and the
 * CSS wobble animation re-triggers on every refusal, not just the first.
 */
export function useDeniedWobble(): { nonce: number; deny: () => void } {
  const [nonce, setNonce] = useState(0);
  return {
    nonce,
    deny() {
      feedbackWrong();
      setNonce((n) => n + 1);
    },
  };
}
