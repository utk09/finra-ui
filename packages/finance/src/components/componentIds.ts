/**
 * The registry of `data-finra-ui` values for finance components, one per
 * component or named part.
 *
 * @remarks
 * Separate from core's registry but sharing the same attribute, so
 * `[data-finra-ui]` selects across both packages. Sub-parts get their own entry
 * (`dateInputField`, `calendarIcon`) so a consumer can target the inner element
 * without depending on the DOM shape, which is not part of the public contract.
 */
export const componentIds = {
  // AmountInput
  amountInput: "amount-input",

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

/**
 * Every value this package's {@link componentIds} can produce.
 *
 * @remarks
 * Derived from the registry rather than declared separately, so adding an entry
 * there widens this automatically and the two can never drift apart.
 */
export type FinanceComponentId = (typeof componentIds)[keyof typeof componentIds];
