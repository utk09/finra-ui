import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DismissableLayer } from "./DismissableLayer";

describe("DismissableLayer", () => {
  it("dismisses on Escape with reason 'escape'", () => {
    const onDismiss = vi.fn();
    render(
      <DismissableLayer onDismiss={onDismiss}>
        <button>inside</button>
      </DismissableLayer>,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalledWith("escape");
  });

  it("dismisses on an outside pointer with reason 'outside'", () => {
    const onDismiss = vi.fn();
    render(
      <>
        <button>outside</button>
        <DismissableLayer onDismiss={onDismiss}>
          <button>inside</button>
        </DismissableLayer>
      </>,
    );

    fireEvent.pointerDown(screen.getByText("outside"));
    expect(onDismiss).toHaveBeenCalledWith("outside");
  });

  it("does not dismiss on a pointer inside the layer", () => {
    const onDismiss = vi.fn();
    render(
      <DismissableLayer onDismiss={onDismiss}>
        <button>inside</button>
      </DismissableLayer>,
    );

    fireEvent.pointerDown(screen.getByText("inside"));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("respects disableEscape", () => {
    const onDismiss = vi.fn();
    render(
      <DismissableLayer onDismiss={onDismiss} disableEscape>
        <button>inside</button>
      </DismissableLayer>,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("Escape targets only the topmost layer", () => {
    const first = vi.fn();
    const second = vi.fn();
    render(
      <>
        <DismissableLayer onDismiss={first}>
          <button>first</button>
        </DismissableLayer>
        <DismissableLayer onDismiss={second}>
          <button>second</button>
        </DismissableLayer>
      </>,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(second).toHaveBeenCalledWith("escape");
    expect(first).not.toHaveBeenCalled();
  });
});
