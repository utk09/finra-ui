# Finra UI - Icons

Icon library for the Finra UI component system.

[![npm version](https://img.shields.io/npm/v/@utk09/finra-ui-icons.svg)](https://www.npmjs.com/package/@utk09/finra-ui-icons)

## Installation

```bash
npm install @utk09/finra-ui-icons
# or
pnpm add @utk09/finra-ui-icons
```

## Usage

### React Components

```tsx
import { CalendarIcon, CheckIcon, ChevronDownIcon } from "@utk09/finra-ui-icons/react";

function App() {
  return (
    <div>
      <CalendarIcon width={24} height={24} />
      <CheckIcon className="check" />
      <ChevronDownIcon aria-hidden="true" />
    </div>
  );
}
```

All React icon components accept standard `SVGProps<SVGSVGElement>` - pass any SVG attribute as a prop.

### Framework-Agnostic SVG Data

```ts
import { calendarIcon, checkIcon } from "@utk09/finra-ui-icons";

// Each icon is a plain object describing the SVG
console.log(calendarIcon.viewBox); // "0 0 24 24"
console.log(calendarIcon.children); // [{ tag: "rect", ... }, { tag: "line", ... }, ...]
```

Use the SVG data objects to render icons in any framework (Lit, vanilla DOM, etc.).

## Available Icons

| Icon          | React Component    | SVG Data           | Size  |
| ------------- | ------------------ | ------------------ | ----- |
| Calendar      | `CalendarIcon`     | `calendarIcon`     | 24x24 |
| Check         | `CheckIcon`        | `checkIcon`        | 12x12 |
| Chevron Down  | `ChevronDownIcon`  | `chevronDownIcon`  | 12x12 |
| Chevron Left  | `ChevronLeftIcon`  | `chevronLeftIcon`  | 12x12 |
| Chevron Right | `ChevronRightIcon` | `chevronRightIcon` | 12x12 |
| Close         | `CloseIcon`        | `closeIcon`        | 24x24 |
| Close Small   | `CloseSmallIcon`   | `closeSmallIcon`   | 12x12 |
| Dash          | `DashIcon`         | `dashIcon`         | 12x12 |
| Minus         | `MinusIcon`        | `minusIcon`        | 24x24 |
| Plus          | `PlusIcon`         | `plusIcon`         | 24x24 |
| Spinner       | `SpinnerIcon`      | `spinnerIcon`      | 24x24 |
| Upload        | `UploadIcon`       | `uploadIcon`       | 24x24 |

## Exports

| Subpath                       | Contents                                                             |
| ----------------------------- | -------------------------------------------------------------------- |
| `@utk09/finra-ui-icons`       | Framework-agnostic SVG data objects + types (`IconData`, `SvgChild`) |
| `@utk09/finra-ui-icons/react` | React SVG components                                                 |

## Design

All icons use `stroke="currentColor"` so they inherit the parent's text color. No fill colors are hardcoded - icons adapt to any theme automatically.

## License

[MIT](../../LICENSE)
