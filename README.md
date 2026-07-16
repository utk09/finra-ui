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
packages/core/       - Core component library (@utk09/finra-ui)
packages/finance/    - Financial domain components (@utk09/finra-ui-finance)
packages/icons/      - Icon library (@utk09/finra-ui-icons)
apps/storybook/      - Storybook documentation app
apps/react-example-basic/    - E-commerce store demo
apps/react-example-advanced/ - Financial dashboard demo
```

## Publishing (npm; only for maintainers)

Releases are managed with [Changesets](https://github.com/changesets/changesets). Three packages publish to npm under the public `@utk09` scope:

- `@utk09/finra-ui`
- `@utk09/finra-ui-finance`
- `@utk09/finra-ui-icons`

`@finra-ui/storybook` and the example apps are private and never published.

### 1. Add a changeset

Every change that should ship a new version needs a changeset. Run this on the feature branch:

```bash
pnpm changeset
```

Pick the affected packages and the bump type (patch / minor / major), then write a short summary. This creates a markdown file in `.changeset/` - commit it with your change.

### 2. Automated release (not set up yet)

On every push to `main`, the [`Release` workflow](.github/workflows/release.yml) runs `changesets/action`:

1. If unreleased changesets exist, it opens (or updates) a **"Version Packages"** PR that bumps versions and updates changelogs.
2. Merging that PR triggers the workflow again, which builds and runs `pnpm run release` (`turbo build && changeset publish`) to publish the bumped packages to npm.

Packages publish with [npm provenance](https://docs.npmjs.com/generating-provenance-statements) (`NPM_CONFIG_PROVENANCE`).

**One-time setup:** add an npm automation token as the `NPM_TOKEN` repository secret (Settings → Secrets and variables → Actions). The token needs publish rights to the `@utk09` scope. The workflow already grants `id-token: write` for provenance.

### 3. Manual release (current setup)

To publish from your machine instead of CI:

```bash
# 1. Authenticate to npm (one-time; needs publish rights to @utk09)
npm login

# 2. Apply pending changesets - bumps versions, updates changelogs
pnpm changeset version

# 3. Review + commit the version bumps
git add . && git commit -m "chore: version packages"

# 4. Build all packages and publish
pnpm run release
```

`pnpm run release` builds via Turborepo first, then runs `changeset publish`, which only publishes packages whose version isn't already on npm.

## License

[MIT](LICENSE)
