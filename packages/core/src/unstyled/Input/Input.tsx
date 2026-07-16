import { forwardRef, type InputHTMLAttributes } from "react";

import { useFormField } from "../../hooks/useFormField";
import { Slot } from "../Slot";

export interface InputBaseProps extends InputHTMLAttributes<HTMLInputElement> {
  asChild?: boolean;
}

export const InputBase = forwardRef<HTMLInputElement, InputBaseProps>(
  ({ asChild = false, ...props }, ref) => {
    // Wire into an enclosing FormField (works at any depth; no-op standalone).
    const fieldProps = useFormField(props);
    const Comp = asChild ? Slot : "input";

    return <Comp ref={ref} {...fieldProps} />;
  },
);

InputBase.displayName = "InputBase";
