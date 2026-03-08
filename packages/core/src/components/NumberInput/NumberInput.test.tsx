import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NumberInput } from "./NumberInput";

describe("NumberInput", () => {
  it('renders with data-finra-ui="number-input"', () => {
    const { container } = render(<NumberInput aria-label="Quantity" />);
    expect(container.querySelector('[data-finra-ui="number-input"]')).toBeInTheDocument();
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
    const { container } = render(<NumberInput aria-label="Quantity" />);
    const wrapper = container.querySelector('[data-finra-ui="number-input"]');
    expect(wrapper?.className).toMatch(/variantPrimary/);
  });

  it("applies secondary variant", () => {
    const { container } = render(<NumberInput aria-label="Quantity" variant="secondary" />);
    const wrapper = container.querySelector('[data-finra-ui="number-input"]');
    expect(wrapper?.className).toMatch(/variantSecondary/);
  });

  it("applies error validation status class", () => {
    const { container } = render(<NumberInput aria-label="Quantity" validationStatus="error" />);
    const wrapper = container.querySelector('[data-finra-ui="number-input"]');
    expect(wrapper?.className).toMatch(/statusError/);
  });

  it("applies success validation status class", () => {
    const { container } = render(<NumberInput aria-label="Quantity" validationStatus="success" />);
    const wrapper = container.querySelector('[data-finra-ui="number-input"]');
    expect(wrapper?.className).toMatch(/statusSuccess/);
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
});
