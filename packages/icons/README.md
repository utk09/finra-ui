# @utk09/finra-ui-icons

127 icons for [finra-ui](https://github.com/utk09/finra-ui), as plain data with React wrappers on top.

[![npm](https://img.shields.io/npm/v/@utk09/finra-ui-icons.svg)](https://www.npmjs.com/package/@utk09/finra-ui-icons) [![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

**[See every icon](https://finra-ui.netlify.app/?path=/story/icons--category-icons)**

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

The React components are one consumer of the icon data, not the source of it. Each icon is a plain object, so Lit, Vue, a canvas renderer or a build script can use the same definitions.

```ts
import { calendarIcon } from "@utk09/finra-ui-icons";

calendarIcon.viewBox; // "0 0 24 24"
calendarIcon.children; // [{ tag: "rect", ... }, { tag: "line", ... }]
```

## Design

Every icon is stroked with `currentColor` on a 24x24 grid, so it inherits the surrounding text colour and needs no per-theme variant. Nothing is pinned to a palette.

## Entry points

| Import                        | Contains                                                 |
| ----------------------------- | -------------------------------------------------------- |
| `@utk09/finra-ui-icons`       | The icon data, plus the `IconData` and `SvgChild` types. |
| `@utk09/finra-ui-icons/react` | The React components.                                    |

## License

[Apache-2.0](LICENSE). Keep the notices and pass on the [NOTICE](NOTICE) file when redistributing.
