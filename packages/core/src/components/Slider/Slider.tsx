import { clsx } from "clsx";
import { type ChangeEvent, forwardRef, useState } from "react";

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";
import { sliderMidpoint } from "../../logic/slider";
import { SliderBase, type SliderBaseProps } from "../../unstyled/Slider/Slider";
import styles from "./Slider.module.scss";

/**
 * Props for the styled Slider.
 *
 * @remarks
 * A slider is for approximate values where the trend matters more than the
 * digits. When the exact number matters - a price, a quantity - use
 * NumberInput, or pair the two so the value can also be typed.
 *
 * Supply either `label` or an `aria-label`.
 */
export interface SliderProps extends Omit<SliderBaseProps, "className"> {
  /** Visible label above the track, and the control's accessible name. */
  label?: string;
  /**
   * Show the current value beside the label.
   *
   * @remarks
   * Visual only - the value is always announced through `aria-valuenow`
   * regardless, so hiding it costs screen-reader users nothing.
   */
  showValue?: boolean;
  /** Additional CSS class for the root wrapper. */
  className?: string;
}

/**
 * A range input for approximate values.
 *
 * @see {@link SliderProps}
 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    { className, label, showValue, disabled, value, defaultValue, onChange, min, max, ...props },
    ref,
  ) => {
    const isControlled = value !== undefined;
    // The readout has to mirror the input's own value. Derived from props alone
    // it stays on the initial number for an uncontrolled slider, so `showValue`
    // reports one figure while the thumb sits at another.
    const [uncontrolledValue, setUncontrolledValue] = useState(() =>
      defaultValue === undefined ? sliderMidpoint(min, max) : String(defaultValue),
    );
    const displayValue = isControlled ? value : uncontrolledValue;

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      onChange?.(event);
      // Not gated on `defaultPrevented`: this tracks what the input already
      // shows, it does not commit anything a consumer could decline.
      if (!isControlled) setUncontrolledValue(event.target.value);
    };

    return (
      <label
        {...{ [FINRA_UI_ATTR]: componentIds.slider }}
        className={clsx(styles.slider, disabled && styles.disabled, className)}>
        {label || showValue ? (
          <span className={styles.header} {...{ [FINRA_UI_ATTR]: componentIds.sliderHeader }}>
            {label ? (
              <span className={styles.label} {...{ [FINRA_UI_ATTR]: componentIds.sliderLabel }}>
                {label}
              </span>
            ) : null}
            {showValue ? (
              <span className={styles.value} {...{ [FINRA_UI_ATTR]: componentIds.sliderValue }}>
                {displayValue}
              </span>
            ) : null}
          </span>
        ) : null}
        <SliderBase
          ref={ref}
          className={styles.input}
          disabled={disabled}
          value={value}
          defaultValue={defaultValue}
          min={min}
          max={max}
          onChange={handleChange}
          {...props}
        />
      </label>
    );
  },
);

Slider.displayName = "Slider";
