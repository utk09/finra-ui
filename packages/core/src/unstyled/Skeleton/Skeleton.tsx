import { forwardRef, type HTMLAttributes } from "react";

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";

/** CSS class overrides injected by the styled layer. */
export interface SkeletonClassNames {
  /** Each placeholder line. Only `variant="text"` renders these. */
  line?: string;
}

/**
 * Props for the unstyled loading placeholder.
 *
 * @remarks
 * A placeholder is decoration: it carries `aria-hidden`, because the content it
 * stands in for announces itself once it arrives, and a screen reader has
 * nothing to say about a grey box in the meantime.
 *
 * The unstyled layer ships no CSS, so it contributes the structure and the
 * state attributes a stylesheet hooks; nothing here has a size or a colour.
 */
export interface SkeletonBaseProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * `text` renders `lines` placeholder lines, sized from the surrounding text so
   * a paragraph does not reflow when the real content replaces it. `circular`
   * and `rectangular` size the root itself from CSS.
   *
   * @defaultValue `"text"`
   */
  variant?: "text" | "circular" | "rectangular";
  /**
   * Number of stacked lines. Only meaningful for `variant="text"`.
   *
   * @defaultValue `1`
   */
  lines?: number;
  /**
   * @defaultValue `"pulse"`
   */
  animation?: "pulse" | "wave" | "none";
  /** CSS class overrides injected by the styled layer. */
  classNames?: SkeletonClassNames;
}

/**
 * Unstyled loading placeholder. Renders structure and state, never dimensions.
 *
 * @see {@link SkeletonBaseProps}
 */
export const SkeletonBase = forwardRef<HTMLDivElement, SkeletonBaseProps>(
  ({ variant = "text", lines = 1, animation = "pulse", classNames: cn, ...props }, ref) => {
    // A line count below one renders no lines rather than throwing. `lines` is a
    // number from a caller's data as often as it is a literal.
    const lineCount = variant === "text" ? Math.max(0, Math.floor(lines)) : 0;

    return (
      <div
        ref={ref}
        {...{ [FINRA_UI_ATTR]: componentIds.skeleton }}
        aria-hidden="true"
        data-variant={variant}
        data-animation={animation}
        {...props}>
        {/*
          Lines are identical, stateless and positional: their index is their
          whole identity. The usual objection to an index key is that reordering
          or deleting remounts the wrong element and loses its state, and there
          is no state here to lose and no order to change.
        */}
        {Array.from({ length: lineCount }, (_, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: identical stateless lines, see above
            key={index}
            {...{ [FINRA_UI_ATTR]: componentIds.skeletonLine }}
            className={cn?.line}
          />
        ))}
      </div>
    );
  },
);

SkeletonBase.displayName = "SkeletonBase";
