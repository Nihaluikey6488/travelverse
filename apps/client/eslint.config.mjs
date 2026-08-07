import nextPlugin from "@next/eslint-plugin-next";
import browser from "@travelverse/eslint-config/browser";

export default [
  ...browser,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
];
