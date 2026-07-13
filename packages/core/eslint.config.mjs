import tseslint from "typescript-eslint";

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    rules: {
      // Core is framework-agnostic and silent: logging is the app's concern.
      "no-console": "error",
    },
  },
  { ignores: ["coverage/"] },
);
