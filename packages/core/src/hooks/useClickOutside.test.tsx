import { fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { useClickOutside } from "./useClickOutside";

function TestComponent({
  onClickOutside,
  enabled,
}: {
  onClickOutside: () => void;
  enabled: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onClickOutside, enabled);
  return (
    <div>
      <div ref={ref}>Inside</div>
      <div>Outside</div>
    </div>
  );
}

describe("useClickOutside", () => {
  it("calls handler when clicking outside the ref element", () => {
    const handler = vi.fn();
    render(<TestComponent onClickOutside={handler} enabled={true} />);

    fireEvent.mouseDown(screen.getByText("Outside"));
    expect(handler).toHaveBeenCalledOnce();
  });

  it("does not call handler when clicking inside the ref element", () => {
    const handler = vi.fn();
    render(<TestComponent onClickOutside={handler} enabled={true} />);

    fireEvent.mouseDown(screen.getByText("Inside"));
    expect(handler).not.toHaveBeenCalled();
  });

  it("does not call handler when disabled", () => {
    const handler = vi.fn();
    render(<TestComponent onClickOutside={handler} enabled={false} />);

    fireEvent.mouseDown(screen.getByText("Outside"));
    expect(handler).not.toHaveBeenCalled();
  });

  it("cleans up listener on unmount", () => {
    const handler = vi.fn();
    const { unmount } = render(<TestComponent onClickOutside={handler} enabled={true} />);

    unmount();
    fireEvent.mouseDown(document.body);
    expect(handler).not.toHaveBeenCalled();
  });

  it("cleans up listener when enabled changes to false", () => {
    const handler = vi.fn();
    const { rerender } = render(<TestComponent onClickOutside={handler} enabled={true} />);

    rerender(<TestComponent onClickOutside={handler} enabled={false} />);
    fireEvent.mouseDown(document.body);
    expect(handler).not.toHaveBeenCalled();
  });
});
