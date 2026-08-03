import { forwardRef, type InputHTMLAttributes } from "react";

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";
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

    // Stamps the field id, so an unstyled input is reachable by the same
    // selector as the field inside a styled Input. `fieldProps` follows, so a
    // caller can still replace it.
    return <Comp ref={ref} {...{ [FINRA_UI_ATTR]: componentIds.inputField }} {...fieldProps} />;
  },
);

InputBase.displayName = "InputBase";
