import { forwardRef, type TextareaHTMLAttributes } from "react";

import { useFormField } from "../../hooks/useFormField";
import { Slot } from "../Slot";

export interface TextareaBaseProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  asChild?: boolean;
}

export const TextareaBase = forwardRef<HTMLTextAreaElement, TextareaBaseProps>(
  ({ asChild = false, ...props }, ref) => {
    // Wire into an enclosing FormField (works at any depth; no-op standalone).
    const fieldProps = useFormField(props);
    const Comp = asChild ? Slot : "textarea";

    return <Comp ref={ref} {...fieldProps} />;
  },
);

TextareaBase.displayName = "TextareaBase";
