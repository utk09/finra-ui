# @utk09/finra-ui-icons

127 icons for [finra-ui](https://github.com/utk09/finra-ui), as plain data with React wrappers on top.

[![npm](https://img.shields.io/npm/v/@utk09/finra-ui-icons.svg)](https://www.npmjs.com/package/@utk09/finra-ui-icons) [![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

**[See every icon](https://finra-ui.netlify.app/?path=/story/icons--category-icons)**

## Packages

| Package | What it is |
| --- | --- |
| [`@utk09/finra-ui`](https://www.npmjs.com/package/@utk09/finra-ui) ([docs](https://github.com/utk09/finra-ui/blob/main/packages/core/README.md)) | Buttons, inputs, forms, overlays, tabs, toasts. 23 components. |
| [`@utk09/finra-ui-finance`](https://www.npmjs.com/package/@utk09/finra-ui-finance) ([docs](https://github.com/utk09/finra-ui/blob/main/packages/finance/README.md)) | Price, amount, tenor and date-tenor fields, plus the parsers behind them. |
| **`@utk09/finra-ui-icons`** (this one) | 127 icons as plain data, with React wrappers. |

## Install

```bash
npm install @utk09/finra-ui-icons
```

React 18 or later for the wrappers. The data export needs no framework at all. ESM only.

## Use

```tsx
import { CalendarIcon, SearchIcon } from "@utk09/finra-ui-icons/react";

<SearchIcon aria-hidden="true" />;
<CalendarIcon role="img" aria-label="Pick a date" />;
```

Every wrapper takes the standard `SVGProps<SVGSVGElement>`, so any SVG attribute works as a prop.

## Naming an icon is your call

The icons carry no `title` and no `aria-label`, deliberately. An icon cannot know whether it is decoration beside a text label or the entire content of a button, and guessing wrong is worse than not guessing. Mark it `aria-hidden` when nearby text already says what it means, or give it `role="img"` and a label when it stands alone. If you want an icon-only button, `IconButton` in the core package requires a label and will not compile without one.

## Icons are data first

Each icon is a plain object, so Lit, Vue, a canvas renderer or a build script can draw the same definitions without pulling in React. The data carries every `<svg>` attribute a renderer needs, so two renderers of the same icon agree on size, stroke and grid without repeating those decisions.

```ts
import { calendarIcon } from "@utk09/finra-ui-icons";

calendarIcon.viewBox; // "0 0 24 24"
calendarIcon.width; // "1em"
calendarIcon.height; // "1em"
calendarIcon.stroke; // "currentColor"
calendarIcon.children; // [{ tag: "rect", ... }, { tag: "line", ... }]
```

The React wrappers are maintained alongside this data rather than generated from it. Treat the data as the portable definition and the wrappers as the React convenience on top.

## Design

Every icon is stroked with `currentColor` on a 24x24 grid, so it inherits the surrounding text colour and needs no per-theme variant. Nothing is pinned to a palette.

Every icon also carries `width="1em"` and `height="1em"`. An `<svg>` with only a `viewBox` falls back to the CSS default size for a replaced element, around 300px, so an icon dropped somewhere that does not size it swamps the layout. At `1em` it scales with the text around it instead. Both are ordinary attributes applied before your props, so `<SearchIcon width={20} height={20} />` wins, and any CSS rule beats them outright.

```css
/* Size a whole group of icons without touching the markup. */
.toolbar svg {
  inline-size: 1.25rem;
  block-size: 1.25rem;
}
```

## Entry points

| Import                        | Contains                                                 |
| ----------------------------- | -------------------------------------------------------- |
| `@utk09/finra-ui-icons`       | The icon data, plus the `IconData` and `SvgChild` types. |
| `@utk09/finra-ui-icons/react` | The React components.                                    |

## License

[Apache-2.0](LICENSE). Keep the notices and pass on the [NOTICE](NOTICE) file when redistributing.
