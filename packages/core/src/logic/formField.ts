/**
 * Pure form-field association logic - zero framework imports.
 *
 * Single source of truth for "what accessibility props does a control inside a
 * FormField receive". Consumed by the React `useFormField` hook and the
 * FormField native-child injection today, and by a future Lit
 * `finra-form-field` context controller - the rules never diverge per framework.
 */

/** The resolved state a FormField publishes to the controls inside it. */
export interface FormFieldState {
  /** id applied to the control and targeted by the label's `htmlFor`. */
  fieldId: string;
  /** id of the `<label>` (for `aria-labelledby` on non-labelable controls). */
  labelId: string;
  /** id of the helper-text element. */
  helperId: string;
  /** id of the error-message element. */
  errorId: string;
  /** Space-separated ids for `aria-describedby` (error and/or helper present). */
  describedBy?: string;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
}

/** The React `aria-invalid` value union (boolean or token). */
export type AriaInvalid = boolean | "false" | "true" | "grammar" | "spelling";

/** The a11y props a control spreads onto its DOM node. Absent keys are omitted. */
export interface FormFieldControlA11y {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: AriaInvalid;
  "aria-required"?: boolean;
  disabled?: boolean;
}

/**
 * A control's own props that participate in the merge. Widened to accept raw
 * HTML/React attribute types so `useFormField(props)` takes a control's props
 * object directly.
 */
export interface FormFieldOwnA11y {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: AriaInvalid;
  disabled?: boolean;
}

/** True when an `aria-invalid` value actually signals invalidity. */
function isAriaInvalidTruthy(value: AriaInvalid | undefined): boolean {
  return value !== undefined && value !== false && value !== "false";
}

/** Merge id token lists, dropping blanks and duplicates while keeping order. */
function mergeTokens(...parts: (string | undefined)[]): string | undefined {
  const tokens: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    for (const token of part.split(/\s+/)) {
      if (token && !tokens.includes(token)) tokens.push(token);
    }
  }
  return tokens.length > 0 ? tokens.join(" ") : undefined;
}

/** Derive the label/helper/error ids from the resolved field id. */
export function computeFieldIds(fieldId: string): {
  labelId: string;
  helperId: string;
  errorId: string;
} {
  return {
    labelId: `${fieldId}-label`,
    helperId: `${fieldId}-helper`,
    errorId: `${fieldId}-error`,
  };
}

/**
 * Build the field-level `aria-describedby`: the error id (if an error is shown)
 * followed by the helper id (if helper text is present). `undefined` when
 * neither exists.
 */
export function computeDescribedBy(args: {
  showError: boolean;
  hasHelper: boolean;
  errorId: string;
  helperId: string;
}): string | undefined {
  return mergeTokens(
    args.showError ? args.errorId : undefined,
    args.hasHelper ? args.helperId : undefined,
  );
}

/**
 * Resolve the a11y props a control in this field should carry, merging the
 * field state with the control's own props:
 * - `id`: the control's own id wins, else the field id.
 * - `aria-describedby`: field ids (error, helper) then the control's own,
 *   deduped - the field never clobbers a description the control already set.
 * - `aria-invalid` / `aria-required` / `disabled`: OR of field and own.
 *
 * Only truthy keys are returned, so spreading over the control's props never
 * erases an unrelated value.
 */
export function mergeControlA11y(
  field: FormFieldState,
  own?: FormFieldOwnA11y,
): FormFieldControlA11y {
  const result: FormFieldControlA11y = {};

  result.id = own?.id ?? field.fieldId;

  const describedBy = mergeTokens(field.describedBy, own?.["aria-describedby"]);
  if (describedBy) result["aria-describedby"] = describedBy;

  // Field invalidity wins as a plain boolean; otherwise pass the control's own
  // value through so granular tokens ("grammar"/"spelling") survive.
  if (field.invalid) {
    result["aria-invalid"] = true;
  } else if (isAriaInvalidTruthy(own?.["aria-invalid"])) {
    result["aria-invalid"] = own?.["aria-invalid"];
  }

  if (field.required) result["aria-required"] = true;
  if (field.disabled || own?.disabled) result.disabled = true;

  return result;
}
