import { forwardRef, type InputHTMLAttributes } from "react";

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

export const RadioButtonBase = forwardRef<HTMLInputElement, RadioButtonBaseProps>((props, ref) => {
  // Wire into an enclosing FormField (works at any depth; no-op standalone).
  const fieldProps = useFormField(props);
  return <input ref={ref} type="radio" {...fieldProps} />;
});

RadioButtonBase.displayName = "RadioButtonBase";
