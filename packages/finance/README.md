# Finra UI - Finance

Financial domain components for the Finra UI component system. Date inputs, tenor pickers, and calendar.

[![npm version](https://img.shields.io/npm/v/@utk09/finra-ui-finance.svg)](https://www.npmjs.com/package/@utk09/finra-ui-finance)
[![Storybook](https://img.shields.io/badge/Storybook-deployed-ff4785)](https://finra-ui.netlify.app)

## Installation

```bash
npm install @utk09/finra-ui-finance @utk09/finra-ui @utk09/finra-ui-icons
# or
pnpm add @utk09/finra-ui-finance @utk09/finra-ui @utk09/finra-ui-icons
```

`@utk09/finra-ui` and `@utk09/finra-ui-icons` are peer dependencies — they provide shared tokens, base components, and icons.

## Quick Start

```tsx
import "@utk09/finra-ui/styles";
import { DateInput, TenorInput, Calendar, DateTenorInput } from "@utk09/finra-ui-finance";

function TradeForm() {
  return (
    <div>
      <DateInput label="Settlement Date" format="MM/DD/YYYY" />
      <TenorInput label="Tenor" tenors={["ON", "1W", "1M", "3M", "6M", "1Y"]} />
      <DateTenorInput label="Expiry" />
      <Calendar />
    </div>
  );
}
```

## Components

### Styled Components

| Component        | Description                                                        |
| ---------------- | ------------------------------------------------------------------ |
| `Calendar`       | Month calendar with day selection, navigation, min/max constraints |
| `DateInput`      | Date entry with format validation, auto-separators, calendar popup |
| `TenorInput`     | Financial tenor picker (ON, 1W, 1M, 3M, 6M, 1Y, etc.)              |
| `DateTenorInput` | Combined date + tenor input with tenor-to-date resolution          |

### Unstyled Components

Every styled component has an unstyled base. Import from the `/unstyled` entry point:

```tsx
import {
  CalendarBase,
  DateInputBase,
  TenorInputBase,
  DateTenorInputBase,
} from "@utk09/finra-ui-finance/unstyled";
```

### Utilities

Date formatting and tenor parsing utilities. Import from the `/utils` entry point:

```tsx
import {
  formatDate,
  parseDate,
  parseTenor,
  resolveTenor,
  STANDARD_TENORS,
} from "@utk09/finra-ui-finance/utils";
```

## Exports

| Subpath                            | Contents                                  |
| ---------------------------------- | ----------------------------------------- |
| `@utk09/finra-ui-finance`          | Styled React components                   |
| `@utk09/finra-ui-finance/unstyled` | Unstyled base components                  |
| `@utk09/finra-ui-finance/utils`    | Date formatting + tenor parsing utilities |
| `@utk09/finra-ui-finance/styles`   | CSS styles                                |

## License

[MIT](../../LICENSE)
