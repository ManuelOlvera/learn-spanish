"use client";

import { useEffect } from "react";
import { getSelectedKid } from "@/lib/kid";
import { applyTheme, getSelectedTheme } from "@/lib/theme";

/** Applies the current kid's chosen paper theme app-wide, once on mount.
 *  Screens that change the kid or theme re-apply it themselves. */
export function ThemeApplier() {
  useEffect(() => {
    const kid = getSelectedKid();
    if (kid !== null) {
      applyTheme(getSelectedTheme(kid));
    }
  }, []);
  return null;
}
