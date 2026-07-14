"use client";

/**
 * Last-resort boundary for errors in the root layout itself — it must render
 * its own <html>/<body> and can't rely on any app chrome. Same picture-only
 * recovery as error.tsx, inline-styled because globals.css may not have
 * loaded in this failure mode.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "2rem",
          background: "#fbf3e2",
          fontFamily: "ui-rounded, system-ui, sans-serif",
        }}
      >
        <span aria-hidden style={{ fontSize: "6rem" }}>
          🙈
        </span>
        <a
          href="/"
          aria-label="Back home"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "6rem",
            height: "6rem",
            fontSize: "3rem",
            background: "#ffffff",
            border: "4px solid #221f1a",
            borderRadius: "1.5rem",
            boxShadow: "8px 8px 0 #a3e635",
            textDecoration: "none",
          }}
        >
          🔄
        </a>
        {/* The reload link doubles as recovery: fresh HTML + matching chunks. */}
        <span hidden>{error.digest}</span>
      </body>
    </html>
  );
}
