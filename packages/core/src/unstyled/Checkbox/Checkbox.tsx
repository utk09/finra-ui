import { forwardRef, type InputHTMLAttributes, useCallback } from "react";

import { useFormField } from "../../hooks/useFormField";
import { mergeRefs } from "../../utils/mergeRefs";

/**
 * Props for the unstyled checkbox.
 *
 * @remarks
 * Reads an enclosing `FormField` from context at any depth, so id, describedby
 * and invalid state are wired without prop-drilling. Standalone it is a plain
 * checkbox.
 */
export interface CheckboxBaseProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /**
   * Show the mixed state - a parent controlling a partly selected set.
   *
   * @remarks
   * A DOM property, not an attribute, so it is applied via a ref rather than
   * rendered. Purely visual and ARIA: it does not change `checked`, and
   * clicking the box resolves it to a definite state.
   */
  indeterminate?: boolean;
}

/**
 * Unstyled checkbox. Reads an enclosing FormField from context.
 *
 * @see {@link CheckboxBaseProps}
 */
export const CheckboxBase = forwardRef<HTMLInputElement, CheckboxBaseProps>(
  ({ indeterminate, ...props }, forwardedRef) => {
    // Wire into an enclosing FormField (works at any depth; no-op standalone).
    const fieldProps = useFormField(props);

    const setIndeterminate = useCallback(
      (node: HTMLInputElement | null) => {
        if (node) {
          node.indeterminate = indeterminate ?? false;
        }
      },
      [indeterminate],
    );

    return (
      <input ref={mergeRefs(forwardedRef, setIndeterminate)} type="checkbox" {...fieldProps} />
    );
  },
);

CheckboxBase.displayName = "CheckboxBase";
