# Biome plugins

Custom [GritQL](https://biomejs.dev/linter/plugins/) rules covering gaps left by the move from ESLint to Biome.

Registered in `biome.jsonc` under `plugins`, and scoped by the `overrides` blocks there.

## `no-node-access.grit`

Rebuilds `eslint-plugin-testing-library`'s `no-node-access`.

Biome has no testing-library rules at all. This is the one worth rebuilding: traversing off a queried node couples a test to the DOM shape rather than to what a user can perceive, so the test survives real breakage and fails on harmless refactors. It has caught real mistakes in this repo more than once.

Catches both forms:

- properties: `parentElement`, `parentNode`, `firstChild`, `lastChild`, `firstElementChild`, `lastElementChild`, `nextSibling`, `previousSibling`, `nextElementSibling`, `previousElementSibling`, `childNodes`, `children`
- methods: `closest()`, `querySelector()`, `querySelectorAll()`, `getElementsByTagName()`, `getElementsByClassName()`, `getElementById()`

Query again instead, with `within(...)` or `getByTestId` (the test setup maps `testIdAttribute` to `data-finra-ui`, so component roots are addressable without adding a `data-testid`).

## Suppressing a plugin diagnostic

Use the plugin-specific form, so the suppression cannot silently swallow a different plugin added later:

```ts
// biome-ignore lint/plugin/no-node-access: the backdrop has no accessible role, so it cannot be queried
const overlay = document.querySelector('[data-finra-ui="dialog-overlay"]');
```

The bare `lint/plugin` form works too but suppresses every plugin on that line. Biome reports an unused suppression if the name is wrong, which is how you can tell a suppression is actually doing something.

The full suppression vocabulary, for reference:

```ts
// biome-ignore lint: <explanation>
// biome-ignore assist: <explanation>
// biome-ignore syntax: <explanation>
// biome-ignore lint/suspicious: <explanation>
// biome-ignore lint/suspicious/noDebugger: <explanation>
// biome-ignore lint/plugin: <explanation>
// biome-ignore lint/plugin/<plugin-name>: <explanation>
// biome-ignore-all lint: <explanation>
// biome-ignore-start lint: <explanation>
// biome-ignore-end lint: <explanation>
```

A suppression must sit on the line immediately above the diagnostic, and the explanation must be on that same line. A multi-line `//` block between the comment and the code breaks it silently.

## Rules that were not rebuilt

These had ESLint coverage before and have none now. They are listed so the loss is visible rather than forgotten.

**`eslint-plugin-storybook/await-interactions`.** Catches a missing `await` on `userEvent` and `expect` calls inside a play function, where the assertion then runs before the interaction settles. Genuinely useful, since all 35 story files use play functions. Four GritQL formulations were tried: `not within`, `!within` and the bare-statement form all fail to compile, and `$call <: not within` compiles but matches nothing. Without a working negation the rule either flags every correct `await` call or flags nothing, and both are worse than no rule. Revisit when GritQL negation improves.

**The remaining `eslint-plugin-storybook` rules** (`story-exports`, `default-exports`, `prefer-pascal-case`, `no-redundant-story-name`, `hierarchy-separator`). These need file-level or cross-declaration analysis that GritQL does not express well, and they guard conventions rather than correctness.

**The remaining `eslint-plugin-testing-library` rules** beyond `no-node-access`, and the `@vitest/eslint-plugin` assertion-style preferences (`prefer-to-be`, `prefer-to-have-length`, `prefer-equality-matcher`, `no-standalone-expect`, `no-test-return-statement`). Biome's `test` domain covers the higher-value vitest rules already: focused and skipped tests, duplicate hooks, identical titles, hook ordering, exports in tests, and `it` versus `test` consistency.

## Writing another one

Probe it against a file that violates the rule _and_ a file that does not, before trusting it. A pattern that compiles is not a pattern that matches, and a plugin that silently matches nothing looks exactly like a clean codebase.
