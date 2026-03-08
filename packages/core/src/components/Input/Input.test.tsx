import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./Input";

describe("Input", () => {
  it("renders input element", () => {
    render(<Input />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it('has data-finra-ui="input" and data-finra-ui="input-field" attributes', () => {
    const { container } = render(<Input />);
    expect(container.querySelector('[data-finra-ui="input"]')).toBeInTheDocument();
    expect(container.querySelector('[data-finra-ui="input-field"]')).toBeInTheDocument();
  });

  it("forwards ref to input element", () => {
    const ref = vi.fn();
    render(<Input ref={ref} />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it("applies primary variant by default", () => {
    const { container } = render(<Input />);
    const wrapper = container.querySelector('[data-finra-ui="input"]');
    expect(wrapper?.className).toMatch(/variantPrimary/);
  });

  it("applies secondary variant", () => {
    const { container } = render(<Input variant="secondary" />);
    const wrapper = container.querySelector('[data-finra-ui="input"]');
    expect(wrapper?.className).toMatch(/variantSecondary/);
  });

  it("applies tertiary variant", () => {
    const { container } = render(<Input variant="tertiary" />);
    const wrapper = container.querySelector('[data-finra-ui="input"]');
    expect(wrapper?.className).toMatch(/variantTertiary/);
  });

  it("applies error validation status class", () => {
    const { container } = render(<Input validationStatus="error" />);
    const wrapper = container.querySelector('[data-finra-ui="input"]');
    expect(wrapper?.className).toMatch(/statusError/);
  });

  it("applies warning validation status class", () => {
    const { container } = render(<Input validationStatus="warning" />);
    const wrapper = container.querySelector('[data-finra-ui="input"]');
    expect(wrapper?.className).toMatch(/statusWarning/);
  });

  it("applies success validation status class", () => {
    const { container } = render(<Input validationStatus="success" />);
    const wrapper = container.querySelector('[data-finra-ui="input"]');
    expect(wrapper?.className).toMatch(/statusSuccess/);
  });

  it("renders start adornment", () => {
    render(<Input startAdornment={<span data-testid="start">$</span>} />);
    expect(screen.getByTestId("start")).toBeInTheDocument();
  });

  it("renders end adornment", () => {
    render(<Input endAdornment={<span data-testid="end">kg</span>} />);
    expect(screen.getByTestId("end")).toBeInTheDocument();
  });

  it("renders clear button when clearable and has value", () => {
    render(<Input clearable value="hello" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /clear input/i })).toBeInTheDocument();
  });

  it("does not render clear button when clearable but value is empty", () => {
    render(<Input clearable value="" onChange={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /clear input/i })).not.toBeInTheDocument();
  });

  it("calls onClear when clear button clicked", async () => {
    const handleClear = vi.fn();
    const user = userEvent.setup();

    render(<Input clearable value="hello" onChange={vi.fn()} onClear={handleClear} />);
    await user.click(screen.getByRole("button", { name: /clear input/i }));

    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("applies disabled class to wrapper", () => {
    const { container } = render(<Input disabled />);
    const wrapper = container.querySelector('[data-finra-ui="input"]');
    expect(wrapper?.className).toMatch(/disabled/);
  });

  it("applies fullWidth class", () => {
    const { container } = render(<Input fullWidth />);
    const wrapper = container.querySelector('[data-finra-ui="input"]');
    expect(wrapper?.className).toMatch(/fullWidth/);
  });

  it("handles placeholder", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("handles onChange", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<Input onChange={handleChange} />);
    await user.type(screen.getByRole("textbox"), "a");

    expect(handleChange).toHaveBeenCalled();
  });
});
