import { createContext } from "react";

import type { FormFieldState } from "../logic/formField";

/**
 * Published by `FormField` to the controls rendered inside it. `null` when a
 * control is used outside any FormField - controls must handle that (they then
 * carry only their own props). This is the canonical module for the context;
 * import it directly rather than re-exporting through an entry point.
 */
export const FormFieldContext = createContext<FormFieldState | null>(null);

FormFieldContext.displayName = "FormFieldContext";
