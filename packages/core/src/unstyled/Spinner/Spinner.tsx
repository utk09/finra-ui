import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";

/**
 * Props for the unstyled activity indicator.
 *
 * @remarks
 * The unstyled layer ships no icon and no animation, so it renders `label` as
 * text. The styled layer injects the spinning glyph through `renderIndicator`.
 *
 * Whether the spinner announces itself is decided by `label`: with one it is a
 * live region, without one it is hidden from assistive tech entirely.
 */
export interface SpinnerBaseProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Accessible name, and the announcement.
   *
   * Omit it inside something that already announces the loading state, such as
   * ComboBox's results live region, or the same news is read twice.
   */
  label?: string;
  /** Render the indicator. The unstyled layer ships none. */
  renderIndicator?: () => ReactNode;
}

/**
 * Unstyled activity indicator. Announces through `label`, or hides itself.
 *
 * @see {@link SpinnerBaseProps}
 */
export const SpinnerBase = forwardRef<HTMLSpanElement, SpinnerBaseProps>(
  ({ label, renderIndicator, children, ...props }, ref) => {
    const indicator = renderIndicator ? renderIndicator() : children;
    const hasIndicator = indicator !== undefined && indicator !== null;

    // With an indicator the label is not in the DOM, so it has to name the
    // region through `aria-label`. Without one the label *is* the content and
    // names the region already, and adding the attribute would read it twice.
    const announced = label
      ? { role: "status", ...(hasIndicator ? { "aria-label": label } : {}) }
      : { "aria-hidden": true };

    return (
      <span ref={ref} {...{ [FINRA_UI_ATTR]: componentIds.spinner }} {...announced} {...props}>
        {hasIndicator ? indicator : label}
      </span>
    );
  },
);

SpinnerBase.displayName = "SpinnerBase";
