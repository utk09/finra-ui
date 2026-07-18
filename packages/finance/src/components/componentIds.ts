export const componentIds = {
  // Calendar
  calendar: "calendar",

  // DateInput
  dateInput: "date-input",
  dateInputField: "date-input-field",
  calendarIcon: "calendar-icon",

  // TenorInput
  tenorInput: "tenor-input",

  // TenorPicker
  tenorPicker: "tenor-picker",

  // DateTenorInput
  dateTenorInput: "date-tenor-input",

  // DateTenorPicker
  dateTenorPicker: "date-tenor-picker",

  // PriceInput
  priceInput: "price-input",
} as const;

export type FinanceComponentId = (typeof componentIds)[keyof typeof componentIds];
