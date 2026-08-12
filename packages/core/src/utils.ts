// Utilities

// Logic utilities
// Framework-agnostic scroll-into-view for aria-activedescendant listboxes
export { scrollActiveDescendantIntoView } from "./logic/activeDescendant";
// Framework-agnostic spreadsheet clipboard parsing (text to a cell matrix)
export {
  type ClipboardMatrix,
  type ClipboardMatrixOptions,
  parseClipboardMatrix,
} from "./logic/clipboardMatrix";
// WCAG contrast maths, for checking a theme override against the surface it lands on
export {
  compositeOver,
  contrastRatio,
  parseHexColor,
  type Rgb,
  relativeLuminance,
} from "./logic/contrast";
export { cx } from "./logic/cx";
// Framework-agnostic overlay dismiss stack (React DismissableLayer + future Lit adapter)
export { type DismissLayerHandle, type DismissReason, registerDismissLayer } from "./logic/dismiss";
// Framework-agnostic form-field association logic (used by useFormField + future Lit controller)
export {
  computeDescribedBy,
  computeFieldIds,
  type FormFieldControlA11y,
  type FormFieldOwnA11y,
  type FormFieldState,
  mergeControlA11y,
} from "./logic/formField";
// Framework-agnostic mapping from sentiment to live-region politeness
export {
  isAssertiveSentiment,
  type LiveRegionAttributes,
  liveRegionAttributes,
} from "./logic/liveRegion";
// Framework-agnostic anchored positioning over @floating-ui/dom (overlays + future Lit adapter)
export {
  type AnchoredPosition,
  type AnchoredPositionOptions,
  computeAnchoredPosition,
  type Placement,
  trackAnchoredPosition,
} from "./logic/position";
// Framework-agnostic state store (shared foundation for state machines)
export { createStore, type Store } from "./logic/store";
export { mergeRefs } from "./utils/mergeRefs";
