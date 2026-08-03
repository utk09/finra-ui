import { forwardRef, type InputHTMLAttributes } from "react";

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";

/**
 * Props for the unstyled slider.
 *
 * @remarks
 * A native `type="range"` input, which is what gives keyboard support, the
 * `slider` role and `aria-valuenow` for free. Use `min`, `max` and `step` as
 * normal.
 */
export interface SliderBaseProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {}

/**
 * Unstyled slider - a native `type="range"` input.
 *
 * @see {@link SliderBaseProps}
 */
export const SliderBase = forwardRef<HTMLInputElement, SliderBaseProps>((props, ref) => {
  // Stamps its own id, so an unstyled slider is reachable by the same selector
  // as a styled one. `props` follows, so a caller can still replace it.
  return (
    <input ref={ref} {...{ [FINRA_UI_ATTR]: componentIds.sliderInput }} type="range" {...props} />
  );
});

SliderBase.displayName = "SliderBase";
