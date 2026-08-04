# @utk09/finra-ui

The core of [finra-ui](https://github.com/utk09/finra-ui): buttons, inputs, forms, overlays and the primitives underneath them.

[![npm](https://img.shields.io/npm/v/@utk09/finra-ui.svg)](https://www.npmjs.com/package/@utk09/finra-ui) [![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

**[Browse the components](https://finra-ui.netlify.app)**

## Packages

| Package | What it is |
| --- | --- |
| **`@utk09/finra-ui`** (this one) | Buttons, inputs, forms, overlays, tabs, toasts. 23 components. |
| [`@utk09/finra-ui-finance`](https://www.npmjs.com/package/@utk09/finra-ui-finance) ([docs](https://github.com/utk09/finra-ui/blob/main/packages/finance/README.md)) | Price, amount, tenor and date-tenor fields, plus the parsers behind them. |
| [`@utk09/finra-ui-icons`](https://www.npmjs.com/package/@utk09/finra-ui-icons) ([docs](https://github.com/utk09/finra-ui/blob/main/packages/icons/README.md)) | 127 icons as plain data, with React wrappers. |

## Install

```bash
npm install @utk09/finra-ui
```

React 18 or later. ESM only.

## Use

Import the stylesheet once at your app root.

```tsx
import "@utk09/finra-ui/styles";
import { Button, FormField, Input } from "@utk09/finra-ui";

<FormField label="Counterparty" helperText="Legal entity name" required>
  <Input placeholder="Search" />
</FormField>;
```

`FormField` finds the control inside it and wires up the label, the description and the invalid state, however deep it sits. You do not pass ids around.

## Entry points

| Import                     | Contains                                                       |
| -------------------------- | -------------------------------------------------------------- |
| `@utk09/finra-ui`          | The styled components. Start here.                             |
| `@utk09/finra-ui/unstyled` | The same components with behaviour and ARIA but no CSS.        |
| `@utk09/finra-ui/utils`    | Framework-free state machines, keyboard resolvers and helpers. |
| `@utk09/finra-ui/styles`   | The stylesheet. Import once, for side effects.                 |

## Two ideas worth knowing

**Variant and sentiment are different axes.** `variant` is how loud a component is (primary, secondary, tertiary). `sentiment` is what it means (danger, success, warning, info). They combine freely, so a tertiary danger button is a quiet destructive action. There is no `size` prop anywhere; sizing comes from density.

**Theme and density are attributes, not a provider.** Set `data-theme="dark"` or `data-density="compact"` on any element and everything inside it follows. Nothing to wrap your tree in, and nothing that breaks under SSR.

```html
<div data-theme="dark" data-density="compact">
  <!-- components here are dark and compact -->
</div>
```

## Styling it yourself

Three routes, in increasing order of effort.

1. Override CSS custom properties. The tokens are three tiers: a raw palette, a semantic layer (`--finra-actionable-*`, `--finra-status-*`, `--finra-container-*`), and per-component internals. Retheming means touching the semantic tier.
2. Target `[data-finra-ui="button"]` and friends. Every component renders one, and it is public API. The hashed class names are not, so do not select on those.
3. Take the unstyled base from `/unstyled` and bring your own CSS. You keep the keyboard handling, focus management and ARIA, and give up nothing but the appearance.

## Accessibility

Overlays trap and restore focus, dismiss on Escape in stack order, and portal out of clipping ancestors. Listboxes and menus implement the APG keyboard patterns, including typeahead. Icon-only buttons will not compile without an `aria-label`.

If you find a gap, that is a bug worth reporting.

## Documentation

Every exported type and prop carries editor documentation, so hovering usually beats reading. Beyond that, see [Storybook](https://finra-ui.netlify.app) and the [repository](https://github.com/utk09/finra-ui).

## License

[Apache-2.0](LICENSE). Keep the notices and pass on the [NOTICE](NOTICE) file when redistributing.
