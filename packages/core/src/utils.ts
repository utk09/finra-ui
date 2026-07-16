// Utilities
export { mergeRefs } from "./utils/mergeRefs";

// Logic utilities
export { cx } from "./logic/cx";

// Framework-agnostic state store (shared foundation for state machines)
export { createStore, type Store } from "./logic/store";

// Framework-agnostic form-field association logic (used by useFormField + future Lit controller)
export {
  computeDescribedBy,
  computeFieldIds,
  type FormFieldControlA11y,
  type FormFieldOwnA11y,
  type FormFieldState,
  mergeControlA11y,
} from "./logic/formField";
