import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import storybook from "eslint-plugin-storybook";
import prettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  // ── Global ignores ──
  globalIgnores([
    "**/build/",
    "**/dist/",
    "**/coverage/",
    "**/storybook-static/",
    "**/node_modules/",
    "**/.turbo/",
    "**/.serena/",
    "**/.husky/",
    "**/.changeset/",
    "pnpm-lock.yaml",
  ]),

  // ── Base: ESLint recommended ──
  {
    name: "finra-ui/js-recommended",
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js },
    extends: ["js/recommended"],
  },

  // ── TypeScript: strict + stylistic ──
  {
    name: "finra-ui/typescript",
    files: ["**/*.{ts,tsx,mts,cts}"],
    extends: [tseslint.configs.strict, tseslint.configs.stylistic],
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-import-type-side-effects": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },

  // ── React: recommended + JSX runtime (React 19) ──
  {
    name: "finra-ui/react",
    files: ["**/*.{jsx,tsx}"],
    extends: [reactPlugin.configs.flat.recommended, reactPlugin.configs.flat["jsx-runtime"]],
    languageOptions: {
      globals: { ...globals.browser },
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      "react/prop-types": "off",
      "react/self-closing-comp": "warn",
      "react/jsx-no-useless-fragment": "warn",
      "react/jsx-curly-brace-presence": ["warn", { props: "never", children: "never" }],
      "react/jsx-boolean-value": ["warn", "never"],
      "react/jsx-no-leaked-render": "warn",
      "react/jsx-pascal-case": "warn",
      "react/hook-use-state": "warn",
      "react/jsx-no-constructed-context-values": "warn",
      "react/no-unstable-nested-components": "warn",
      "react/no-array-index-key": "warn",
      "react/no-danger": "error",
      "react/no-object-type-as-default-prop": "warn",
      "react/button-has-type": "warn",
      "react/iframe-missing-sandbox": "warn",
      "react/jsx-no-script-url": "error",
    },
  },

  // ── React Hooks ──
  {
    name: "finra-ui/react-hooks",
    files: ["**/*.{jsx,tsx}"],
    plugins: { "react-hooks": reactHooksPlugin },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // ── Accessibility ──
  {
    name: "finra-ui/a11y",
    files: ["**/*.{jsx,tsx}"],
    extends: [jsxA11yPlugin.flatConfigs.recommended],
  },

  // ── Library source hardening ──
  {
    name: "finra-ui/library-source",
    files: ["packages/*/src/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    rules: {
      "no-console": "warn",
    },
  },

  // ── Test files ──
  {
    name: "finra-ui/tests",
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}", "**/test/**"],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },

  // ── Storybook ──
  ...(storybook.configs["flat/recommended"] as ReturnType<typeof defineConfig>),

  // ── Storybook stories (relaxed rules) ──
  {
    name: "finra-ui/stories",
    files: ["**/*.stories.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // ── Config files (vite, vitest, eslint, etc.) ──
  {
    name: "finra-ui/config-files",
    files: ["**/*.config.{ts,mts,js,mjs}"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // ── Prettier (must be last to disable conflicting rules) ──
  {
    name: "finra-ui/prettier",
    ...prettier,
  },
]);
