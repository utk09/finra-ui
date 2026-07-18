# Finra UI

React component library for financial and general-purpose web applications.

[![CI](https://github.com/utk09/finra-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/utk09/finra-ui/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@utk09/finra-ui.svg)](https://www.npmjs.com/package/@utk09/finra-ui)
[![Storybook](https://img.shields.io/badge/Storybook-deployed-ff4785)](https://finra-ui.netlify.app)

## Live Demo

Browse all components with interactive examples: **[finra-ui.netlify.app](https://finra-ui.netlify.app)**

## Packages

| Package                                                 | Description                                                                                                                                 |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| [`@utk09/finra-ui`](packages/core/README.md)            | Core components - buttons, inputs, forms, overlays (Dialog, Tooltip, Popover, Select, Menu, Toast), Tabs, ComboBox, and unstyled primitives |
| [`@utk09/finra-ui-finance`](packages/finance/README.md) | Financial domain components - Calendar, DateInput, TenorInput, DateTenorPicker, PriceInput - plus parsing/formatting utilities              |
| [`@utk09/finra-ui-icons`](packages/icons/README.md)     | SVG icons as framework-agnostic data objects + React components                                                                             |

## Installation

```bash
# Core components
npm install @utk09/finra-ui

# Financial components (peer-depends on core + icons)
npm install @utk09/finra-ui-finance @utk09/finra-ui @utk09/finra-ui-icons

# Icons only
npm install @utk09/finra-ui-icons
```

## Quick Start

Import the global styles **once** at the root of your app, then use any component:

```tsx
import "@utk09/finra-ui/styles";
import { Button, Input, Dialog, DialogTrigger, DialogContent } from "@utk09/finra-ui";
import { PriceInput, DateTenorPicker } from "@utk09/finra-ui-finance";

function App() {
  return (
    <div>
      <Button variant="primary">Trade</Button>
      <PriceInput aria-label="Price" instrument={{ primaryPrecision: 4, precisionDigits: 1 }} />
      <DateTenorPicker aria-label="Value date" />
    </div>
  );
}
```

## Highlights

- **Styled + unstyled layers** - every component has an unstyled base (`/unstyled` entry) with behavior and accessibility only; bring your own styles.
- **No provider** - theme and density are pure CSS via `data-theme` / `data-density` attributes; works with SSR and any framework boundary.
- **Design tokens** - three-tier token system (`--finra-*`); dark mode remaps the semantic tier only.
- **Stable CSS hooks** - every component renders a `data-finra-ui="{name}"` attribute for targeted overrides.
- **Financial behaviour, not business logic** - finance components take parsers, calendars, and instrument metadata as injectable adapters.
- **Modern stack** - ESM-only, React 19, TypeScript strict, `"use client"` banners for Next.js App Router.

## Documentation

- [Storybook](https://finra-ui.netlify.app) - all components, props, and interactive examples
- Per-package READMEs: [core](packages/core/README.md) · [finance](packages/finance/README.md) · [icons](packages/icons/README.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, coding standards, and the PR process.
Maintainer processes (releases, versioning, escalation) live in [MAINTAINERS.md](MAINTAINERS.md).

## License

[MIT](LICENSE)
