export const FINRA_UI_ATTR = "data-finra-ui" as const;

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

export type ComponentId = (typeof componentIds)[keyof typeof componentIds];
