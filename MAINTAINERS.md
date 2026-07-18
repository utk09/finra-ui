# Maintainers Guide

Operational guide for current and future maintainers of finra-ui.

## Core Maintainers

| Name  | GitHub                             | Role            |
| ----- | ---------------------------------- | --------------- |
| utk09 | [@utk09](https://github.com/utk09) | Lead maintainer |

## Escalation

- **Critical issues** (broken published release, security report): open a GitHub issue with the `critical` label and mention `@utk09`. Security reports should use [GitHub private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories) rather than a public issue.
- If a published version is broken, prefer publishing a patched version over `npm unpublish` (unpublish breaks downstream lockfiles; npm restricts it after 72 hours anyway). `npm deprecate` the broken version with a pointer to the fix.

## Responsibilities

- Review and merge PRs; keep CI green on `main`.
- Triage issues (labels, repro confirmation, close-or-schedule decisions).
- Cut releases via Changesets and keep changelogs meaningful.
- Keep the dependency catalog current and the docs in sync with shipped behavior.
- Guard the architecture: unstyled/styled split, `logic/` extraction, semantic tokens, no cross-entry re-exports (see [CONTRIBUTING.md](CONTRIBUTING.md)).

## Managing Issues

- Triage new issues within a week: label (`bug` / `feature` / `docs` / `question` / `critical`), ask for a repro if missing, close duplicates with a link.
- Confirmed bugs get a failing-test description or Storybook repro noted in the issue before anyone starts a fix.
- Feature requests are evaluated against the project principles: financial behaviour in components, business logic injected; compare against Radix / React Aria / Salt / Carbon before inventing new API shapes.

## Managing Pull Requests

- Require green CI (lint + format, typecheck, jsdom + browser tests, build) before review effort.
- Check the contribution checklist: tests in the same PR (per-file 85% coverage makes this mechanical), stories for new behavior, a changeset for anything that publishes.
- Squash-merge with a conventional-commit title (commitlint types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`).
- Architecture review points are listed in [CONTRIBUTING.md → Code Review Guidelines](CONTRIBUTING.md#code-review-guidelines-for-reviewers).

## Updating Documentation

- **Storybook** (finra-ui.netlify.app) deploys from Netlify; it is the primary consumer-facing documentation. Stories are part of the definition of done for component changes.
- **READMEs**: root + per-package READMEs are consumer-facing - update component tables and export lists when the public API changes.
- **PLAN.md** tracks phase/epic status - update status markers when work lands.
- **CONTRIBUTING.md** is the source of truth for conventions - if a review establishes a new pattern, land it there in the same PR.

## Updating Dependencies

- All versions live in the **`pnpm-workspace.yaml` catalog**. Bump there; packages reference `"catalog:"`.
- After bumping: `pnpm install`, then `pnpm verify` (lint → typecheck → test:coverage → build). Run the full `pnpm test` too - Storybook `play` tests run in a real browser and catch what jsdom misses.
- Major upgrades of build-critical tools (Vite, Vitest, Storybook, TypeScript, ESLint) get their own PR with a changeset only if build output changes.
- Runtime dependency additions to published packages are rare and deliberate (current set: `clsx`, `class-variance-authority`, `@floating-ui/dom`). New runtime deps need a written justification in the PR (see `@floating-ui/dom` precedent in PLAN.md).
- Node version is pinned in `.nvmrc` (22) and mirrored in CI and Netlify - bump all three together.

## Versioning

- Semver via [Changesets](https://github.com/changesets/changesets). Every user-facing change carries a changeset chosen at PR time:
  - **patch** - bug fixes, internal refactors that alter published output
  - **minor** - new components, props, or exports
  - **major** - breaking API/token/selector changes (avoid; the `data-finra-ui` attributes and semantic tokens are public API)
- The three published packages (`@utk09/finra-ui`, `@utk09/finra-ui-finance`, `@utk09/finra-ui-icons`) version independently; changesets handles peer-dependency bumps across them.
- `@finra-ui/storybook` and the example apps are private and never published.

## Publishing to npm

Releases are managed with Changesets under the public `@utk09` scope.

### Automated release (preferred, once `NPM_TOKEN` is configured)

On every push to `main`, the [`Release` workflow](.github/workflows/release.yml) runs `changesets/action`:

1. If unreleased changesets exist, it opens/updates a **"Version Packages"** PR that bumps versions and updates changelogs.
2. Merging that PR triggers the workflow again, which runs `pnpm run release` (`turbo build && changeset publish`) to publish to npm.

Packages publish with [npm provenance](https://docs.npmjs.com/generating-provenance-statements) (`NPM_CONFIG_PROVENANCE`; workflow grants `id-token: write`).

**One-time setup:** add an npm automation token with publish rights to the `@utk09` scope as the `NPM_TOKEN` repository secret (Settings → Secrets and variables → Actions).

### Manual release (current setup)

```bash
# 1. Authenticate (one-time; needs publish rights to @utk09)
npm login

# 2. Apply pending changesets - bumps versions, updates changelogs
pnpm changeset version

# 3. Review + commit the version bumps
git add . && git commit -m "chore: version packages"

# 4. Build all packages and publish
pnpm run release
```

`pnpm run release` builds via Turborepo first, then runs `changeset publish`, which only publishes packages whose version isn't already on npm.

### Post-release checklist

- Verify the new versions on npm and that `npm pack --dry-run` output looked sane (no stray files).
- Smoke-test an install in a scratch app (ESM import + `/styles` import).
- Confirm Storybook redeployed if the release changed components.
