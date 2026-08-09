import { FINRA_UI_ATTR } from "@utk09/finra-ui";
import { configure } from "storybook/test";

/**
 * Story-test configuration. Test-only: it is loaded by the `stories` Vitest
 * project, never by `preview.tsx`, so the Storybook build carries no testing
 * library.
 *
 * Both package suites map `testIdAttribute` to the component id registry in
 * their own `test/setup.ts`. Without the same mapping here, `getByTestId` means
 * `data-testid` in a story and `data-finra-ui` in a unit test, so an identical
 * query passes in one project and finds nothing in the other.
 */
configure({ testIdAttribute: FINRA_UI_ATTR });
