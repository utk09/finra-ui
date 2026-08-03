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
- Cut releases by hand and keep changelogs meaningful.
- Keep the dependency catalog current and the docs in sync with shipped behavior.
- Guard the architecture: unstyled/styled split, `logic/` extraction, semantic tokens, no cross-entry re-exports (see [CONTRIBUTING.md](CONTRIBUTING.md)).

## Managing Issues

- Triage new issues within a week: label (`bug` / `feature` / `docs` / `question` / `critical`), ask for a repro if missing, close duplicates with a link.
- Confirmed bugs get a failing-test description or Storybook repro noted in the issue before anyone starts a fix.
- Feature requests are evaluated against the project principles: financial behaviour in components, business logic injected; compare against Radix / React Aria / Salt / Carbon before inventing new API shapes.

## Managing Pull Requests

- Require green CI (lint + format, typecheck, jsdom + browser tests, build) before review effort.
- Check the contribution checklist: tests in the same PR (per-file 85% coverage makes this mechanical), stories for new behavior, and no version or changelog edits.
- Squash-merge with a conventional-commit title (commitlint types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`).
- Architecture review points are listed in [CONTRIBUTING.md → Code Review Guidelines](CONTRIBUTING.md#code-review-guidelines-for-reviewers).

## Updating Documentation

- **Storybook** (finra-ui.netlify.app) deploys from Netlify; it is the primary consumer-facing documentation. Stories are part of the definition of done for component changes.
- **READMEs**: root + per-package READMEs are consumer-facing - update component tables and export lists when the public API changes.
- **CONTRIBUTING.md** is the source of truth for conventions - if a review establishes a new pattern, land it there in the same PR.

## Updating Dependencies

- All versions live in the **`pnpm-workspace.yaml` catalog**. Bump there; packages reference `"catalog:"`.
- After bumping: `pnpm install`, then `pnpm verify` (lint → typecheck → test:coverage → test:stories → build). `test:stories` is the real-browser pass over every story, and catches what jsdom misses.
- Major upgrades of build-critical tools (Vite, Vitest, Storybook, TypeScript, Biome) get their own PR, and a changelog entry at release time only if build output changes.
- Runtime dependency additions to published packages are rare and deliberate (current set: `clsx`, `class-variance-authority`, `@floating-ui/dom`). New runtime deps need a written justification in the PR: what it buys, why it cannot be a devDependency, and its bundle cost. Anything listed in `dependencies` or `peerDependencies` is externalised from the bundle automatically, so a new runtime dep becomes something the consumer installs.
- Node version is pinned in `.nvmrc` (22) and mirrored in CI and Netlify - bump all three together. The pnpm floor is 11 (`allowBuilds` in `pnpm-workspace.yaml` is not understood by pnpm 10).

## Versioning

- Semver, decided by the maintainer at release time rather than per PR:
  - **patch** - bug fixes, internal refactors that alter published output
  - **minor** - new components, props, or exports
  - **major** - breaking API/token/selector changes (avoid; the `data-finra-ui` attributes and semantic tokens are public API)
- The three published packages (`@utk09/finra-ui`, `@utk09/finra-ui-finance`, `@utk09/finra-ui-icons`) are currently kept in lockstep: all three carry the same version and are released together, whether or not each one changed. That keeps the peer-dependency ranges trivially satisfiable, at the cost of publishing no-op versions.
- Contributors do not bump versions or write changelog entries. If a PR contains either, ask for it to be removed.
- `@finra-ui/storybook` and the example apps are private and never published.

## Publishing to npm

Releases are cut by hand under the public `@utk09` scope. There is no release workflow and no automation.

### How a release actually happens

```bash
# 1. Authenticate (one-time; needs publish rights to @utk09)
npm login

# 2. Confirm main is green and clean
git switch main && git pull
pnpm verify

# 3. Edit the three package.json versions by hand, keeping them identical

# 4. Write the three CHANGELOG.md entries by hand, newest first

# 5. Commit both together, in one commit
git add . && git commit -m "chore: update version to X.Y.Z"

# 6. Build, then publish each package
pnpm build
pnpm --filter @utk09/finra-ui publish --access public
pnpm --filter @utk09/finra-ui-icons publish --access public
pnpm --filter @utk09/finra-ui-finance publish --access public
```

Publish icons before finance, since finance peer-depends on it.

### About Changesets

`@changesets/cli` is installed and `pnpm changeset` / `pnpm run release` are wired up, but **the tool is not in use**: no changeset file has ever been committed, and every release so far has been hand-written as above. Treat the scripts as unused scaffolding. Either adopt Changesets properly, in which case this section and the contributor guide both need rewriting, or remove the dependency. Leaving it half-wired is what caused the contributor guide to document a flow nobody follows.

### Known gap

Publishing is manual, so it depends on one person's local machine and npm credentials, and the published artifact is not attested. Adding a release workflow with an `NPM_TOKEN` secret and [npm provenance](https://docs.npmjs.com/generating-provenance-statements) would fix both. Not done yet.

### Post-release checklist

- Verify the new versions on npm and that `npm pack --dry-run` output looked sane (no stray files - the tarball should contain only `dist/`, `LICENSE`, `NOTICE`, `README.md`, `CHANGELOG.md` and `package.json`).
- **A high file count is expected, not a packaging bug.** Packages build one output file per source module so consumers can tree-shake to a single component. At 0.3.0 that is roughly 184 files for core, 90 for finance and 262 for icons.
- Smoke-test an install in a scratch app (ESM import + `/styles` import).
- Confirm Storybook redeployed if the release changed components.
