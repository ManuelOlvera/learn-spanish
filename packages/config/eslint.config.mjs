import tseslint from "typescript-eslint";

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    rules: {
      "no-console": "error",
    },
  },
  {
    // The leveled logger is the one permitted console caller in the repo.
    files: ["src/logger.ts"],
    rules: { "no-console": "off" },
  },
);
