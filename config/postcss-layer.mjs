/**
 * Wrap every style rule the library emits in a CSS cascade layer.
 *
 * Why this exists: without a layer, a consumer's override is a coin toss.
 * `[data-finra-ui="badge"]` and the emitted `._badge_x1y2` are both specificity
 * (0,1,0), so the winner is whichever stylesheet the bundler happened to put
 * last. Overrides then need doubled selectors or `!important` to be reliable,
 * which is not a contract worth publishing.
 *
 * Unlayered CSS always beats layered CSS, whatever its specificity. Putting the
 * whole library in one layer therefore means any ordinary consumer rule wins,
 * with no tricks, and consumers who use layers themselves can still order
 * `finra-ui` explicitly against their own.
 *
 * Applied as a build step rather than by wrapping each `.scss` by hand. That is
 * deliberate: the failure mode of hand-wrapping is that a new stylesheet forgets
 * the wrapper, and an unlayered rule then silently outranks every layered one -
 * the exact opposite of the intended behaviour, and hard to spot. A build step
 * cannot be forgotten.
 *
 * It must be applied everywhere the source SCSS is consumed, not only in the
 * published build, or Storybook would demonstrate override behaviour the
 * package does not have.
 */

/** Name of the layer everything is wrapped in. Part of the public contract. */
export const CSS_LAYER = "finra-ui";

/**
 * At-rules that must stay at the top level.
 *
 * `@charset` and `@import` are invalid inside a layer. `@font-face` is legal
 * there but gains nothing, and leaving it out keeps font loading independent of
 * cascade questions.
 */
const UNLAYERED_AT_RULES = new Set(["charset", "import", "font-face", "layer"]);

/**
 * PostCSS plugin wrapping a stylesheet's rules in `@layer finra-ui`.
 *
 * @returns {import("postcss").Plugin}
 */
export function postcssFinraLayer() {
  return {
    postcssPlugin: "finra-ui-css-layer",
    /**
     * @param {import("postcss").Root} root
     * @param {{ AtRule: typeof import("postcss").AtRule }} helpers
     */
    Once(root, { AtRule }) {
      const movable = root.nodes.filter(
        (node) => !(node.type === "atrule" && UNLAYERED_AT_RULES.has(node.name.toLowerCase())),
      );

      // Nothing but comments and at-rules that stay put: leave the file alone
      // rather than emitting an empty layer block.
      if (!movable.some((node) => node.type === "rule" || node.type === "atrule")) return;

      const layer = new AtRule({ name: "layer", params: CSS_LAYER });
      root.append(layer);
      for (const node of movable) layer.append(node.remove());
    },
  };
}

postcssFinraLayer.postcss = true;
