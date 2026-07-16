import { useContext } from "react";

import { FormFieldContext } from "../context/FormFieldContext";
import {
  type FormFieldControlA11y,
  type FormFieldOwnA11y,
  mergeControlA11y,
} from "../logic/formField";

/**
 * Wire a control into an enclosing `FormField`. Pass the control's own props;
 * the returned object is those props with the field's accessibility attributes
 * (`id`, `aria-describedby`, `aria-invalid`, `aria-required`, `disabled`)
 * merged in - the control's own values are respected (own id wins,
 * `aria-describedby` is appended not replaced). Spread the result onto the DOM
 * node.
 *
 * Outside a FormField the props pass through untouched, so a control built on
 * this hook also works standalone. Public API - third parties can build their
 * own field-aware controls with it. Mirrors Chakra's `useFormControl`.
 *
 * @example
 *   const inputProps = useFormField(props);
 *   return <input {...inputProps} />;
 */
export function useFormField<P extends FormFieldOwnA11y>(ownProps?: P): P & FormFieldControlA11y {
  const field = useContext(FormFieldContext);
  const props = (ownProps ?? {}) as P;
  if (!field) return props as P & FormFieldControlA11y;
  return { ...props, ...mergeControlA11y(field, props) };
}
