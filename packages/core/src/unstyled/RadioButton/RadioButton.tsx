import { forwardRef, type InputHTMLAttributes } from "react";

import { useFormField } from "../../hooks/useFormField";

export interface RadioButtonBaseProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {}

export const RadioButtonBase = forwardRef<HTMLInputElement, RadioButtonBaseProps>((props, ref) => {
  // Wire into an enclosing FormField (works at any depth; no-op standalone).
  const fieldProps = useFormField(props);
  return <input ref={ref} type="radio" {...fieldProps} />;
});

RadioButtonBase.displayName = "RadioButtonBase";
