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

### Styled Components

| Component      | Description                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------- |
| `Button`       | Button with variant (primary/secondary/tertiary) and sentiment (danger/success/warning/info) |
| `IconButton`   | Icon-only button with `aria-label` requirement                                               |
| `ButtonGroup`  | Groups buttons with merged borders                                                           |
| `Input`        | Text input with variants, validation states, adornments, and clearable support               |
| `Textarea`     | Multi-line text input with character count and auto-resize                                   |
| `NumberInput`  | Numeric input with increment/decrement buttons                                               |
| `FormField`    | Wrapper that wires label, helper text, and error message with a11y attributes                |
| `Checkbox`     | Custom-styled checkbox with indeterminate support                                            |
| `Switch`       | Toggle switch (on/off)                                                                       |
| `RadioButton`  | Radio button for grouped exclusive selection                                                 |
| `Slider`       | Range slider with optional label and value display                                           |
| `PillInput`    | Tokenized tag/pill input with keyboard support                                               |
| `FileDropZone` | Drag-and-drop file upload zone                                                               |
| `Badge`        | Inline status/category label with variant and sentiment                                      |
| `Divider`      | Horizontal or vertical separator                                                             |

### Unstyled Components

Every styled component has an unstyled base that provides only behavior and accessibility - no visual styles. Import from the `/unstyled` entry point:

```tsx
import {
  ButtonBase,
  CheckboxBase,
  SwitchBase,
  RadioButtonBase,
  SliderBase,
  FormFieldBase,
  PillInputBase,
  FileDropZoneBase,
} from "@utk09/finra-ui/unstyled";
```

Available: `ButtonBase`, `IconButtonBase`, `InputBase`, `TextareaBase`, `NumberInputBase`, `CheckboxBase`, `SwitchBase`, `RadioButtonBase`, `SliderBase`, `FormFieldBase`, `PillInputBase`, `FileDropZoneBase`.

## Features

### Variants & Sentiments

Buttons and Badges support three **variants** and four **sentiments** that combine freely:

```tsx
<Button variant="primary" sentiment="danger">Delete</Button>
<Button variant="secondary" sentiment="success">Approve</Button>
<Badge variant="tertiary" sentiment="warning">Pending</Badge>
```

### Density System

Control spacing globally via a `data-density` attribute on any ancestor element. All components respond automatically - no props needed:

```tsx
{
  /* Compact UI for data-dense screens */
}
<div data-density="high">
  <Button>Tight</Button>
  <Input placeholder="Compact" />
</div>;

{
  /* Spacious UI */
}
<div data-density="low">
  <Button>Relaxed</Button>
</div>;
```

Three levels: `high`, `medium` (default), `low`.

### Theming

Override design tokens via CSS custom properties. Every component uses `--color-*`, `--radius-*`, `--font-*` tokens defined in the global styles:

```css
:root {
  --color-primary-600: #2563eb;
  --color-error: #dc2626;
  --radius-md: 0.375rem;
}
```

### CSS Override Selectors

Every component renders a stable `data-finra-ui` attribute for targeted CSS overrides:

```css
[data-finra-ui="button"] {
  text-transform: uppercase;
}

[data-finra-ui="input"] {
  min-height: 3rem;
}
```

### Form Field Composition

`FormField` automatically wires `id`, `aria-describedby`, `aria-invalid`, and `disabled` onto its child input:

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

### Zero External Runtime Dependencies

The only runtime dependencies are `clsx`, `class-variance-authority`, and `@utk09/finra-ui-icons`.

## Development

This is a pnpm monorepo with Turborepo.

```bash
# Install dependencies
pnpm install

# Run development (Storybook)
pnpm run dev

# Build the library
pnpm run build

# Run tests
pnpm run test

# Type check
pnpm run typecheck

# Lint
pnpm run lint

# All checks at once
pnpm run typecheck && pnpm run lint && pnpm run test
```

### Project Structure

```txt
packages/core/       - Core component library (@utk09/finra-ui)
packages/finance/    - Financial domain components (@utk09/finra-ui-finance)
packages/icons/      - Icon library (@utk09/finra-ui-icons)
apps/storybook/      - Storybook documentation app
apps/react-example-basic/    - E-commerce store demo
apps/react-example-advanced/ - Financial dashboard demo
```

## License

[MIT](LICENSE)
