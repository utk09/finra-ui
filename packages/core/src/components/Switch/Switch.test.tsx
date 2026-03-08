import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "./Switch";

describe("Switch", () => {
  it("renders a switch input", () => {
    render(<Switch aria-label="Toggle" />);
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it('has data-finra-ui="switch" attribute', () => {
    const { container } = render(<Switch aria-label="Toggle" />);
    expect(container.querySelector('[data-finra-ui="switch"]')).toBeInTheDocument();
  });

  it("forwards ref", () => {
    const ref = vi.fn();
    render(<Switch ref={ref} aria-label="Toggle" />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it("renders label text", () => {
    render(<Switch label="Dark mode" />);
    expect(screen.getByText("Dark mode")).toBeInTheDocument();
  });

  it("does not render label span when label is not provided", () => {
    const { container } = render(<Switch aria-label="Toggle" />);
    // The outer label element's direct children: input, track span (aria-hidden), no label span
    const outerLabel = container.querySelector('[data-finra-ui="switch"]');
    const directSpans = outerLabel?.querySelectorAll(":scope > span") ?? [];
    // Only the track span (with aria-hidden), no label text span
    expect(directSpans).toHaveLength(1);
    expect(directSpans[0]).toHaveAttribute("aria-hidden", "true");
  });

  it("toggles checked state on click", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<Switch aria-label="Toggle" onChange={handleChange} />);
    await user.click(screen.getByRole("switch"));
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("can be controlled as checked", () => {
    render(<Switch aria-label="Toggle" checked onChange={vi.fn()} />);
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("can be controlled as unchecked", () => {
    render(<Switch aria-label="Toggle" checked={false} onChange={vi.fn()} />);
    expect(screen.getByRole("switch")).not.toBeChecked();
  });

  it("applies disabled state", () => {
    const { container } = render(<Switch aria-label="Toggle" disabled />);
    expect(screen.getByRole("switch")).toBeDisabled();
    const wrapper = container.querySelector('[data-finra-ui="switch"]');
    expect(wrapper?.className).toMatch(/disabled/);
  });

  it("uses checkbox type with switch role", () => {
    render(<Switch aria-label="Toggle" />);
    const input = screen.getByRole("switch");
    expect(input).toHaveAttribute("type", "checkbox");
  });

  it("renders track and thumb elements", () => {
    const { container } = render(<Switch aria-label="Toggle" />);
    // track is the span with aria-hidden
    const ariaHiddenSpan = container.querySelector('[aria-hidden="true"]');
    expect(ariaHiddenSpan).toBeInTheDocument();
    // thumb is nested inside track
    expect(ariaHiddenSpan?.querySelector("span")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<Switch aria-label="Toggle" className="my-class" />);
    const wrapper = container.querySelector('[data-finra-ui="switch"]');
    expect(wrapper?.className).toContain("my-class");
  });
});
