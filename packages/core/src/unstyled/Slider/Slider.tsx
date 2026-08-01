import { forwardRef, type InputHTMLAttributes } from "react";

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
  return <input ref={ref} type="range" {...props} />;
});

SliderBase.displayName = "SliderBase";
