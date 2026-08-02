import type { Plugin } from "postcss";

/**
 * Name of the cascade layer the library's CSS is wrapped in.
 *
 * @remarks
 * Public contract: consumers who use layers themselves can order it explicitly,
 * e.g. `@layer finra-ui, app;`.
 */
export declare const CSS_LAYER: "finra-ui";

/**
 * PostCSS plugin wrapping every emitted style rule in `@layer finra-ui`, so a
 * consumer's unlayered CSS always wins regardless of specificity or source
 * order.
 *
 * `@charset`, `@import` and `@font-face` are left at the top level.
 */
export declare function postcssFinraLayer(): Plugin;
