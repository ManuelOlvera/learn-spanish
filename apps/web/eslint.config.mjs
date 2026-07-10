import tseslint from "typescript-eslint";

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    rules: {
      // Logging goes through @learn-spanish/config's logger, never console.
      "no-console": "error",
    },
  },
  { ignores: [".next/", "next-env.d.ts"] },
);
