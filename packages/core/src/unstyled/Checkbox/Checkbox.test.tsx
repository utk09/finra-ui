import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CheckboxBase } from "./Checkbox";

describe("CheckboxBase", () => {
  it("renders a checkbox input", () => {
    render(<CheckboxBase aria-label="Accept" />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("sets indeterminate when prop is true", () => {
    render(<CheckboxBase aria-label="Accept" indeterminate />);
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.indeterminate).toBe(true);
  });

  it("clears indeterminate when prop is false", () => {
    const { rerender } = render(<CheckboxBase aria-label="Accept" indeterminate />);
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.indeterminate).toBe(true);

    rerender(<CheckboxBase aria-label="Accept" indeterminate={false} />);
    expect(checkbox.indeterminate).toBe(false);
  });

  it("defaults to indeterminate=false when prop is undefined", () => {
    render(<CheckboxBase aria-label="Accept" />);
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.indeterminate).toBe(false);
  });

  it("passes through additional input props", () => {
    render(<CheckboxBase aria-label="Accept" disabled />);
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });
});
