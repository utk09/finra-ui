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
import {
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  SearchIcon,
  DollarIcon,
} from "@utk09/finra-ui-icons/react";

function App() {
  return (
    <div>
      <CalendarIcon width={24} height={24} />
      <CheckIcon className="check" />
      <ChevronDownIcon aria-hidden="true" />
      <SearchIcon width={24} height={24} />
      <DollarIcon width={24} height={24} />
    </div>
  );
}
```

All React icon components accept standard `SVGProps<SVGSVGElement>` - pass any SVG attribute as a prop.

### Framework-Agnostic SVG Data

```ts
import { calendarIcon, checkIcon, dollarIcon } from "@utk09/finra-ui-icons";

// Each icon is a plain object describing the SVG
console.log(calendarIcon.viewBox); // "0 0 24 24"
console.log(calendarIcon.children); // [{ tag: "rect", ... }, { tag: "line", ... }, ...]
```

Use the SVG data objects to render icons in any framework (Lit, vanilla DOM, etc.).

## Available Icons

See the **[category-wise icon list](https://finra-ui.netlify.app/?path=/story/icons--category-icons)** for all available icons.

## Exports

| Subpath                       | Contents                                                             |
| ----------------------------- | -------------------------------------------------------------------- |
| `@utk09/finra-ui-icons`       | Framework-agnostic SVG data objects + types (`IconData`, `SvgChild`) |
| `@utk09/finra-ui-icons/react` | React SVG components                                                 |

## Design

- All icons use `stroke="currentColor"` so they inherit the parent's text color. No fill colors are hardcoded - icons adapt to any theme automatically.
- All icons are normalized to a canonical **24x24** viewport grid.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) at the repository root.

## License

[MIT](../../LICENSE)
