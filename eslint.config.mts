import js from "@eslint/js";
import globals from "globals";
import typescript from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier";
import { defineConfig } from "eslint/config";

// Extract the recommended configurations
const reactRules = reactPlugin.configs.recommended.rules;
const reactHooksRules = reactHooksPlugin.configs.recommended.rules;
const a11yRules = jsxA11yPlugin.configs.recommended.rules;

export default defineConfig([
  // Global ignores
  { ignores: ["**/dist/**", "**/coverage/**", "**/.next/**"] },

  // Base JS + TS files
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },

  // ESLint core recommended
  js.configs.recommended,

  // TypeScript configuration
  ...typescript.configs.recommended,

  // React, React Hooks, and JSX-a11y for React files
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "jsx-a11y": jsxA11yPlugin,
    },
    rules: {
      ...reactRules,
      ...reactHooksRules,
      ...a11yRules,

      // React specifics
      "react/react-in-jsx-scope": "off", // Not needed for React 17+
      "react/prop-types": "off", // Using TypeScript for props typing

      // Prefer function components
      "react/function-component-definition": [
        "warn",
        { namedComponents: "arrow-function", unnamedComponents: "arrow-function" },
      ],

      // Hooks already handled by plugin; ensure exhaustive deps stays on
      "react-hooks/exhaustive-deps": "warn",
    },
    settings: {
      react: { version: "detect" },
    },
  },

  // Project-level rule adjustments
  {
    rules: {
      // General JS/TS hygiene
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-undef": "error",
    },
  },

  // Disable rules conflicting with Prettier formatting
  prettier,
]);
