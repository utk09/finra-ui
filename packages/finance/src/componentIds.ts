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
  amountInputField: "amount-input-field",

  // Calendar
  calendar: "calendar",
  calendarHeader: "calendar-header",
  calendarNavButton: "calendar-nav-button",
  calendarTitle: "calendar-title",
  calendarWeekdayRow: "calendar-weekday-row",
  calendarWeekday: "calendar-weekday",
  calendarGrid: "calendar-grid",
  calendarRow: "calendar-row",
  calendarDayCell: "calendar-day-cell",
  calendarDay: "calendar-day",
  calendarWeekNumber: "calendar-week-number",
  calendarMonthYear: "calendar-month-year",
  calendarFooter: "calendar-footer",
  calendarShortcuts: "calendar-shortcuts",

  // DateInput
  dateInput: "date-input",
  dateInputField: "date-input-field",
  dateInputAdornment: "date-input-adornment",
  dateInputPopup: "date-input-popup",
  calendarIcon: "calendar-icon",

  // TenorInput
  tenorInput: "tenor-input",

  // TenorPicker
  tenorPicker: "tenor-picker",
  tenorPickerInput: "tenor-picker-input",
  tenorPickerIndicator: "tenor-picker-indicator",
  tenorPickerPopup: "tenor-picker-popup",
  tenorPickerGroup: "tenor-picker-group",
  tenorPickerGroupLabel: "tenor-picker-group-label",
  tenorPickerOption: "tenor-picker-option",
  tenorPickerOptionLabel: "tenor-picker-option-label",
  tenorPickerCheck: "tenor-picker-check",
  tenorPickerFavourite: "tenor-picker-favourite",
  tenorPickerEmpty: "tenor-picker-empty",

  // DateTenorInput
  dateTenorInput: "date-tenor-input",
  dateTenorInputTrigger: "date-tenor-input-trigger",
  dateTenorInputField: "date-tenor-input-field",
  dateTenorInputBadge: "date-tenor-input-badge",
  dateTenorInputCalendarButton: "date-tenor-input-calendar-button",
  dateTenorInputIndicator: "date-tenor-input-indicator",
  dateTenorInputPopup: "date-tenor-input-popup",
  dateTenorInputCalendarSection: "date-tenor-input-calendar-section",
  dateTenorInputTenorSection: "date-tenor-input-tenor-section",
  dateTenorInputTenorTitle: "date-tenor-input-tenor-title",
  dateTenorInputTenorGrid: "date-tenor-input-tenor-grid",
  dateTenorInputTenor: "date-tenor-input-tenor",

  // DateTenorPicker
  dateTenorPicker: "date-tenor-picker",
  dateTenorPickerField: "date-tenor-picker-field",
  dateTenorPickerAdornment: "date-tenor-picker-adornment",
  dateTenorPickerIndicator: "date-tenor-picker-indicator",
  dateTenorPickerPopup: "date-tenor-picker-popup",
  dateTenorPickerModeIndicator: "date-tenor-picker-mode-indicator",
  dateTenorPickerBrokenIndicator: "date-tenor-picker-broken-indicator",
  dateTenorPickerCalendarSection: "date-tenor-picker-calendar-section",
  dateTenorPickerTenorSection: "date-tenor-picker-tenor-section",
  dateTenorPickerTenorTitle: "date-tenor-picker-tenor-title",
  dateTenorPickerTenorGrid: "date-tenor-picker-tenor-grid",
  dateTenorPickerTenor: "date-tenor-picker-tenor",
  dateTenorPickerResolvedDate: "date-tenor-picker-resolved-date",

  // PriceInput
  priceInput: "price-input",
  priceInputField: "price-input-field",
  /**
   * The hierarchy overlay. Present only when `digitHierarchy` is set, and
   * `aria-hidden`, because it mirrors the field for styling rather than adding
   * anything to the accessibility tree.
   */
  priceInputDisplay: "price-input-display",
  priceInputSegments: "price-input-segments",
  /**
   * One per segment kind. Colour, size and weight of each zone are a house
   * convention rather than a property of the component, so every zone is
   * addressable on its own.
   */
  priceInputSign: "price-input-sign",
  priceInputInteger: "price-input-integer",
  priceInputSeparator: "price-input-separator",
  priceInputPrimary: "price-input-primary",
  priceInputPrecision: "price-input-precision",
  priceInputBigFigure: "price-input-big-figure",
  priceInputPips: "price-input-pips",
  priceInputFractionalPip: "price-input-fractional-pip",
  priceInputUnit: "price-input-unit",

  // CurrencyPairPicker
  currencyPairPicker: "currency-pair-picker",
  /**
   * The input shell. Addressable separately because the listbox is portalled
   * out of the root, so the shell is what anchors and sizes it.
   */
  currencyPairPickerControl: "currency-pair-picker-control",
  currencyPairPickerInput: "currency-pair-picker-input",
  currencyPairPickerIndicator: "currency-pair-picker-indicator",
  currencyPairPickerListbox: "currency-pair-picker-listbox",
  currencyPairPickerOptions: "currency-pair-picker-options",
  currencyPairPickerSection: "currency-pair-picker-section",
  currencyPairPickerSectionLabel: "currency-pair-picker-section-label",
  currencyPairPickerOption: "currency-pair-picker-option",
  currencyPairPickerOptionSymbol: "currency-pair-picker-option-symbol",
  currencyPairPickerOptionName: "currency-pair-picker-option-name",
  currencyPairPickerBadges: "currency-pair-picker-badges",
  currencyPairPickerFavouriteToggle: "currency-pair-picker-favourite-toggle",
  currencyPairPickerEmpty: "currency-pair-picker-empty",
  currencyPairPickerLoading: "currency-pair-picker-loading",
  currencyPairPickerError: "currency-pair-picker-error",
  /**
   * Visually hidden result-count announcement.
   *
   * @remarks
   * Carries no class, being positioned by an inline style, so it is reachable only through this id.
   */
  currencyPairPickerStatus: "currency-pair-picker-status",
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
