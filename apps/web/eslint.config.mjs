import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    plugins: { "react-hooks": reactHooks, "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      // The two classic hook rules only. The plugin's full v7 recommended set
      // adds React-Compiler-era rules (set-state-in-effect, refs-in-render)
      // that flag this app's deliberate client-only-init patterns — adopt
      // those separately if the components are ever reworked for them.
      "react-hooks/rules-of-hooks": "error",
      // exhaustive-deps warns rather than errors: a deliberate dep omission is
      // allowed, but it should be visible in lint output, not invisible.
      "react-hooks/exhaustive-deps": "warn",
      // Logging goes through @learn-spanish/config's logger, never console.
      "no-console": "error",
    },
  },
  { ignores: [".next/", "next-env.d.ts"] },
);
