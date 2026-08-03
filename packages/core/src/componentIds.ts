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
  buttonStartIcon: "button-start-icon",
  buttonEndIcon: "button-end-icon",
  iconButton: "icon-button",
  buttonGroup: "button-group",

  // Input
  input: "input",
  inputField: "input-field",
  inputStartAdornment: "input-start-adornment",
  inputEndAdornment: "input-end-adornment",
  inputClearButton: "input-clear-button",

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
  formFieldRequiredMarker: "form-field-required-marker",
  formFieldHelper: "form-field-helper",
  formFieldError: "form-field-error",

  // Checkbox
  checkbox: "checkbox",
  checkboxInput: "checkbox-input",
  checkboxIndicator: "checkbox-indicator",
  checkboxLabel: "checkbox-label",

  // Switch
  switch: "switch",
  /**
   * The real checkbox, visually hidden behind the track. It carries the
   * checked, disabled and focus state, so it is the hook for a focus ring the
   * track cannot express.
   */
  switchInput: "switch-input",
  switchTrack: "switch-track",
  switchThumb: "switch-thumb",
  switchLabel: "switch-label",

  // RadioButton
  radioButton: "radio-button",
  radioButtonInput: "radio-button-input",
  radioButtonIndicator: "radio-button-indicator",
  radioButtonDot: "radio-button-dot",
  radioButtonLabel: "radio-button-label",

  // Slider
  slider: "slider",
  sliderHeader: "slider-header",
  sliderLabel: "slider-label",
  sliderValue: "slider-value",
  sliderInput: "slider-input",

  // PillInput
  pillInput: "pill-input",
  pillInputPill: "pill-input-pill",
  pillInputPillText: "pill-input-pill-text",
  pillInputPillRemove: "pill-input-pill-remove",
  pillInputField: "pill-input-field",

  // FileDropZone
  fileDropZone: "file-drop-zone",
  fileDropZoneInput: "file-drop-zone-input",
  fileDropZoneContent: "file-drop-zone-content",
  fileDropZoneIcon: "file-drop-zone-icon",
  fileDropZoneText: "file-drop-zone-text",

  // Badge
  badge: "badge",

  // ComboBox
  comboBox: "combo-box",
  comboBoxControl: "combo-box-control",
  comboBoxInput: "combo-box-input",
  comboBoxSingleValue: "combo-box-single-value",
  comboBoxMultiValue: "combo-box-multi-value",
  comboBoxPillList: "combo-box-pill-list",
  comboBoxPill: "combo-box-pill",
  comboBoxPillText: "combo-box-pill-text",
  comboBoxPillRemove: "combo-box-pill-remove",
  comboBoxIndicator: "combo-box-indicator",
  comboBoxListbox: "combo-box-listbox",
  comboBoxHeader: "combo-box-header",
  comboBoxOptions: "combo-box-options",
  comboBoxOption: "combo-box-option",
  comboBoxOptionLabel: "combo-box-option-label",
  comboBoxOptionCheck: "combo-box-option-check",
  comboBoxGroup: "combo-box-group",
  comboBoxGroupLabel: "combo-box-group-label",
  comboBoxEmpty: "combo-box-empty",
  comboBoxLoading: "combo-box-loading",
  comboBoxSpinner: "combo-box-spinner",
  comboBoxFooter: "combo-box-footer",
  /**
   * Visually hidden result-count announcement.
   *
   * @remarks
   * Carries no class, being positioned by an inline style, so it is reachable only through this id.
   */
  comboBoxStatus: "combo-box-status",

  // Dialog
  dialog: "dialog",
  dialogTrigger: "dialog-trigger",
  dialogOverlay: "dialog-overlay",
  dialogTitle: "dialog-title",
  dialogDescription: "dialog-description",
  dialogClose: "dialog-close",

  // Tooltip
  tooltip: "tooltip",
  tooltipTrigger: "tooltip-trigger",

  // Popover
  popover: "popover",
  popoverTrigger: "popover-trigger",
  popoverClose: "popover-close",

  // Select
  select: "select",
  selectTrigger: "select-trigger",
  selectValue: "select-value",
  selectIndicator: "select-indicator",
  selectOption: "select-option",

  // Menu
  menu: "menu",
  menuTrigger: "menu-trigger",
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
