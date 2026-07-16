import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { FocusScope } from "./FocusScope";

describe("FocusScope", () => {
  it("moves focus to the first tabbable on mount", () => {
    render(
      <FocusScope>
        <button>first</button>
        <button>second</button>
      </FocusScope>,
    );
    expect(screen.getByText("first")).toHaveFocus();
  });

  it("wraps Tab from the last tabbable back to the first", () => {
    render(
      <FocusScope>
        <button>first</button>
        <button>last</button>
      </FocusScope>,
    );

    const last = screen.getByText("last");
    last.focus();
    fireEvent.keyDown(last, { key: "Tab" });
    expect(screen.getByText("first")).toHaveFocus();
  });

  it("wraps Shift+Tab from the first tabbable back to the last", () => {
    render(
      <FocusScope>
        <button>first</button>
        <button>last</button>
      </FocusScope>,
    );

    const first = screen.getByText("first");
    first.focus();
    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(screen.getByText("last")).toHaveFocus();
  });

  it("does not trap when trapped is false", () => {
    render(
      <FocusScope trapped={false} focusOnMount={false}>
        <button>first</button>
        <button>last</button>
      </FocusScope>,
    );

    const last = screen.getByText("last");
    last.focus();
    fireEvent.keyDown(last, { key: "Tab" });
    // No wrap: focus stays where the browser would leave it (unchanged here).
    expect(screen.getByText("last")).toHaveFocus();
  });

  it("restores focus to the previously focused element on unmount", () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(false)}>outside</button>
          <button onClick={() => setOpen(true)}>open</button>
          {open ? (
            <FocusScope>
              <button>inside</button>
            </FocusScope>
          ) : null}
        </>
      );
    }

    render(<Harness />);
    const outside = screen.getByText("outside");
    outside.focus();
    expect(outside).toHaveFocus();

    // Mount the scope: focus moves inside.
    fireEvent.click(screen.getByText("open"));
    expect(screen.getByText("inside")).toHaveFocus();

    // Unmount the scope: focus returns to where it was before.
    fireEvent.click(outside);
    expect(outside).toHaveFocus();
  });

  it("focuses the container itself when there are no tabbables", () => {
    render(
      <FocusScope data-finra-ui="scope">
        <span>no tabbables here</span>
      </FocusScope>,
    );
    expect(screen.getByTestId("scope")).toHaveFocus();
  });

  it("ignores non-Tab keys", () => {
    render(
      <FocusScope>
        <button>first</button>
        <button>last</button>
      </FocusScope>,
    );

    const first = screen.getByText("first");
    first.focus();
    fireEvent.keyDown(first, { key: "a" });
    expect(first).toHaveFocus();
  });

  it("does not move focus on an interior Tab", () => {
    render(
      <FocusScope>
        <button>first</button>
        <button>middle</button>
        <button>last</button>
      </FocusScope>,
    );

    const middle = screen.getByText("middle");
    middle.focus();
    fireEvent.keyDown(middle, { key: "Tab" });
    expect(middle).toHaveFocus();
  });

  it("skips focus restoration when restoreFocus is false", () => {
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button onClick={() => setOpen(false)}>close</button>
          {open ? (
            <FocusScope restoreFocus={false}>
              <button>inside</button>
            </FocusScope>
          ) : null}
        </>
      );
    }

    render(<Harness />);
    expect(screen.getByText("inside")).toHaveFocus();
    fireEvent.click(screen.getByText("close"));
    expect(screen.queryByText("inside")).not.toBeInTheDocument();
  });

  it("respects a provided tabIndex on the container", () => {
    render(
      <FocusScope data-finra-ui="scope" tabIndex={0} focusOnMount={false}>
        <button>x</button>
      </FocusScope>,
    );
    expect(screen.getByTestId("scope")).toHaveAttribute("tabindex", "0");
  });
});
