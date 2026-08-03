# Contributing to Finra UI

Thanks for contributing! This guide covers everything you need to get a change from idea to merged PR.

## Prerequisites

- **Node 22** (`.nvmrc` is checked in - run `nvm use`)
- **pnpm ≥ 11** (repo pins `pnpm@11.18.0` via `packageManager`). The workspace uses `allowBuilds`, which pnpm 10 does not understand - on an older pnpm the approved build scripts are skipped and the install looks fine but is not.

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
config/              - shared Vite/Vitest config used by all three packages
plugins/             - custom GritQL lint rules (see plugins/README.md)
scripts/             - build helpers
```

This is a pnpm monorepo orchestrated by Turborepo. All dependency versions are centralized in the `pnpm-workspace.yaml` catalog - reference them with `"catalog:"` in package.json, never with a literal version.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Storybook dev server |
| `pnpm build` | Build all packages |
| `pnpm test` | Every package's `test` script, story tests included |
| `pnpm test:coverage` | Package unit tests with coverage (85% per-file threshold - a hard gate) |
| `pnpm test:stories` | Just the story `play` functions in real Chromium, plus the Storybook app's own unit tests |
| `pnpm typecheck` | TypeScript checks |
| `pnpm lint` / `pnpm lint:fix` | Biome + Prettier check / autofix (see Tooling below) |
| `pnpm verify` | `lint → typecheck → test:coverage → test:stories → build` - reproduces every CI/push gate; run before pushing |

`test:stories` drives a real browser, so it needs the Playwright binaries once per machine: `pnpm --filter @finra-ui/storybook exec playwright install --with-deps chromium`. The filter matters - `playwright` is a dependency of that package, not of the workspace root, so an unfiltered `pnpm exec` has no binary to find on a clean install.

**The story tests live in the root `vitest.config.ts`, not in a package.** It declares four projects: the two package suites, the Storybook app's own unit tests, and the browser project that runs every story. `apps/storybook`'s `test` script selects the latter two (`vitest run --root ../.. --project storybook-app --project stories`), which is what brings them under Turborepo and its cache. Without a `test` script there, `turbo test` walks straight past them. This is also where the accessibility gate lives: stories carry `a11y.test: "error"`, so an axe violation fails there and in no other command.

Because that script reaches outside its own package, `turbo.json` lists `../../vitest.config.ts` in the `test` task's `inputs`. `$TURBO_DEFAULT$` only sees the package directory, so without it an edit to the root config would be served a stale pass from cache.

## Tooling

**Two formatters, split by file type.** Biome owns `.ts .tsx .js .jsx .mjs .cjs .mts .cts .json .jsonc`; Prettier owns `.scss .css .md .mdx .yml .yaml .html`. Biome has no SCSS or Markdown support, which is the only reason both are present. `.prettierignore` excludes everything Biome owns, so the two never fight over a file.

Suppress a Biome rule with a single-line `// biome-ignore lint/<group>/<rule>: <reason>` immediately above the offending line - any comment in between silently breaks it, and the correct placement is per-rule (some attach to the element, some to the attribute). Custom GritQL rules use `lint/plugin/<name>`. `plugins/README.md` documents what the move from ESLint left uncovered.

**Builds emit declarations with `tsc`, not a bundler plugin.** Each package runs `vite build && tsc -p tsconfig.build.json && node ../../scripts/strip-style-imports.mjs dist`. The shared `tsconfig.build.json` sets `paths: {}` on purpose, so cross-package imports resolve through `node_modules` to built types rather than a sibling's source tree. Build order matters and Turborepo's `dependsOn: ["^build"]` handles it: icons, then core, then finance.

**Published output is one file per source module** (`preserveModules`). That is what makes the packages tree-shakeable - importing a single component pulls in that component, not the whole library. Anything in `dependencies` or `peerDependencies` is automatically external; do not add a package to `dependencies` and also expect it bundled.

## Git Hooks (installed automatically via husky)

- **pre-commit** - lint-staged, routing by extension: `biome check --write` on JS/TS/JSON, `prettier --write` on styles/markdown/YAML.
- **commit-msg** - commitlint enforces [Conventional Commits](https://www.conventionalcommits.org/): `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- **pre-push** - `pnpm test:coverage`. Coverage is enforced **per file** at 85% (statements/branches/functions/lines). A new untested branch in any file fails the push - write the covering test in the same change.

## Making a Change

1. Branch from `main`.
2. Implement, with tests and stories (see standards below).
3. Run `pnpm verify` locally.
4. Open a PR against `main`.

**Do not bump versions or edit any `CHANGELOG.md`.** Releases are cut by hand: a maintainer bumps the three `package.json` versions and writes the three changelog entries in one `chore: update version to X` commit. A version bump inside a feature PR conflicts with that and will be asked for removal.

What you write in the PR description is what the changelog entry gets written from, so a sentence explaining what changes for a consumer is worth more than a list of touched files.

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

- ESM only (`type: "module"`); TypeScript strict (TS 7, the native port); React 19; `react`/`react-dom` are peer dependencies.
- Modern CSS: logical properties, `gap`, `clamp()`, `:user-invalid`, `prefers-reduced-motion` guards on transitions. Browser floor: Safari ≥ 16.5.
- Follow official documentation when integrating third-party tools.

### Accessibility

- Target WCAG 2.2 AA; follow [APG patterns](https://www.w3.org/WAI/ARIA/apg/patterns/) for composite widgets.
- Roving-focus containers trip Biome's `a11y/noNoninteractiveTabindex` and `a11y/useSemanticElements` family: add `tabIndex={-1}` if the container legitimately receives focus (e.g. menu); otherwise add a `biome-ignore` with a one-line APG rationale. Never add `tabIndex` to a tablist. A tabpanel with no focusable content is the exception - APG requires `tabIndex={0}` there, and it is suppressed deliberately.

### Testing

- Vitest + Testing Library (+ user-event) in jsdom; Storybook `play` functions run in a separate real-browser project - they execute under `pnpm test` / `pnpm test:stories`, never under `turbo test` or a `--filter`ed coverage run.
- The test setup sets `testIdAttribute: "data-finra-ui"`, so `getByTestId("<component-id>")` addresses role-less roots. Never traverse off a queried node (`closest`, `parentElement`, `querySelector`) - the custom `no-node-access` GritQL rule is a hard error. Do not add separate `data-testid` attributes.
- Pure engines under `logic/` and `utils/` still run in jsdom. Splitting them out to the `node` environment was measured and made no difference to wall clock, because files already run in parallel and the critical path is the component tests.
- Portalled overlays with entrance animations: wrap visibility assertions in `waitFor` (real browsers race the fade).
- Use `toBeCloseTo` / `expect.closeTo` for floating-point assertions.

### Stories

- Every component gets Storybook stories covering its main states (default, controlled, disabled, validation, keyboard where relevant). Complex components add interaction tests via `play` functions.

## Submitting Issues

- **Bugs:** include repro steps (a Storybook link or minimal snippet), expected vs actual behavior, browser + package version.
- **Features:** describe the use case, not just the API you want; note comparable APIs in other libraries (Radix, React Aria, Salt, Carbon) if relevant.

## Pull Requests

- Keep PRs focused - one feature or fix per PR.
- Include tests and stories for new behavior. Leave versions and changelogs alone; a maintainer handles those at release time.
- CI must pass: lint + format check, typecheck, tests (jsdom + browser), build.
- A maintainer will review for architecture fit (unstyled/styled split, `logic/` extraction, token usage) as well as correctness. Expect requests to move logic or rename tokens - the conventions above are enforced.

## Code Review Guidelines (for reviewers)

- Verify behavior changes carry tests in the same PR (per-file coverage gate makes this mechanical).
- Check new styles use semantic tokens and density variables, not hard-coded values or raw palette steps.
- Check public API changes carry story updates, and that exported types, props and functions are documented including the gotchas.
- Prefer suggesting the established pattern over inventing a new one; if a new pattern is genuinely needed, it should land in this document in the same PR.
