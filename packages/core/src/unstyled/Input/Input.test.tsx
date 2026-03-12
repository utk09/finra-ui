import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InputBase } from "./Input";

describe("InputBase", () => {
  it("renders an input element by default", () => {
    render(<InputBase aria-label="Name" />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("forwards ref", () => {
    const ref = vi.fn();
    render(<InputBase ref={ref} aria-label="Name" />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it("renders as Slot when asChild is true", () => {
    render(
      <InputBase asChild aria-label="Name">
        <input type="email" placeholder="Email" />
      </InputBase>,
    );
    const input = screen.getByPlaceholderText("Email");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("aria-label", "Name");
  });

  it("passes props through", () => {
    render(<InputBase aria-label="Name" disabled placeholder="Enter name" />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("placeholder", "Enter name");
  });
});
