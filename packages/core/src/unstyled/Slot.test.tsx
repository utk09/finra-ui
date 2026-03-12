import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { Slot } from "./Slot";

describe("Slot", () => {
  describe("invalid children", () => {
    it("returns null when children is a string", () => {
      const { container } = render(<Slot>hello</Slot>);
      expect(container.innerHTML).toBe("");
    });

    it("returns null when children is null", () => {
      const { container } = render(<Slot>{null}</Slot>);
      expect(container.innerHTML).toBe("");
    });

    it("returns null when children is undefined", () => {
      const { container } = render(<Slot>{undefined}</Slot>);
      expect(container.innerHTML).toBe("");
    });

    it("returns null when children is a number", () => {
      const { container } = render(<Slot>{42}</Slot>);
      expect(container.innerHTML).toBe("");
    });
  });

  describe("valid children", () => {
    it("renders the child element", () => {
      render(
        <Slot>
          <button type="button">Click</button>
        </Slot>,
      );
      expect(screen.getByRole("button", { name: "Click" })).toBeInTheDocument();
    });

    it("forwards slot props to the child element", () => {
      render(
        <Slot aria-label="test" role="region">
          <div>content</div>
        </Slot>,
      );
      const el = screen.getByRole("region");
      expect(el).toHaveAttribute("aria-label", "test");
    });

    it("passes through non-overlapping props from both slot and child", () => {
      render(
        <Slot data-slot="from-slot">
          <div data-child="from-child">content</div>
        </Slot>,
      );
      const el = screen.getByText("content");
      expect(el).toHaveAttribute("data-slot", "from-slot");
      expect(el).toHaveAttribute("data-child", "from-child");
    });
  });

  describe("prop merging", () => {
    it("merges event handlers — child called first, then slot", async () => {
      const order: string[] = [];
      const slotHandler = vi.fn(() => order.push("slot"));
      const childHandler = vi.fn(() => order.push("child"));
      const user = userEvent.setup();

      render(
        <Slot onClick={slotHandler}>
          <button type="button" onClick={childHandler}>
            Click
          </button>
        </Slot>,
      );

      await user.click(screen.getByRole("button"));

      expect(childHandler).toHaveBeenCalledTimes(1);
      expect(slotHandler).toHaveBeenCalledTimes(1);
      expect(order).toEqual(["child", "slot"]);
    });

    it("merges className strings", () => {
      render(
        <Slot className="slot-class">
          <div className="child-class">content</div>
        </Slot>,
      );
      const el = screen.getByText("content");
      expect(el).toHaveClass("slot-class", "child-class");
    });

    it("merges style objects with child overriding slot for same keys", () => {
      render(
        <Slot style={{ color: "red", padding: "4px" }}>
          <div style={{ color: "blue", margin: "8px" }}>content</div>
        </Slot>,
      );
      const el = screen.getByText("content");
      expect(el).toHaveStyle({ color: "rgb(0, 0, 255)", padding: "4px", margin: "8px" });
    });

    it("child props override slot props for non-special keys", () => {
      render(
        <Slot aria-label="slot-label">
          <div aria-label="child-label">content</div>
        </Slot>,
      );
      expect(screen.getByText("content")).toHaveAttribute("aria-label", "child-label");
    });
  });

  describe("ref forwarding", () => {
    it("forwards ref to the child element", () => {
      const ref = createRef<HTMLButtonElement>();
      render(
        <Slot ref={ref}>
          <button type="button">Click</button>
        </Slot>,
      );
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.textContent).toBe("Click");
    });
  });
});
