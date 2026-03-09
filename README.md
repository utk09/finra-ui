# Finra UI

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
packages/core/     - Component library (@utk09/finra-ui)
apps/storybook/    - Storybook documentation app
```

## License

[MIT](LICENSE)
