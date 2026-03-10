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

  // Switch
  switch: "switch",

  // RadioButton
  radioButton: "radio-button",

  // Slider
  slider: "slider",

  // PillInput
  pillInput: "pill-input",

  // FileDropZone
  fileDropZone: "file-drop-zone",

  // Badge
  badge: "badge",

  // ComboBox
  comboBox: "combo-box",

  // Divider
  divider: "divider",
} as const;

export type ComponentId = (typeof componentIds)[keyof typeof componentIds];
