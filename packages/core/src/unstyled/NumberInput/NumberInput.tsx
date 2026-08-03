import { forwardRef, type InputHTMLAttributes } from "react";

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";
import { useFormField } from "../../hooks/useFormField";
import { Slot } from "../Slot";

/**
 * Props for the unstyled numeric input.
 *
 * @remarks
 * A thin element wrapper only - it has no stepper buttons, no clamping and no
 * formatting. All of that lives on the styled `NumberInput`. `type` is fixed,
 * so the field cannot be switched away from numeric entry.
 */
export interface NumberInputBaseProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /**
   * Render onto the single child element instead of the default tag, merging
   * these props onto it.
   *
   * @remarks
   * `className` is concatenated, `style` merged, and handlers chained with the
   * child's called first. You become responsible for the child being genuinely
   * interactive and focusable.
   *
   * @defaultValue `false`
   */
  asChild?: boolean;
}

/**
 * Unstyled numeric input. No steppers, clamping or formatting - the styled
 * `NumberInput` adds those.
 *
 * @see {@link NumberInputBaseProps}
 */
export const NumberInputBase = forwardRef<HTMLInputElement, NumberInputBaseProps>(
  ({ asChild = false, ...props }, ref) => {
    // Wire into an enclosing FormField (works at any depth; no-op standalone).
    const fieldProps = useFormField(props);
    const Comp = asChild ? Slot : "input";

    // Stamps the field id, so an unstyled numeric input is reachable by the
    // same selector as the field inside a styled NumberInput. `fieldProps`
    // follows, so a caller can still replace it.
    return (
      <Comp
        ref={ref}
        {...{ [FINRA_UI_ATTR]: componentIds.numberInputField }}
        inputMode="decimal"
        {...fieldProps}
      />
    );
  },
);

NumberInputBase.displayName = "NumberInputBase";
