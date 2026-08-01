/**
 * The data attribute every finra-ui component stamps onto its root element.
 *
 * @remarks
 * A stable styling and test hook that survives CSS-module hashing and minified
 * class names - `[data-finra-ui="button"]` works in a consumer's stylesheet,
 * and `getByTestId` finds it in tests without needing a `data-testid`.
 */
export const FINRA_UI_ATTR = "data-finra-ui" as const;

/**
 * The registry of {@link FINRA_UI_ATTR} values, one per component or named part.
 *
 * @remarks
 * Central so that ids stay unique and greppable. Sub-parts get their own entry
 * (`inputField`, `textareaCount`) so a consumer can target the inner element
 * without relying on the DOM shape, which is not part of the public contract.
 *
 * @example
 * ```css
 * [data-finra-ui="input-field"] { font-variant-numeric: tabular-nums; }
 * ```
 */
export const componentIds = {
  // Button family
  button: "button",
  iconButton: "icon-button",
  buttonGroup: "button-group",

  // Input
  input: "input",
  inputField: "input-field",

  // Textarea
  textarea: "textarea",
  textareaField: "textarea-field",
  textareaCount: "textarea-count",

  // NumberInput
  numberInput: "number-input",
  numberInputField: "number-input-field",
  numberInputIncrement: "number-input-increment",
  numberInputDecrement: "number-input-decrement",

  // FormField
  formField: "form-field",
  formFieldLabel: "form-field-label",
  formFieldHelper: "form-field-helper",
  formFieldError: "form-field-error",

  // Checkbox
  checkbox: "checkbox",
  checkboxIndicator: "checkbox-indicator",
  checkboxLabel: "checkbox-label",

  // Switch
  switch: "switch",
  switchTrack: "switch-track",
  switchThumb: "switch-thumb",
  switchLabel: "switch-label",

  // RadioButton
  radioButton: "radio-button",
  radioButtonIndicator: "radio-button-indicator",
  radioButtonLabel: "radio-button-label",

  // Slider
  slider: "slider",
  sliderHeader: "slider-header",

  // PillInput
  pillInput: "pill-input",

  // FileDropZone
  fileDropZone: "file-drop-zone",
  fileDropZoneInput: "file-drop-zone-input",

  // Badge
  badge: "badge",

  // ComboBox
  comboBox: "combo-box",
  comboBoxControl: "combo-box-control",

  // Dialog
  dialog: "dialog",
  dialogOverlay: "dialog-overlay",
  dialogTitle: "dialog-title",
  dialogDescription: "dialog-description",
  dialogClose: "dialog-close",

  // Tooltip
  tooltip: "tooltip",

  // Popover
  popover: "popover",

  // Select
  select: "select",
  selectTrigger: "select-trigger",
  selectOption: "select-option",

  // Menu
  menu: "menu",
  menuItem: "menu-item",
  menuSeparator: "menu-separator",

  // Toast
  toastRegion: "toast-region",
  toast: "toast",
  toastTitle: "toast-title",
  toastDescription: "toast-description",
  toastAction: "toast-action",
  toastClose: "toast-close",

  // Tabs
  tabs: "tabs",
  tabList: "tab-list",
  tab: "tab",
  tabPanel: "tab-panel",

  // Divider
  divider: "divider",
} as const;

/**
 * Every value {@link componentIds} can produce.
 *
 * @remarks
 * Derived from the registry rather than declared separately, so adding an entry
 * there widens this automatically and the two can never drift apart.
 */
export type ComponentId = (typeof componentIds)[keyof typeof componentIds];
