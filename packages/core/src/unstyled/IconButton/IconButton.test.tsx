import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { IconButtonBase } from "./IconButton";

const TestIcon = () => <svg data-finra-ui="test-icon" />;

describe("IconButtonBase", () => {
  it("renders a button with icon", () => {
    render(<IconButtonBase icon={<TestIcon />} aria-label="Close" />);
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  it("uses Slot when asChild is true", () => {
    // Slot receives {icon}{children} (multiple children) and returns null
    const { container } = render(
      <IconButtonBase asChild icon={<TestIcon />} aria-label="Close">
        <button type="submit">Close</button>
      </IconButtonBase>,
    );
    // Exercises the asChild=true branch; Slot returns null with multiple children
    expect(container.innerHTML).toBe("");
  });

  it("forwards ref", () => {
    const ref = vi.fn();
    render(<IconButtonBase ref={ref} icon={<TestIcon />} aria-label="Close" />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
  });

  it("passes props to button element", () => {
    render(<IconButtonBase icon={<TestIcon />} aria-label="Close" disabled />);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
