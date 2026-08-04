import { render } from "@testing-library/react";
import { createRef, type ReactElement, type Ref } from "react";
import { expect, it } from "vitest";

/**
 * One component's ref contract: render it with a ref attached, and say which
 * native element that ref must end up holding.
 */
export interface RefCase {
  /** Name used for the generated test title. */
  name: string;
  /** Render the component with `ref` attached to it. */
  render: (ref: Ref<never>) => ReactElement;
  /** The constructor the populated ref must be an instance of. */
  expected: new () => HTMLElement;
}

/**
 * Assert that a component forwards its ref to a real DOM node.
 *
 * @remarks
 * `forwardRef` is easy to declare and easy to drop: a component that spreads
 * `...rest` onto its root but never attaches `ref` compiles, renders and passes
 * every behavioural test, while leaving the consumer's ref null forever. Only
 * reading the ref after mount catches it, which is why this asserts on the
 * populated node rather than on the component's shape.
 *
 * @param cases - The components to check, one generated `it` block each.
 */
export function describeRefForwarding(cases: RefCase[]): void {
  for (const testCase of cases) {
    it(`${testCase.name} forwards its ref to a ${testCase.expected.name}`, () => {
      const ref = createRef<never>();
      render(testCase.render(ref));
      expect(ref.current).toBeInstanceOf(testCase.expected);
    });
  }
}
