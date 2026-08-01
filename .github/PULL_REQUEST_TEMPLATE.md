# What this changes

<!-- One or two sentences. What is different after this merges? -->

Closes #

## Why

<!--
The reasoning, not the diff. If this fixes a bug, what was the actual cause? If it adds an API, what could not be
built without it? Reviewers can read the code; they cannot read the thinking behind it.
-->

## Type

- [ ] Fix (a defect, with a test that fails without the change)
- [ ] Feature (new component, prop, or capability)
- [ ] Refactor (no behaviour change)
- [ ] Docs
- [ ] Build, CI, or tooling

## Behaviour change

- [ ] Nothing changes for existing users
- [ ] Behaviour changes in a way that is visible to users, described below
- [ ] Breaking change, described below with the migration

<!-- If either box above is ticked, say what moves and what a consumer has to do about it. -->

## Checks

- [ ] `pnpm verify` passes locally (lint, typecheck, coverage, build)
- [ ] Tests cover the new branches. Coverage is enforced per file at 85%, so an uncovered branch fails the push.
- [ ] For a bug fix: the test fails without the fix. Worth confirming by stashing the change and watching it go red.
- [ ] Exported types, props and functions carry documentation, including the gotchas.
- [ ] Storybook updated if the change is visible.
- [ ] Commits follow Conventional Commits.

## Accessibility

<!-- Delete if this is not a UI change. -->

- [ ] Reachable and operable by keyboard alone
- [ ] Focus goes somewhere sensible, and comes back
- [ ] Named for assistive tech, and state changes are announced
- [ ] Meaning is not carried by colour alone

## Notes for the reviewer

<!--
Anything that would otherwise cost them time. A decision you were unsure about, an alternative you rejected and
why, a file worth reading first, or something you deliberately left out of scope.
-->
