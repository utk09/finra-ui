import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Component, type ReactElement, type ReactNode, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorBoundary } from "./ErrorBoundary";

function Boom({ shouldThrow = true }: { shouldThrow?: boolean }): ReactElement {
  if (shouldThrow) throw new Error("boom");
  return <p>recovered</p>;
}

describe("ErrorBoundary", () => {
  // React logs a caught render error to the console; silence it so a passing
  // run stays readable, and restore afterwards so real errors still surface.
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children while nothing throws", () => {
    render(
      <ErrorBoundary>
        <p>content</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("renders the fallback instead of unmounting the whole tree", () => {
    render(
      <div>
        <p>sibling</p>
        <ErrorBoundary fallback={<p>something went wrong</p>}>
          <Boom />
        </ErrorBoundary>
      </div>,
    );

    expect(screen.getByText("something went wrong")).toBeInTheDocument();
    // The point of a boundary: the rest of the app is still standing.
    expect(screen.getByText("sibling")).toBeInTheDocument();
  });

  it("passes the error to a render-prop fallback", () => {
    render(
      <ErrorBoundary fallback={({ error }) => <p>caught: {error.message}</p>}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText("caught: boom")).toBeInTheDocument();
  });

  it("calls onError with the error", () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary fallback={<p>failed</p>} onError={onError}>
        <Boom />
      </ErrorBoundary>,
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect((onError.mock.calls[0][0] as Error).message).toBe("boom");
  });

  it("renders nothing by default rather than crashing the app", () => {
    const { container } = render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("reset lets the subtree render again", async () => {
    function Harness() {
      const [shouldThrow, setShouldThrow] = useState(true);
      return (
        <ErrorBoundary
          fallback={({ reset }) => (
            <button
              type="button"
              onClick={() => {
                setShouldThrow(false);
                reset();
              }}>
              retry
            </button>
          )}>
          <Boom shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    }

    const user = userEvent.setup();

    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "retry" }));

    expect(screen.getByText("recovered")).toBeInTheDocument();
  });

  it("catches an error thrown by a class child too", () => {
    class ClassBoom extends Component {
      render(): ReactNode {
        throw new Error("class boom");
      }
    }

    render(
      <ErrorBoundary fallback={({ error }) => <p>{error.message}</p>}>
        <ClassBoom />
      </ErrorBoundary>,
    );
    expect(screen.getByText("class boom")).toBeInTheDocument();
  });
});
