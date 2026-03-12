import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NumberInputBase } from "./NumberInput";

describe("NumberInputBase", () => {
  it("renders an input with decimal inputMode", () => {
    render(<NumberInputBase aria-label="Amount" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("inputmode", "decimal");
  });

  it("forwards ref", () => {
    const ref = vi.fn();
    render(<NumberInputBase ref={ref} aria-label="Amount" />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it("renders as Slot when asChild is true", () => {
    render(
      <NumberInputBase asChild aria-label="Amount">
        <input type="text" placeholder="Enter amount" />
      </NumberInputBase>,
    );
    const input = screen.getByPlaceholderText("Enter amount");
    expect(input).toHaveAttribute("aria-label", "Amount");
    expect(input).toHaveAttribute("inputmode", "decimal");
  });

  it("passes props through", () => {
    render(<NumberInputBase aria-label="Amount" disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});
