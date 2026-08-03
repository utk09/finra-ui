/**
 * The React renderer's own `extractArgTypes`.
 *
 * `preview.tsx` wraps this rather than reimplementing it, so every prop table
 * keeps the renderer's type formatting and required flags and only gains the
 * `@defaultValue` / `@remarks` backfill on top.
 *
 * `@storybook/react/entry-preview-argtypes` is a public subpath in the package's
 * `exports` map but ships no declarations, and an ambient `declare module` does
 * not apply: the specifier resolves to a real untyped `.js`, and a successful
 * resolution takes precedence. The suppression is therefore load-bearing, and is
 * confined to this file so the untyped surface is one import wide.
 */
// @ts-expect-error - public subpath, no bundled declarations. See above.
import { parameters } from "@storybook/react/entry-preview-argtypes";
import type { StrictArgTypes } from "storybook/internal/types";

interface ReactArgTypeParameters {
  docs: { extractArgTypes: (component: unknown) => StrictArgTypes | null };
}

export const { extractArgTypes: extractReactArgTypes } = (parameters as ReactArgTypeParameters)
  .docs;
