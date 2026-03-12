import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("renders a checkbox input", () => {
    render(<Checkbox aria-label="Accept" />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it('has data-finra-ui="checkbox" attribute', () => {
    render(<Checkbox aria-label="Accept" />);
    expect(screen.getByTestId("checkbox")).toBeInTheDocument();
  });

  it("forwards ref", () => {
    const ref = vi.fn();
    render(<Checkbox ref={ref} aria-label="Accept" />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it("renders label text", () => {
    render(<Checkbox label="Accept terms" />);
    expect(screen.getByText("Accept terms")).toBeInTheDocument();
  });

  it("does not render label span when label is not provided", () => {
    render(<Checkbox aria-label="Accept" />);
    expect(screen.queryByTestId("checkbox-label")).not.toBeInTheDocument();
  });

  it("toggles checked state on click", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<Checkbox aria-label="Accept" onChange={handleChange} />);
    const checkbox = screen.getByRole("checkbox");

    await user.click(checkbox);
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("can be controlled as checked", () => {
    render(<Checkbox aria-label="Accept" checked onChange={vi.fn()} />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("can be controlled as unchecked", () => {
    render(<Checkbox aria-label="Accept" checked={false} onChange={vi.fn()} />);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("applies disabled state", () => {
    render(<Checkbox aria-label="Accept" disabled />);
    expect(screen.getByRole("checkbox")).toBeDisabled();
    const wrapper = screen.getByTestId("checkbox");
    expect(wrapper.className).toMatch(/disabled/);
  });

  it("sets indeterminate DOM property", () => {
    render(<Checkbox aria-label="Accept" indeterminate />);
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.indeterminate).toBe(true);
  });

  it("sets data-indeterminate attribute when indeterminate", () => {
    render(<Checkbox aria-label="Accept" indeterminate />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("data-indeterminate");
  });

  it("clears indeterminate when prop changes to false", () => {
    const { rerender } = render(<Checkbox aria-label="Accept" indeterminate />);
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.indeterminate).toBe(true);

    rerender(<Checkbox aria-label="Accept" indeterminate={false} />);
    expect(checkbox.indeterminate).toBe(false);
  });

  it("applies custom className", () => {
    render(<Checkbox aria-label="Accept" className="my-class" />);
    const wrapper = screen.getByTestId("checkbox");
    expect(wrapper.className).toContain("my-class");
  });
});
