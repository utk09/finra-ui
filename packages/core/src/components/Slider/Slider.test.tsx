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

  describe("formatValue", () => {
    it("formats the readout and announces the same string", () => {
      render(<Slider label="Volume" showValue defaultValue={45} formatValue={(v) => `${v}%`} />);

      expect(screen.getByTestId("slider-value")).toHaveTextContent("45%");
      // The visible readout and the announced value cannot disagree.
      expect(screen.getByRole("slider")).toHaveAttribute("aria-valuetext", "45%");
    });

    it("receives the resolved bounds, defaulting to the DOM's 0 and 100", () => {
      const formatValue = vi.fn(() => "x");
      render(<Slider label="Volume" showValue defaultValue={45} formatValue={formatValue} />);
      expect(formatValue).toHaveBeenCalledWith(45, 0, 100);
    });

    it("receives explicit bounds when they are given", () => {
      const formatValue = vi.fn(() => "x");
      render(
        <Slider label="W" showValue defaultValue={5} min={2} max={8} formatValue={formatValue} />,
      );
      expect(formatValue).toHaveBeenCalledWith(5, 2, 8);
    });

    it("announces the format with showValue off, since the format says what the number means", () => {
      render(<Slider label="Volume" defaultValue={45} formatValue={(v) => `${v}%`} />);

      expect(screen.queryByTestId("slider-value")).not.toBeInTheDocument();
      expect(screen.getByRole("slider")).toHaveAttribute("aria-valuetext", "45%");
    });

    it("leaves aria-valuenow alone, for assistive tech that ignores aria-valuetext", () => {
      render(<Slider label="Volume" showValue defaultValue={45} formatValue={(v) => `${v}%`} />);
      // A native range input carries its value rather than aria-valuenow, and
      // the format must not have replaced it.
      expect(screen.getByRole("slider")).toHaveValue("45");
    });

    it("follows the thumb on an uncontrolled slider", () => {
      render(<Slider label="Volume" showValue defaultValue={45} formatValue={(v) => `${v}%`} />);
      const slider = screen.getByRole("slider");

      fireEvent.change(slider, { target: { value: "80" } });

      expect(screen.getByTestId("slider-value")).toHaveTextContent("80%");
      expect(slider).toHaveAttribute("aria-valuetext", "80%");
    });

    it("follows a controlled value", () => {
      const { rerender } = render(
        <Slider label="Volume" showValue value={10} onChange={() => undefined} />,
      );
      rerender(
        <Slider
          label="Volume"
          showValue
          value={90}
          onChange={() => undefined}
          formatValue={(v) => `${v}%`}
        />,
      );
      expect(screen.getByTestId("slider-value")).toHaveTextContent("90%");
    });

    it("a consumer's own aria-valuetext wins over the formatter", () => {
      render(
        <Slider
          label="Volume"
          showValue
          defaultValue={45}
          formatValue={(v) => `${v}%`}
          aria-valuetext="loud"
        />,
      );
      expect(screen.getByRole("slider")).toHaveAttribute("aria-valuetext", "loud");
      // The readout still formats; only the announcement was overridden.
      expect(screen.getByTestId("slider-value")).toHaveTextContent("45%");
    });

    it("without it, the readout is the raw value and nothing is announced", () => {
      // The other state: a slider that never opts in is unchanged by any of this.
      render(<Slider label="Volume" showValue defaultValue={45} />);
      expect(screen.getByTestId("slider-value")).toHaveTextContent("45");
      expect(screen.getByRole("slider")).not.toHaveAttribute("aria-valuetext");
    });
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
