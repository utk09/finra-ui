import { forwardRef, type InputHTMLAttributes } from "react";

import { useFormField } from "../../hooks/useFormField";
import { Slot } from "../Slot";

/**
 * Props for the unstyled text input.
 *
 * @remarks
 * Reads an enclosing `FormField` from context at any depth, so id, describedby
 * and invalid state are wired without prop-drilling. Ships no CSS, no
 * adornments and no clear button - those live on the styled `Input`.
 */
export interface InputBaseProps extends InputHTMLAttributes<HTMLInputElement> {
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
 * Unstyled text input. Reads an enclosing FormField from context.
 *
 * @see {@link InputBaseProps}
 */
export const InputBase = forwardRef<HTMLInputElement, InputBaseProps>(
  ({ asChild = false, ...props }, ref) => {
    // Wire into an enclosing FormField (works at any depth; no-op standalone).
    const fieldProps = useFormField(props);
    const Comp = asChild ? Slot : "input";

    return <Comp ref={ref} {...fieldProps} />;
  },
);

InputBase.displayName = "InputBase";
