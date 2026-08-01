import { clsx } from "clsx";
import { forwardRef } from "react";

import { SliderBase, type SliderBaseProps } from "../../unstyled/Slider/Slider";
import { componentIds, FINRA_UI_ATTR } from "../componentIds";
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
  ({ className, label, showValue, disabled, value, defaultValue, ...props }, ref) => {
    const displayValue = value ?? defaultValue ?? "";

    return (
      <label
        {...{ [FINRA_UI_ATTR]: componentIds.slider }}
        className={clsx(styles.slider, disabled && styles.disabled, className)}>
        {label || showValue ? (
          <span className={styles.header} {...{ [FINRA_UI_ATTR]: componentIds.sliderHeader }}>
            {label ? <span className={styles.label}>{label}</span> : null}
            {showValue ? <span className={styles.value}>{displayValue}</span> : null}
          </span>
        ) : null}
        <SliderBase
          ref={ref}
          className={styles.input}
          disabled={disabled}
          value={value}
          defaultValue={defaultValue}
          {...props}
        />
      </label>
    );
  },
);

Slider.displayName = "Slider";
