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

  // CurrencyPairPicker
  currencyPairPicker: "currency-pair-picker",
  /**
   * The input shell. Addressable separately because the listbox is portalled
   * out of the root, so the shell is what anchors and sizes it.
   */
  currencyPairPickerControl: "currency-pair-picker-control",
  /** Instrument badges, so consumers can theme them without a render prop. */
  currencyPairBadge: "currency-pair-badge",
} as const;

export type FinanceComponentId = (typeof componentIds)[keyof typeof componentIds];
