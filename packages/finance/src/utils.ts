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

// Unified date/tenor parser (DateTenorPicker's pluggable-parser seam)
export type {
  DateTenorMode,
  DateTenorParseContext,
  DateTenorParseError,
  DateTenorParser,
  DateTenorParseResult,
} from "./utils/dateTenorParse";
export { parseDateTenor } from "./utils/dateTenorParse";

// Market-aware price parse/format/tick (PriceInput's pluggable seams)
export type {
  PriceFormat,
  PriceFormatOptions,
  PriceFormatter,
  PriceParser,
  PriceParseResult,
  PriceSegment,
  PriceSegmentConfig,
  PriceSegmentKind,
  TickEngine,
} from "./utils/priceFormat";
export { formatPrice, parsePrice, segmentPrice, stepPrice } from "./utils/priceFormat";

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
export { DEFAULT_PRICE_KEYMAP, keyChord, resolveKey } from "./utils/keymap";
