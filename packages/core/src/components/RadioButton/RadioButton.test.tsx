import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RadioButton } from "./RadioButton";

describe("RadioButton", () => {
  it("renders a radio input", () => {
    render(<RadioButton aria-label="Option A" name="group" />);
    expect(screen.getByRole("radio")).toBeInTheDocument();
  });

  it('has data-finra-ui="radio-button" attribute', () => {
    const { container } = render(<RadioButton aria-label="Option A" name="group" />);
    expect(container.querySelector('[data-finra-ui="radio-button"]')).toBeInTheDocument();
  });

  it("forwards ref", () => {
    const ref = vi.fn();
    render(<RadioButton ref={ref} aria-label="Option A" name="group" />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it("renders label text", () => {
    render(<RadioButton label="Option A" name="group" />);
    expect(screen.getByText("Option A")).toBeInTheDocument();
  });

  it("does not render label span when label is not provided", () => {
    const { container } = render(<RadioButton aria-label="Option A" name="group" />);
    const outerLabel = container.querySelector('[data-finra-ui="radio-button"]');
    const directSpans = outerLabel?.querySelectorAll(":scope > span") ?? [];
    // Only the indicator span (with aria-hidden), no label text span
    expect(directSpans).toHaveLength(1);
    expect(directSpans[0]).toHaveAttribute("aria-hidden", "true");
  });

  it("fires onChange on click", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<RadioButton aria-label="Option A" name="group" onChange={handleChange} />);
    await user.click(screen.getByRole("radio"));
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("can be controlled as checked", () => {
    render(<RadioButton aria-label="Option A" name="group" checked onChange={vi.fn()} />);
    expect(screen.getByRole("radio")).toBeChecked();
  });

  it("can be controlled as unchecked", () => {
    render(<RadioButton aria-label="Option A" name="group" checked={false} onChange={vi.fn()} />);
    expect(screen.getByRole("radio")).not.toBeChecked();
  });

  it("applies disabled state", () => {
    const { container } = render(<RadioButton aria-label="Option A" name="group" disabled />);
    expect(screen.getByRole("radio")).toBeDisabled();
    const wrapper = container.querySelector('[data-finra-ui="radio-button"]');
    expect(wrapper?.className).toMatch(/disabled/);
  });

  it("applies custom className", () => {
    const { container } = render(
      <RadioButton aria-label="Option A" name="group" className="my-class" />,
    );
    const wrapper = container.querySelector('[data-finra-ui="radio-button"]');
    expect(wrapper?.className).toContain("my-class");
  });

  it("supports grouped exclusive selection", async () => {
    const user = userEvent.setup();

    render(
      <>
        <RadioButton label="Option A" name="test-group" value="a" />
        <RadioButton label="Option B" name="test-group" value="b" />
      </>,
    );

    const [radioA, radioB] = screen.getAllByRole("radio");

    await user.click(radioA);
    expect(radioA).toBeChecked();
    expect(radioB).not.toBeChecked();

    await user.click(radioB);
    expect(radioA).not.toBeChecked();
    expect(radioB).toBeChecked();
  });

  it("uses native radio type", () => {
    render(<RadioButton aria-label="Option A" name="group" />);
    expect(screen.getByRole("radio")).toHaveAttribute("type", "radio");
  });

  it("renders indicator with dot", () => {
    const { container } = render(<RadioButton aria-label="Option A" name="group" />);
    const ariaHiddenSpan = container.querySelector('[aria-hidden="true"]');
    expect(ariaHiddenSpan).toBeInTheDocument();
    expect(ariaHiddenSpan?.querySelector("span")).toBeInTheDocument();
  });
});
