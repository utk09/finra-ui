# Finra UI - Finance

Financial domain components for the Finra UI component system - built for traders, operations, treasury, and risk users. Components encapsulate **financial behaviour** (parsing, formatting, keyboard semantics, visual hierarchy); business rules (holiday calendars, settlement conventions, instrument data) are injected by the consumer.

[![npm version](https://img.shields.io/npm/v/@utk09/finra-ui-finance.svg)](https://www.npmjs.com/package/@utk09/finra-ui-finance)
[![Storybook](https://img.shields.io/badge/Storybook-deployed-ff4785)](https://finra-ui.netlify.app)

## Installation

```bash
npm install @utk09/finra-ui-finance @utk09/finra-ui @utk09/finra-ui-icons
# or
pnpm add @utk09/finra-ui-finance @utk09/finra-ui @utk09/finra-ui-icons
```

`@utk09/finra-ui` and `@utk09/finra-ui-icons` are peer dependencies - they provide shared tokens, base components, and icons.

## Quick Start

```tsx
import "@utk09/finra-ui/styles";
import { DateTenorPicker, PriceInput, Calendar } from "@utk09/finra-ui-finance";

function TradeTicket() {
  return (
    <div>
      <PriceInput
        aria-label="Rate"
        instrument={{ primaryPrecision: 4, precisionDigits: 1, tickSize: 0.00005 }}
        digitHierarchy
      />
      <DateTenorPicker aria-label="Value date" showResolvedDate showModeIndicator />
      <Calendar mode="range" />
    </div>
  );
}
```

## Components

### Styled Components

| Component         | Description                                                                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Calendar`        | Month calendar: single or range selection, min/max, highlighted dates, week numbers, month/year dropdowns, footer shortcut API                       |
| `DateInput`       | Date entry with format validation, auto-separators, calendar popup                                                                                   |
| `TenorInput`      | **Deprecated** — use `TenorPicker` (`grouped={false}` for the flat list). Removed in a future release.                                               |
| `TenorPicker`     | Market-aware tenor selector: grouped list (Overnight/Weeks/Months/Years/…), favourites, free-form parsing (`3 months`, `1y6m`), keyboard workflow    |
| `DateTenorInput`  | Combined date + tenor input with tenor-to-date resolution                                                                                            |
| `DateTenorPicker` | Hybrid date/tenor combobox: absolute dates, relative tenors (`3M`, `Spot+3M`), business-calendar adjustment, resolved-date + mode/broken-date badges |
| `PriceInput`      | Market-aware price input: digit visual hierarchy (big-figure/pips), tick sizes, precision tiers, configurable keyboard increments                    |

Calendar footer extras: `CalendarTodayButton`, `CalendarShortcuts` (tenor shortcut buttons), `CalendarMonthYear` (header dropdowns).

### Unstyled Components

Every styled component has an unstyled base. Import from the `/unstyled` entry point:

```tsx
import {
  CalendarBase,
  DateInputBase,
  TenorInputBase,
  DateTenorInputBase,
  DateTenorPickerBase,
  PriceInputBase,
  TenorInputBase,
  TenorPickerBase,
} from "@utk09/finra-ui-finance/unstyled";
```

### Utilities

Pure, framework-agnostic engines - the same ones the components use internally. Import from the `/utils` entry point:

```tsx
import {
  // Dates
  formatDate,
  parseDate,
  validateDate,
  // Tenors
  parseTenor,
  parseTenorInput, // flexible: "3 months", "1y6m", "90d" → canonical
  resolveTenor,
  dateToTenor,
  STANDARD_TENORS,
  // Unified date/tenor parsing (DateTenorPicker's replaceable parser)
  parseDateTenor,
  // Prices: parse / format / segment / tick-step
  parsePrice,
  formatPrice,
  segmentPrice,
  stepPrice,
  // Increment engine (FP-safe, keyboard-independent)
  resolveIncrement,
  roundWith,
  validateTick,
  // Keyboard action maps
  resolveKey,
  keyChord,
  DEFAULT_PRICE_KEYMAP,
} from "@utk09/finra-ui-finance/utils";
```

## Injectable Adapters

Business logic never lives in the components - provide it:

- **Parsers** - `DateTenorPicker` and `PriceInput` accept replaceable parsers/formatters.
- **Business calendar** - `BusinessCalendar` adapter (`isBusinessDay`, `adjust(date, convention)`) with adjustment conventions (following, modified-following, preceding, ...).
- **Instrument metadata** - `PriceInput` takes an `instrument` object (precision, tick size, min/max) that can change without remounting.
- **Keyboard maps** - default price keymap (Arrow = ±1 tick, Shift = ±10, Ctrl = ±primary) is fully remappable.

## Exports

| Subpath                            | Contents                                      |
| ---------------------------------- | --------------------------------------------- |
| `@utk09/finra-ui-finance`          | Styled React components                       |
| `@utk09/finra-ui-finance/unstyled` | Unstyled base components                      |
| `@utk09/finra-ui-finance/utils`    | Date/tenor/price parsing + formatting engines |
| `@utk09/finra-ui-finance/styles`   | CSS styles                                    |

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) at the repository root.

## License

[MIT](../../LICENSE)
