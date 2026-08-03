import { forwardRef, type InputHTMLAttributes } from "react";

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";
import { useFormField } from "../../hooks/useFormField";

/**
 * Props for the unstyled radio button.
 *
 * @remarks
 * Adds nothing to the native attributes beyond fixing `type` and reading an
 * enclosing `FormField` from context. Grouping is the browser's job: give every
 * radio in a set the same `name` and it handles exclusivity and arrow-key
 * movement.
 */
export interface RadioButtonBaseProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {}

/**
 * Unstyled radio. Grouping is the browser's job - share a `name`.
 *
 * @see {@link RadioButtonBaseProps}
 */
export const RadioButtonBase = forwardRef<HTMLInputElement, RadioButtonBaseProps>((props, ref) => {
  // Wire into an enclosing FormField (works at any depth; no-op standalone).
  const fieldProps = useFormField(props);
  // Stamps its own id, so an unstyled radio is reachable by the same selector
  // as a styled one. `fieldProps` follows, so a caller can still replace it.
  return (
    <input
      ref={ref}
      {...{ [FINRA_UI_ATTR]: componentIds.radioButtonInput }}
      type="radio"
      {...fieldProps}
    />
  );
});

RadioButtonBase.displayName = "RadioButtonBase";
