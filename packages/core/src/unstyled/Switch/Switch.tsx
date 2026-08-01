import { forwardRef, type InputHTMLAttributes } from "react";

import { useFormField } from "../../hooks/useFormField";

/**
 * Props for the unstyled switch.
 *
 * @remarks
 * A checkbox carrying `role="switch"`, so it is announced as on/off rather than
 * checked/unchecked. Both `type` and `role` are fixed - overriding either would
 * break that announcement, which is why they are omitted from the props.
 */
export interface SwitchBaseProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role"> {}

/**
 * Unstyled switch - a checkbox carrying `role="switch"`.
 *
 * @see {@link SwitchBaseProps}
 */
export const SwitchBase = forwardRef<HTMLInputElement, SwitchBaseProps>((props, ref) => {
  // Wire into an enclosing FormField (works at any depth; no-op standalone).
  const fieldProps = useFormField(props);
  // The native checked state maps to aria-checked, so the attribute is not
  // needed. This is the APG switch pattern verbatim.
  // biome-ignore lint/a11y/useAriaPropsForRole: native checked state supplies aria-checked, see above
  return <input ref={ref} type="checkbox" role="switch" {...fieldProps} />;
});

SwitchBase.displayName = "SwitchBase";
