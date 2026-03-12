import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Slider } from "./Slider";

describe("Slider", () => {
  it("renders a range input", () => {
    render(<Slider aria-label="Volume" />);
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it('has data-finra-ui="slider" attribute', () => {
    render(<Slider aria-label="Volume" />);
    expect(screen.getByTestId("slider")).toBeInTheDocument();
  });

  it("forwards ref", () => {
    const ref = vi.fn();
    render(<Slider ref={ref} aria-label="Volume" />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it("renders label text", () => {
    render(<Slider label="Volume" />);
    expect(screen.getByText("Volume")).toBeInTheDocument();
  });

  it("does not render header when no label or showValue", () => {
    render(<Slider aria-label="Volume" />);
    expect(screen.queryByTestId("slider-header")).not.toBeInTheDocument();
  });

  it("displays value when showValue is true", () => {
    render(<Slider label="Volume" showValue defaultValue={75} />);
    expect(screen.getByText("75")).toBeInTheDocument();
  });

  it("applies disabled state", () => {
    render(<Slider aria-label="Volume" disabled />);
    expect(screen.getByRole("slider")).toBeDisabled();
    const wrapper = screen.getByTestId("slider");
    expect(wrapper.className).toMatch(/disabled/);
  });

  it("accepts min, max, step props", () => {
    render(<Slider aria-label="Volume" min={0} max={100} step={5} />);
    const input = screen.getByRole("slider");
    expect(input).toHaveAttribute("min", "0");
    expect(input).toHaveAttribute("max", "100");
    expect(input).toHaveAttribute("step", "5");
  });

  it("fires onChange on interaction", () => {
    const handleChange = vi.fn();
    render(<Slider aria-label="Volume" onChange={handleChange} />);
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "75" } });
    expect(handleChange).toHaveBeenCalled();
  });

  it("can be controlled", () => {
    render(<Slider aria-label="Volume" value={42} onChange={vi.fn()} />);
    expect(screen.getByRole("slider")).toHaveValue("42");
  });

  it("applies custom className", () => {
    render(<Slider aria-label="Volume" className="my-class" />);
    const wrapper = screen.getByTestId("slider");
    expect(wrapper.className).toContain("my-class");
  });

  it("uses native range type", () => {
    render(<Slider aria-label="Volume" />);
    expect(screen.getByRole("slider")).toHaveAttribute("type", "range");
  });
});
