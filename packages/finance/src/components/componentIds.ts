export const componentIds = {
  // Calendar
  calendar: "calendar",

  // DateInput
  dateInput: "date-input",
  dateInputField: "date-input-field",
  calendarIcon: "calendar-icon",

  // TenorInput
  tenorInput: "tenor-input",

  // DateTenorInput
  dateTenorInput: "date-tenor-input",
} as const;

export type FinanceComponentId = (typeof componentIds)[keyof typeof componentIds];
