import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NumberInput } from "./NumberInput";

describe("NumberInput", () => {
  it('renders with data-finra-ui="number-input"', () => {
    render(<NumberInput aria-label="Quantity" />);
    expect(screen.getByTestId("number-input")).toBeInTheDocument();
  });

  it("renders increment and decrement buttons", () => {
    render(<NumberInput aria-label="Quantity" />);
    expect(screen.getByRole("button", { name: /increment/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /decrement/i })).toBeInTheDocument();
  });

  it("increments value on click", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<NumberInput aria-label="Quantity" defaultValue={5} onChange={handleChange} />);
    await user.click(screen.getByRole("button", { name: /increment/i }));

    expect(handleChange).toHaveBeenCalledWith(6);
  });

  it("decrements value on click", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<NumberInput aria-label="Quantity" defaultValue={5} onChange={handleChange} />);
    await user.click(screen.getByRole("button", { name: /decrement/i }));

    expect(handleChange).toHaveBeenCalledWith(4);
  });

  it("clamps to min", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<NumberInput aria-label="Quantity" defaultValue={1} min={0} onChange={handleChange} />);
    // First click decrements from 1 to 0
    await user.click(screen.getByRole("button", { name: /decrement/i }));
    expect(handleChange).toHaveBeenCalledWith(0);

    // Decrement button should now be disabled at min
    expect(screen.getByRole("button", { name: /decrement/i })).toBeDisabled();
  });

  it("clamps to max", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<NumberInput aria-label="Quantity" defaultValue={9} max={10} onChange={handleChange} />);
    // First click increments from 9 to 10
    await user.click(screen.getByRole("button", { name: /increment/i }));
    expect(handleChange).toHaveBeenCalledWith(10);

    // Increment button should now be disabled at max
    expect(screen.getByRole("button", { name: /increment/i })).toBeDisabled();
  });

  it("handles keyboard ArrowUp", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<NumberInput aria-label="Quantity" defaultValue={5} onChange={handleChange} />);
    const input = screen.getByRole("spinbutton");
    await user.click(input);
    await user.keyboard("{ArrowUp}");

    expect(handleChange).toHaveBeenCalledWith(6);
  });

  it("handles keyboard ArrowDown", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<NumberInput aria-label="Quantity" defaultValue={5} onChange={handleChange} />);
    const input = screen.getByRole("spinbutton");
    await user.click(input);
    await user.keyboard("{ArrowDown}");

    expect(handleChange).toHaveBeenCalledWith(4);
  });

  it("handles precision formatting", () => {
    render(<NumberInput aria-label="Price" defaultValue={3.1} precision={2} />);
    const input = screen.getByRole("spinbutton");
    expect(input).toHaveValue("3.10");
  });

  it("applies primary variant by default", () => {
    render(<NumberInput aria-label="Quantity" />);
    const wrapper = screen.getByTestId("number-input");
    expect(wrapper.className).toMatch(/variantPrimary/);
  });

  it("applies secondary variant", () => {
    render(<NumberInput aria-label="Quantity" variant="secondary" />);
    const wrapper = screen.getByTestId("number-input");
    expect(wrapper.className).toMatch(/variantSecondary/);
  });

  it("applies error validation status class", () => {
    render(<NumberInput aria-label="Quantity" validationStatus="error" />);
    const wrapper = screen.getByTestId("number-input");
    expect(wrapper.className).toMatch(/statusError/);
  });

  it("applies success validation status class", () => {
    render(<NumberInput aria-label="Quantity" validationStatus="success" />);
    const wrapper = screen.getByTestId("number-input");
    expect(wrapper.className).toMatch(/statusSuccess/);
  });

  it("is disabled when disabled", () => {
    render(<NumberInput aria-label="Quantity" disabled />);
    const input = screen.getByRole("spinbutton");
    expect(input).toBeDisabled();
    expect(screen.getByRole("button", { name: /increment/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /decrement/i })).toBeDisabled();
  });

  it("calls onChange with number value", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<NumberInput aria-label="Quantity" onChange={handleChange} />);
    const input = screen.getByRole("spinbutton");
    await user.type(input, "42");

    expect(handleChange).toHaveBeenCalledWith(42);
  });

  it("applies custom step", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <NumberInput aria-label="Quantity" defaultValue={10} step={5} onChange={handleChange} />,
    );
    await user.click(screen.getByRole("button", { name: /increment/i }));
    expect(handleChange).toHaveBeenCalledWith(15);
  });

  it("clamps value on blur", async () => {
    const handleChange = vi.fn();
    render(<NumberInput aria-label="Quantity" min={0} max={100} onChange={handleChange} />);
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "200" } });
    fireEvent.blur(input);
    expect(handleChange).toHaveBeenCalledWith(100);
  });

  it("calls onChange with undefined for empty input on blur", () => {
    const handleChange = vi.fn();
    render(<NumberInput aria-label="Quantity" onChange={handleChange} />);
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(handleChange).toHaveBeenCalledWith(undefined);
  });

  it("calls onChange with undefined when a filled input is cleared", () => {
    // Distinct from the blur case above: clearing while typing must report the
    // empty value immediately. Starting from an empty input would make the
    // change event a no-op, so this has to begin with a value on screen.
    const handleChange = vi.fn();
    render(<NumberInput aria-label="Quantity" defaultValue={5} onChange={handleChange} />);
    const input = screen.getByRole("spinbutton");

    fireEvent.change(input, { target: { value: "" } });

    expect(handleChange).toHaveBeenCalledWith(undefined);
    expect(input).toHaveValue("");
  });

  it("keeps a cleared controlled input showing the parent's value", () => {
    const handleChange = vi.fn();
    render(<NumberInput aria-label="Quantity" value={5} onChange={handleChange} />);
    const input = screen.getByRole("spinbutton");

    fireEvent.change(input, { target: { value: "" } });

    expect(handleChange).toHaveBeenCalledWith(undefined);
    // The parent declined to move, so the display must not drift from it.
    expect(input).toHaveValue("5");
  });

  it("allows typing minus sign as partial input", () => {
    const handleChange = vi.fn();
    render(<NumberInput aria-label="Quantity" onChange={handleChange} />);
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "-" } });
    // Should not fire onChange with a number for partial input
    expect(handleChange).not.toHaveBeenCalledWith(expect.any(Number));
  });

  it("allows typing dot as partial input", () => {
    const handleChange = vi.fn();
    render(<NumberInput aria-label="Quantity" onChange={handleChange} />);
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "." } });
    expect(handleChange).not.toHaveBeenCalledWith(expect.any(Number));
  });

  it("applies readOnly state", () => {
    render(<NumberInput aria-label="Quantity" defaultValue={5} readOnly />);
    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: /increment/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /decrement/i })).toBeDisabled();
  });

  it("applies fullWidth class", () => {
    render(<NumberInput aria-label="Quantity" fullWidth />);
    const wrapper = screen.getByTestId("number-input");
    expect(wrapper.className).toMatch(/fullWidth/);
  });

  it("applies warning validation status class", () => {
    render(<NumberInput aria-label="Quantity" validationStatus="warning" />);
    const wrapper = screen.getByTestId("number-input");
    expect(wrapper.className).toMatch(/statusWarning/);
  });

  it("applies tertiary variant", () => {
    render(<NumberInput aria-label="Quantity" variant="tertiary" />);
    const wrapper = screen.getByTestId("number-input");
    expect(wrapper.className).toMatch(/variantTertiary/);
  });

  it("uses controlled value", () => {
    render(<NumberInput aria-label="Quantity" value={42} onChange={vi.fn()} />);
    expect(screen.getByRole("spinbutton")).toHaveValue("42");
  });

  it("displays empty string for controlled empty value", () => {
    render(<NumberInput aria-label="Quantity" value="" onChange={vi.fn()} />);
    expect(screen.getByRole("spinbutton")).toHaveValue("");
  });

  it("sets aria-valuemin and aria-valuemax", () => {
    render(<NumberInput aria-label="Quantity" min={1} max={99} />);
    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("aria-valuemin", "1");
    expect(input).toHaveAttribute("aria-valuemax", "99");
  });

  it("ignores non-numeric input", () => {
    const handleChange = vi.fn();
    render(<NumberInput aria-label="Quantity" onChange={handleChange} />);
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "abc" } });
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("does not move a controlled value on its own", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<NumberInput aria-label="Quantity" value={5} step={1} onChange={handleChange} />);
    const input = screen.getByRole("spinbutton");

    // Typing, stepping and blurring all report; none of them may redraw the
    // field, because the parent owns what it shows.
    fireEvent.change(input, { target: { value: "8" } });
    expect(handleChange).toHaveBeenLastCalledWith(8);
    expect(input).toHaveValue("5");

    await user.click(screen.getByRole("button", { name: /increment/i }));
    expect(handleChange).toHaveBeenLastCalledWith(6);
    expect(input).toHaveValue("5");

    fireEvent.blur(input);
    expect(input).toHaveValue("5");
  });

  it("clears a controlled field through the parent, never itself", () => {
    const handleChange = vi.fn();
    const { rerender } = render(
      <NumberInput aria-label="Quantity" value={5} onChange={handleChange} />,
    );
    const input = screen.getByRole("spinbutton");

    fireEvent.change(input, { target: { value: "" } });
    expect(handleChange).toHaveBeenLastCalledWith(undefined);
    expect(input).toHaveValue("5");

    rerender(<NumberInput aria-label="Quantity" value="" onChange={handleChange} />);
    expect(input).toHaveValue("");
  });

  it("reports an empty controlled field on blur without clearing itself", () => {
    const handleChange = vi.fn();
    render(<NumberInput aria-label="Quantity" value="" onChange={handleChange} />);
    const input = screen.getByRole("spinbutton");

    fireEvent.blur(input);
    expect(handleChange).toHaveBeenCalledWith(undefined);
    expect(input).toHaveValue("");
  });

  it("reports a controlled numeric value to assistive tech", () => {
    render(<NumberInput aria-label="Quantity" value={42} onChange={vi.fn()} />);
    // The value arrives as a number rather than display text, and still has to
    // reach aria-valuenow.
    expect(screen.getByRole("spinbutton")).toHaveAttribute("aria-valuenow", "42");
  });

  it("steps from zero when the field is empty", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<NumberInput aria-label="Quantity" step={5} onChange={handleChange} />);

    await user.click(screen.getByRole("button", { name: /increment/i }));
    // Nothing typed, so the only sane base is zero - not NaN.
    expect(handleChange).toHaveBeenCalledWith(5);
    expect(screen.getByRole("spinbutton")).toHaveValue("5");
  });
});
