import { forwardRef, type TextareaHTMLAttributes } from "react";

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";
import { useFormField } from "../../hooks/useFormField";
import { Slot } from "../Slot";

/**
 * Props for the unstyled textarea.
 *
 * @remarks
 * Reads an enclosing `FormField` from context at any depth. No auto-resize and
 * no character counter - those live on the styled `Textarea`.
 */
export interface TextareaBaseProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
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
 * Unstyled textarea. Reads an enclosing FormField from context.
 *
 * @see {@link TextareaBaseProps}
 */
export const TextareaBase = forwardRef<HTMLTextAreaElement, TextareaBaseProps>(
  ({ asChild = false, ...props }, ref) => {
    // Wire into an enclosing FormField (works at any depth; no-op standalone).
    const fieldProps = useFormField(props);
    const Comp = asChild ? Slot : "textarea";

    // Stamps the field id, so an unstyled textarea is reachable by the same
    // selector as the field inside a styled Textarea. `fieldProps` follows, so
    // a caller can still replace it.
    return <Comp ref={ref} {...{ [FINRA_UI_ATTR]: componentIds.textareaField }} {...fieldProps} />;
  },
);

TextareaBase.displayName = "TextareaBase";
