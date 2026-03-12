// Utilities
export { mergeRefs } from "./utils/mergeRefs";

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
export type { StandardTenor, TenorParseResult, TenorResolver, TenorUnit } from "./utils/tenor";
export {
  dateToTenor,
  isStandardTenor,
  parseTenor,
  resolveTenor,
  STANDARD_TENORS,
} from "./utils/tenor";
