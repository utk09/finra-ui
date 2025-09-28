# Finra UI

Professional React component library for finance applications.

[![CI](https://github.com/utk09/finra-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/utk09/finra-ui/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@utk09/finra-ui.svg)](https://www.npmjs.com/package/@utk09/finra-ui)
[![Storybook](https://img.shields.io/badge/Storybook-deployed-ff4785)](https://finra-ui.netlify.app)

## Installation

```bash
npm install @utk09/finra-ui
```

## Usage

### Styled Components

```tsx
import { Button } from "@utk09/finra-ui";
import "@utk09/finra-ui/styles";

function App() {
  return (
    <Button variant="primary" size="md">
      Click me
    </Button>
  );
}
```

### Unstyled Components

```tsx
import { ButtonBase } from "@utk09/finra-ui/unstyled";

function App() {
  return <ButtonBase className="my-custom-button">Click me</ButtonBase>;
}
```

## Development

This project uses `pnpm` for package management.

```bash
# Install dependencies
pnpm install

# Run development server for all packages
pnpm run dev

# Run tests for all packages
pnpm run test

# Run Storybook
pnpm run dev --filter @finra-ui/storybook

# Build all packages
pnpm run build

# Create a new changeset for versioning
pnpm run changeset

# Commit your changes following conventional commits
git commit -m "feat: add new component"
```

## License

MIT
