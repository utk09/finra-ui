// Spreadsheet cell text to a number. Pairs with core's parseClipboardMatrix,
// which splits the paste into the cells this reads.
export type {
  CellNumberOptions,
  CellNumberResult,
  NumberLocaleHint,
} from "./logic/clipboardValues";
export { parseCellNumber } from "./logic/clipboardValues";
// Human-notation amount parse/format (AmountInput's pluggable seams)
export type {
  AmountFormat,
  AmountFormatOptions,
  AmountParseError,
  AmountParseOptions,
  AmountParseResult,
  AmountSuffixTable,
} from "./utils/amount";
export {
  compactSuffixesForLocale,
  currencyDecimals,
  DEFAULT_AMOUNT_SUFFIXES,
  DEFAULT_GROUP_SEPARATORS,
  formatAmount,
  parseAmount,
} from "./utils/amount";
// Currency-pair parse/format (CurrencyPairPicker's pluggable-parser seam)
export type {
  CurrencyPairFormatOptions,
  CurrencyPairParseError,
  CurrencyPairParseOptions,
  CurrencyPairParseResult,
  CurrencyPairValue,
} from "./utils/currencyPair";
export {
  collectCurrencyCodes,
  currencyDisplayName,
  DEFAULT_PAIR_SEPARATORS,
  formatCurrencyPair,
  isCurrencyCode,
  OPTIONAL_PAIR_SEPARATORS,
  pairId,
  parseCurrencyPair,
} from "./utils/currencyPair";
// Date formatting
export type { DateConstraints, DateFormat, DateParseResult } from "./utils/dateFormat";
export {
  formatDate,
  getFormatPlaceholder,
  getFormatSegmentLengths,
  getFormatSeparator,
  parseDate,
  validateDate,
} from "./utils/dateFormat";
// Unified date/tenor parser (DateTenorPicker's pluggable-parser seam)
export type {
  DateTenorMode,
  DateTenorParseContext,
  DateTenorParseError,
  DateTenorParseResult,
  DateTenorParser,
} from "./utils/dateTenorParse";
export { parseDateTenor } from "./utils/dateTenorParse";
// Decimal arithmetic that avoids binary floating-point artefacts
export {
  addDecimal,
  decimalPlaces,
  divideDecimal,
  multiplyDecimal,
  productDecimal,
  roundToDecimals,
  scaleByPowerOfTen,
  subtractDecimal,
  sumDecimal,
} from "./utils/decimal";
// Shared increment engine (FP-safe, keyboard-independent) + tick validation
export type {
  IncrementAction,
  IncrementContext,
  NumericPrecision,
  RoundingMode,
  TickValidationMode,
  TickValidationResult,
} from "./utils/increment";
export { displayDecimals, resolveIncrement, roundWith, validateTick } from "./utils/increment";
// Configurable keyboard action map (key+modifier → semantic action)
export type { KeyAction, KeyEventLike, KeyMap, NavMode } from "./utils/keymap";
export { createAmountKeymap, DEFAULT_PRICE_KEYMAP, keyChord, resolveKey } from "./utils/keymap";
// Market-aware price parse/format/tick (PriceInput's pluggable seams)
export type {
  PriceFormat,
  PriceFormatOptions,
  PriceFormatter,
  PriceInstrument,
  PriceParseResult,
  PriceParser,
  PriceSegment,
  PriceSegmentConfig,
  PriceSegmentKind,
  TickEngine,
} from "./utils/priceFormat";
export { formatPrice, parsePrice, segmentPrice, stepPrice } from "./utils/priceFormat";
// Tenor utilities
export type {
  FlexibleTenorParseResult,
  StandardTenor,
  TenorInputParser,
  TenorParseResult,
  TenorResolver,
  TenorTerm,
  TenorUnit,
} from "./utils/tenor";
export {
  dateToTenor,
  isStandardTenor,
  parseTenor,
  parseTenorInput,
  resolveTenor,
  STANDARD_TENORS,
} from "./utils/tenor";
