import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ButtonBase } from "./Button";

describe("ButtonBase", () => {
  it("renders a button element by default", () => {
    render(<ButtonBase>Click</ButtonBase>);
    expect(screen.getByRole("button", { name: /click/i })).toBeInTheDocument();
  });

  it("renders as Slot when asChild is true", () => {
    render(
      <ButtonBase asChild>
        <a href="/home">Home</a>
      </ButtonBase>,
    );
    const link = screen.getByRole("link", { name: /home/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/home");
  });

  it("forwards ref when asChild is false", () => {
    const ref = vi.fn();
    render(<ButtonBase ref={ref}>Click</ButtonBase>);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
  });

  it("forwards ref when asChild is true", () => {
    const ref = vi.fn();
    render(
      <ButtonBase ref={ref} asChild>
        <a href="/home">Home</a>
      </ButtonBase>,
    );
    expect(ref).toHaveBeenCalled();
  });

  it("passes props through to button element", () => {
    render(<ButtonBase disabled>Click</ButtonBase>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("passes props through to child when asChild", () => {
    render(
      <ButtonBase asChild aria-pressed="true">
        <button type="submit">Submit</button>
      </ButtonBase>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveAttribute("type", "submit");
  });
});
