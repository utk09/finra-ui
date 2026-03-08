import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Textarea } from "./Textarea";

describe("Textarea", () => {
  it("renders textarea element", () => {
    render(<Textarea />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("textbox").tagName).toBe("TEXTAREA");
  });

  it('has data-finra-ui="textarea" attribute', () => {
    const { container } = render(<Textarea />);
    expect(container.querySelector('[data-finra-ui="textarea"]')).toBeInTheDocument();
  });

  it("forwards ref", () => {
    const ref = vi.fn();
    render(<Textarea ref={ref} />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLTextAreaElement));
  });

  it("applies primary variant by default", () => {
    const { container } = render(<Textarea />);
    const wrapper = container.querySelector('[data-finra-ui="textarea"]');
    expect(wrapper?.className).toMatch(/variantPrimary/);
  });

  it("applies secondary variant", () => {
    const { container } = render(<Textarea variant="secondary" />);
    const wrapper = container.querySelector('[data-finra-ui="textarea"]');
    expect(wrapper?.className).toMatch(/variantSecondary/);
  });

  it("applies tertiary variant", () => {
    const { container } = render(<Textarea variant="tertiary" />);
    const wrapper = container.querySelector('[data-finra-ui="textarea"]');
    expect(wrapper?.className).toMatch(/variantTertiary/);
  });

  it("applies error validation status class", () => {
    const { container } = render(<Textarea validationStatus="error" />);
    const wrapper = container.querySelector('[data-finra-ui="textarea"]');
    expect(wrapper?.className).toMatch(/statusError/);
  });

  it("applies warning validation status class", () => {
    const { container } = render(<Textarea validationStatus="warning" />);
    const wrapper = container.querySelector('[data-finra-ui="textarea"]');
    expect(wrapper?.className).toMatch(/statusWarning/);
  });

  it("applies success validation status class", () => {
    const { container } = render(<Textarea validationStatus="success" />);
    const wrapper = container.querySelector('[data-finra-ui="textarea"]');
    expect(wrapper?.className).toMatch(/statusSuccess/);
  });

  it("shows character count when showCharCount and maxLength set", () => {
    render(<Textarea showCharCount maxLength={100} />);
    expect(screen.getByText("0/100")).toBeInTheDocument();
  });

  it("updates character count on typing", async () => {
    const user = userEvent.setup();
    render(<Textarea showCharCount maxLength={100} />);

    await user.type(screen.getByRole("textbox"), "hello");
    expect(screen.getByText("5/100")).toBeInTheDocument();
  });

  it("enforces maxLength", () => {
    render(<Textarea maxLength={5} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("maxlength", "5");
  });

  it("shows warning color when approaching threshold", async () => {
    const user = userEvent.setup();
    const { container } = render(<Textarea showCharCount maxLength={10} warningThreshold={8} />);

    await user.type(screen.getByRole("textbox"), "12345678");

    const countEl = container.querySelector('[data-finra-ui="textarea-count"]');
    expect(countEl?.className).toMatch(/charCountWarning/);
  });

  it("shows error color when at limit", async () => {
    const user = userEvent.setup();
    const { container } = render(<Textarea showCharCount maxLength={5} warningThreshold={3} />);

    await user.type(screen.getByRole("textbox"), "12345");

    const countEl = container.querySelector('[data-finra-ui="textarea-count"]');
    expect(countEl?.className).toMatch(/charCountError/);
  });

  it("is disabled when disabled", () => {
    render(<Textarea disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("applies disabled class to wrapper", () => {
    const { container } = render(<Textarea disabled />);
    const wrapper = container.querySelector('[data-finra-ui="textarea"]');
    expect(wrapper?.className).toMatch(/disabled/);
  });

  it("applies fullWidth class", () => {
    const { container } = render(<Textarea fullWidth />);
    const wrapper = container.querySelector('[data-finra-ui="textarea"]');
    expect(wrapper?.className).toMatch(/fullWidth/);
  });
});
