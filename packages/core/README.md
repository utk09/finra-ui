# Finra UI - Core

React component library for web applications.

[![CI](https://github.com/utk09/finra-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/utk09/finra-ui/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@utk09/finra-ui.svg)](https://www.npmjs.com/package/@utk09/finra-ui)
[![Storybook](https://img.shields.io/badge/Storybook-deployed-ff4785)](https://finra-ui.netlify.app)

## Live Demo

Browse all components with interactive examples: **[finra-ui.netlify.app](https://finra-ui.netlify.app)**

## Installation

```bash
npm install @utk09/finra-ui
# or
pnpm add @utk09/finra-ui
```

## Quick Start

Import the global styles **once** at the root of your app, then use any component:

```tsx
import "@utk09/finra-ui/styles";
import { Button, Input, Badge } from "@utk09/finra-ui";

function App() {
  return (
    <div>
      <Button variant="primary">Click me</Button>
      <Input placeholder="Enter text..." />
      <Badge sentiment="success">Active</Badge>
    </div>
  );
}
```

## Components

### Form & Input

| Component      | Description                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------- |
| `Button`       | Button with variant (primary/secondary/tertiary) and sentiment (danger/success/warning/info) |
| `IconButton`   | Icon-only button with `aria-label` requirement                                               |
| `ButtonGroup`  | Groups buttons with merged borders                                                           |
| `Input`        | Text input with variants, validation states, adornments, and clearable support               |
| `Textarea`     | Multi-line text input with character count and auto-resize                                   |
| `NumberInput`  | Numeric input with increment/decrement buttons                                               |
| `FormField`    | Wires label, helper text, and error message onto its child input via context                 |
| `Checkbox`     | Custom-styled checkbox with indeterminate support                                            |
| `Switch`       | Toggle switch (on/off)                                                                       |
| `RadioButton`  | Radio button for grouped exclusive selection                                                 |
| `Slider`       | Range slider with optional label and value display                                           |
| `PillInput`    | Tokenized tag/pill input with keyboard support                                               |
| `FileDropZone` | Drag-and-drop file upload zone                                                               |
| `ComboBox`     | Filterable single/multi-select with grouping and option creation                             |

### Overlays & Navigation

| Component                                                                                        | Description                                                                                        |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `Dialog` (+ `DialogTrigger`, `DialogContent`, `DialogTitle`, `DialogDescription`, `DialogClose`) | Modal dialog with focus trap, scroll lock, and dismiss handling                                    |
| `Tooltip` (+ `TooltipTrigger`, `TooltipContent`)                                                 | Hover/focus tooltip with positioning                                                               |
| `Popover` (+ `PopoverTrigger`, `PopoverContent`, `PopoverClose`)                                 | Generic anchored overlay                                                                           |
| `Select` (+ `SelectTrigger`, `SelectContent`)                                                    | Listbox-button select with typeahead                                                               |
| `Menu` (+ `MenuTrigger`, `MenuContent`, `MenuItem`, `MenuSeparator`)                             | Dropdown menu with roving focus and typeahead                                                      |
| `Toaster` + `toast()`                                                                            | Toast queue with `aria-live` region; imperative `toast()`, `toast.success()`, `toast.error()`, ... |
| `Tabs` (+ `TabList`, `Tab`, `TabPanel`)                                                          | APG-conformant tabs with automatic/manual activation                                               |

### Display

| Component | Description                                             |
| --------- | ------------------------------------------------------- |
| `Badge`   | Inline status/category label with variant and sentiment |
| `Divider` | Horizontal or vertical separator                        |

## Unstyled Components

Every styled component has an unstyled base that provides only behavior and accessibility - no visual styles. Import from the `/unstyled` entry point:

```tsx
import { ButtonBase, ComboBoxBase, Dialog, DialogContent } from "@utk09/finra-ui/unstyled";
```

Available: `ButtonBase`, `IconButtonBase`, `InputBase`, `TextareaBase`, `NumberInputBase`, `CheckboxBase`, `SwitchBase`, `RadioButtonBase`, `SliderBase`, `FormFieldBase`, `PillInputBase`, `FileDropZoneBase`, `ComboBoxBase`, plus the compound overlay families (`Dialog`, `Tooltip`, `Popover`, `Select`, `Menu`, `Toaster`/`ToastItem`, `Tabs`).

### Overlay Primitives

The building blocks behind the overlay components are public - build your own popup components with them:

```tsx
import { Portal, DismissableLayer, FocusScope } from "@utk09/finra-ui/unstyled";
```

- `Portal` - renders into `document.body` (or a custom container) while preserving `data-theme` / `data-density` from the trigger's subtree.
- `DismissableLayer` - layered outside-click + Escape dismissal (topmost layer wins).
- `FocusScope` - focus trap with restore-on-unmount and initial-focus targeting.

## Utilities

Framework-agnostic helpers from the `/utils` entry point:

```tsx
import { mergeRefs, cx, createStore, computeAnchoredPosition } from "@utk09/finra-ui/utils";
```

Includes `mergeRefs`, `cx`, the `createStore` state container, dismiss-layer registration, and floating-ui-based positioning helpers.

## Features

### Variants & Sentiments

Buttons and Badges support three **variants** (emphasis) and four **sentiments** (color meaning) that combine freely:

```tsx
<Button variant="primary" sentiment="danger">Delete</Button>
<Button variant="secondary" sentiment="success">Approve</Button>
<Badge variant="tertiary" sentiment="warning">Pending</Badge>
```

### Density System

Control spacing globally via a `data-density` attribute on any ancestor element. All components respond automatically - no props needed:

```tsx
<div data-density="high">
  <Button>Tight</Button>
  <Input placeholder="Compact" />
</div>
```

Three levels: `high`, `medium` (default), `low`.

### Dark Mode

Set `data-theme="dark"` on any ancestor. No provider, no JS - pure CSS:

```html
<body data-theme="dark">
  ...
</body>
```

### Theming

Tokens are three-tiered: raw palette (`--finra-color-*`) → semantic (`--finra-actionable-*`, `--finra-container-*`, `--finra-status-*`) → per-component (`--_*`). Override the semantic tier to retheme every component consistently:

```css
:root {
  --finra-actionable-accent: #2563eb;
  --finra-actionable-accent-hover: #1d4ed8;
  --finra-status-danger-accent: #dc2626;
  --finra-radius-md: 0.375rem;
}
```

### CSS Override Selectors

Every component renders a stable `data-finra-ui` attribute - the public selector API for targeted CSS overrides (hashed module classes are not):

```css
[data-finra-ui="button"] {
  text-transform: uppercase;
}

[data-finra-ui="dialog-overlay"] {
  backdrop-filter: blur(2px);
}
```

### Form Field Composition

`FormField` wires `id`, `aria-describedby`, `aria-invalid`, and `disabled` onto its child input via context:

```tsx
<FormField
  label="Email"
  required
  validationStatus="error"
  errorMessage="Please enter a valid email."
  helperText="We'll never share your email.">
  <Input placeholder="you@example.com" />
</FormField>
```

### Toasts

```tsx
import { Toaster, toast } from "@utk09/finra-ui";

// Render once near the app root
<Toaster position="bottom-end" />;

// Fire from anywhere
toast.success("Order filled");
toast.error("Connection lost");
```

### Minimal Runtime Dependencies

Runtime dependencies: `clsx`, `class-variance-authority`, `@floating-ui/dom`, and `@utk09/finra-ui-icons`. `react` / `react-dom` are peer dependencies.

## Exports

| Subpath                    | Contents                                        |
| -------------------------- | ----------------------------------------------- |
| `@utk09/finra-ui`          | Styled React components                         |
| `@utk09/finra-ui/unstyled` | Unstyled bases + overlay primitives             |
| `@utk09/finra-ui/utils`    | Framework-agnostic helpers (store, positioning) |
| `@utk09/finra-ui/styles`   | Global CSS (tokens + component styles)          |

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) at the repository root.

## License

[MIT](../../LICENSE)
