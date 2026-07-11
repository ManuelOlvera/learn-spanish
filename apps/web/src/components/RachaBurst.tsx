"use client";

interface Props {
  count: number;
}

/** The ⚡ combo flash: full-screen, non-interactive, fades itself out. */
export function RachaBurst({ count }: Props) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="racha flex flex-col items-center">
        <span className="text-9xl drop-shadow-[4px_4px_0_var(--color-ink)]">
          ⚡
        </span>
        <span className="rounded-full border-4 border-ink bg-[var(--color-lime)] px-6 py-2 text-3xl font-extrabold">
          ¡Racha de {count}!
        </span>
      </div>
    </div>
  );
}
