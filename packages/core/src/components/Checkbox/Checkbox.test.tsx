import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("renders a checkbox input", () => {
    render(<Checkbox aria-label="Accept" />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it('has data-finra-ui="checkbox" attribute', () => {
    const { container } = render(<Checkbox aria-label="Accept" />);
    expect(container.querySelector('[data-finra-ui="checkbox"]')).toBeInTheDocument();
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
    const { container } = render(<Checkbox aria-label="Accept" />);
    // The outer label element is always rendered, but there should be no inner label span
    const spans = container.querySelectorAll("span");
    // Only the indicator span, no label span
    const labelSpans = Array.from(spans).filter((s) => !s.getAttribute("aria-hidden"));
    expect(labelSpans).toHaveLength(0);
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
    const { container } = render(<Checkbox aria-label="Accept" disabled />);
    expect(screen.getByRole("checkbox")).toBeDisabled();
    const wrapper = container.querySelector('[data-finra-ui="checkbox"]');
    expect(wrapper?.className).toMatch(/disabled/);
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
    const { container } = render(<Checkbox aria-label="Accept" className="my-class" />);
    const wrapper = container.querySelector('[data-finra-ui="checkbox"]');
    expect(wrapper?.className).toContain("my-class");
  });
});
