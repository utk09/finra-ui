import { create } from "storybook/theming/create";

/**
 * Storybook chrome themes.
 *
 * Every colour here is lifted from the same palette the components use
 * (`packages/core/src/tokens/_color.scss`), so the sidebar, toolbar and docs
 * pages sit in the library's own design language rather than Storybook's
 * defaults. When a token changes there, change it here too - these are plain
 * strings because the manager iframe never loads the component stylesheet.
 */

const shared = {
  brandTitle: "finra-ui",
  brandUrl: "https://github.com/utk09/finra-ui",
  brandTarget: "_self",
  fontBase:
    'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
  fontCode:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
} as const;

export const lightTheme = create({
  ...shared,
  base: "light",

  colorPrimary: "#1d4ed8", // --finra-color-primary-700
  colorSecondary: "#2563eb", // --finra-color-primary-600

  appBg: "#f9fafb", // --finra-color-neutral-50
  appContentBg: "#ffffff", // --finra-color-background
  appPreviewBg: "#ffffff",
  appBorderColor: "#e5e7eb", // --finra-color-border
  appBorderRadius: 6,

  textColor: "#111827", // --finra-color-foreground
  textInverseColor: "#f9fafb",
  textMutedColor: "#6b7280", // --finra-color-neutral-500

  barTextColor: "#4b5563", // --finra-color-neutral-600
  barSelectedColor: "#1d4ed8",
  barHoverColor: "#2563eb",
  barBg: "#ffffff",

  inputBg: "#ffffff",
  inputBorder: "#d1d5db", // --finra-color-neutral-300
  inputTextColor: "#111827",
  inputBorderRadius: 6,

  booleanBg: "#f3f4f6",
  booleanSelectedBg: "#ffffff",

  buttonBg: "#f9fafb",
  buttonBorder: "#e5e7eb",
});

export const darkTheme = create({
  ...shared,
  base: "dark",

  colorPrimary: "#60a5fa", // --finra-color-primary-400, legible on dark
  colorSecondary: "#93c5fd", // --finra-color-primary-300

  appBg: "#0b1220", // one step below the dark background, so the sidebar recedes
  appContentBg: "#111827", // --finra-color-background (dark)
  appPreviewBg: "#111827",
  appBorderColor: "#374151", // --finra-color-border (dark)
  appBorderRadius: 6,

  textColor: "#f9fafb", // --finra-color-foreground (dark)
  textInverseColor: "#111827",
  textMutedColor: "#9ca3af", // --finra-color-neutral-400

  barTextColor: "#d1d5db",
  barSelectedColor: "#60a5fa",
  barHoverColor: "#93c5fd",
  barBg: "#111827",

  inputBg: "#1f2937", // --finra-color-neutral-800
  inputBorder: "#374151",
  inputTextColor: "#f9fafb",
  inputBorderRadius: 6,

  booleanBg: "#1f2937",
  booleanSelectedBg: "#374151",

  buttonBg: "#1f2937",
  buttonBorder: "#374151",
});
