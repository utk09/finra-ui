# Contributing to Finra UI

Thanks for contributing! This guide covers everything you need to get a change from idea to merged PR.

## Prerequisites

- **Node 22** (`.nvmrc` is checked in - run `nvm use`)
- **pnpm ≥ 10** (repo pins `pnpm@10.32.1` via `packageManager`)

## Getting Started

```bash
git clone https://github.com/utk09/finra-ui.git
cd finra-ui
nvm use
pnpm install
pnpm dev        # starts Storybook - the primary development environment
```

## Repository Layout

```txt
packages/core/       - @utk09/finra-ui          core components, tokens, styles
packages/finance/    - @utk09/finra-ui-finance  financial domain components
packages/icons/      - @utk09/finra-ui-icons    SVG icon data + React wrappers
apps/storybook/      - Storybook docs app (deployed to finra-ui.netlify.app)
apps/react-example-basic/    - e-commerce demo app
apps/react-example-advanced/ - financial dashboard demo app
```

This is a pnpm monorepo orchestrated by Turborepo. All dependency versions are centralized in the `pnpm-workspace.yaml` catalog - reference them with `"catalog:"` in package.json, never with a literal version.

## Scripts

| Command                       | What it does                                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| `pnpm dev`                    | Storybook dev server                                                                           |
| `pnpm build`                  | Build all packages                                                                             |
| `pnpm test`                   | Full test suite (includes the browser-based Storybook project)                                 |
| `pnpm test:coverage`          | Unit tests with coverage (85% per-file threshold - a hard gate)                                |
| `pnpm typecheck`              | TypeScript checks                                                                              |
| `pnpm lint` / `pnpm lint:fix` | ESLint (flat config at root) / autofix + Prettier                                              |
| `pnpm verify`                 | `lint → typecheck → test:coverage → build` - reproduces every CI/push gate; run before pushing |

## Git Hooks (installed automatically via husky)

- **pre-commit** - lint-staged: ESLint `--fix` + Prettier on staged files.
- **commit-msg** - commitlint enforces [Conventional Commits](https://www.conventionalcommits.org/): `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- **pre-push** - `pnpm test:coverage`. Coverage is enforced **per file** at 85% (statements/branches/functions/lines). A new untested branch in any file fails the push - write the covering test in the same change.

## Making a Change

1. Branch from `main`.
2. Implement, with tests and stories (see standards below).
3. If the change affects a published package, add a changeset: `pnpm changeset` (pick packages + bump type, write a short summary, commit the generated file).
4. Run `pnpm verify` locally.
5. Open a PR against `main`.

## Coding Standards

### Architecture

- **Unstyled + styled layers.** Every component ships an unstyled base (behavior + accessibility only, `classNames`/render-prop hooks) and a styled wrapper (CVA + SCSS modules + design tokens). New overlay components use the compound API pattern (`Dialog` / `DialogTrigger` / `DialogContent`); existing monolithic APIs stay as they are.
- **Behavior lives in `logic/`.** New stateful components put state transitions and keyboard handling in framework-agnostic modules (`logic/*.ts`, pure functions or the `createStore` contract); React components are thin adapters. This keeps a future Lit migration an adapter-writing exercise. Trivial wrappers over native inputs are exempt.
- **No provider.** Theme and density are pure CSS via `data-theme` / `data-density` attributes. Components have no `size` prop - sizing comes from the density system.
- **Variant vs sentiment.** `variant` = emphasis (primary/secondary/tertiary); `sentiment` = color meaning (danger/success/warning/info). They are orthogonal.
- **Tokens.** Components reference the semantic tier (`--finra-actionable-*`, `--finra-container-*`, `--finra-status-*`) through internal `--_*` component tokens - never raw palette steps (`--finra-color-primary-600`). Dark mode remaps the semantic tier only.
- **Stable selectors.** Every component root gets `data-finra-ui="{name}"`, registered in `componentIds.ts`. That attribute is the public CSS override API.
- **No cross-entry re-exports.** Never re-export a symbol from one entry point to another; fix imports to point at the canonical location. The package's own public barrels (`index.ts`, `unstyled.ts`, `utils.ts`) re-exporting from source modules is the canonical pattern.
- **Business logic is injected.** Finance components accept parsers, formatters, calendars, and metadata as props/adapters - never hard-code market conventions, holidays, or instrument rules.

### Code

- ESM only (`type: "module"`); TypeScript strict; React 19; `react`/`react-dom` are peer dependencies.
- Modern CSS: logical properties, `gap`, `clamp()`, `:user-invalid`, `prefers-reduced-motion` guards on transitions. Browser floor: Safari ≥ 16.5.
- Follow official documentation when integrating third-party tools.

### Accessibility

- Target WCAG 2.2 AA; follow [APG patterns](https://www.w3.org/WAI/ARIA/apg/patterns/) for composite widgets.
- `jsx-a11y/interactive-supports-focus` on roving-focus containers: add `tabIndex={-1}` if the container legitimately receives focus (e.g. menu); otherwise add an eslint-disable with a one-line APG rationale. Never add `tabIndex` to a tablist.

### Testing

- Vitest + Testing Library (+ user-event) in jsdom; Storybook `play` functions run in a separate real-browser project - they only execute under the full `pnpm test`, not under `--filter`ed coverage runs.
- The test setup sets `testIdAttribute: "data-finra-ui"`, so `getByTestId("<component-id>")` addresses role-less roots. Never traverse off a queried node (`closest`, `parentElement`, `querySelector`) - `testing-library/no-node-access` is a hard error. Do not add separate `data-testid` attributes.
- Portalled overlays with entrance animations: wrap visibility assertions in `waitFor` (real browsers race the fade).
- Use `toBeCloseTo` / `expect.closeTo` for floating-point assertions.

### Stories

- Every component gets Storybook stories covering its main states (default, controlled, disabled, validation, keyboard where relevant). Complex components add interaction tests via `play` functions.

## Submitting Issues

- **Bugs:** include repro steps (a Storybook link or minimal snippet), expected vs actual behavior, browser + package version.
- **Features:** describe the use case, not just the API you want; note comparable APIs in other libraries (Radix, React Aria, Salt, Carbon) if relevant.

## Pull Requests

- Keep PRs focused - one feature or fix per PR.
- Include tests and stories for new behavior; include a changeset for anything that ships.
- CI must pass: lint + format check, typecheck, tests (jsdom + browser), build.
- A maintainer will review for architecture fit (unstyled/styled split, `logic/` extraction, token usage) as well as correctness. Expect requests to move logic or rename tokens - the conventions above are enforced.

## Code Review Guidelines (for reviewers)

- Verify behavior changes carry tests in the same PR (per-file coverage gate makes this mechanical).
- Check new styles use semantic tokens and density variables, not hard-coded values or raw palette steps.
- Check public API changes have a changeset and story updates.
- Prefer suggesting the established pattern over inventing a new one; if a new pattern is genuinely needed, it should land in this document in the same PR.
