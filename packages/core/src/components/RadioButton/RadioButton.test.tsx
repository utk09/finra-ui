import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RadioButton } from "./RadioButton";

describe("RadioButton", () => {
  it("renders a radio input", () => {
    render(<RadioButton aria-label="Option A" name="group" />);
    expect(screen.getByRole("radio")).toBeInTheDocument();
  });

  it('has data-finra-ui="radio-button" attribute', () => {
    render(<RadioButton aria-label="Option A" name="group" />);
    expect(screen.getByTestId("radio-button")).toBeInTheDocument();
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
    render(<RadioButton aria-label="Option A" name="group" />);
    expect(screen.getByTestId("radio-button-indicator")).toBeInTheDocument();
    expect(screen.queryByTestId("radio-button-label")).not.toBeInTheDocument();
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
    render(<RadioButton aria-label="Option A" name="group" disabled />);
    expect(screen.getByRole("radio")).toBeDisabled();
    const wrapper = screen.getByTestId("radio-button");
    expect(wrapper.className).toMatch(/disabled/);
  });

  it("applies custom className", () => {
    render(<RadioButton aria-label="Option A" name="group" className="my-class" />);
    const wrapper = screen.getByTestId("radio-button");
    expect(wrapper.className).toContain("my-class");
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
    render(<RadioButton aria-label="Option A" name="group" />);
    const indicator = screen.getByTestId("radio-button-indicator");
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute("aria-hidden", "true");
  });
});
