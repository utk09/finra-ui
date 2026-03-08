import { forwardRef, type TextareaHTMLAttributes } from "react";
import { Slot } from "../Slot";

export interface TextareaBaseProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  asChild?: boolean;
}

export const TextareaBase = forwardRef<HTMLTextAreaElement, TextareaBaseProps>(
  ({ asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "textarea";

    return <Comp ref={ref} {...props} />;
  },
);

TextareaBase.displayName = "TextareaBase";
