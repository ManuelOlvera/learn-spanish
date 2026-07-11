"use client";

import { useState } from "react";

const COLORS = ["#a3e635", "#f59e0b", "#ec4899", "#38bdf8", "#c084fc", "#fb7185"];
const PIECES = 36;

interface Piece {
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
}

/** Confetti rain for the ¡Muy bien! screen. Rendered client-side only
 *  (this component only mounts after a game finishes). */
export function Confetti() {
  const [pieces] = useState<readonly Piece[]>(() =>
    Array.from({ length: PIECES }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.6 + Math.random() * 1.6,
      size: 10 + Math.random() * 10,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
    })),
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
