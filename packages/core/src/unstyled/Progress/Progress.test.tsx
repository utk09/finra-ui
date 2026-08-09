import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProgressBase } from "./Progress";

describe("ProgressBase", () => {
  it("stamps every part", () => {
    render(<ProgressBase value={50} label="Uploading" showLabel />);
    expect(screen.getByTestId("progress")).toBeInTheDocument();
    expect(screen.getByTestId("progress-track")).toBeInTheDocument();
    expect(screen.getByTestId("progress-fill")).toBeInTheDocument();
    expect(screen.getByTestId("progress-label")).toBeInTheDocument();
  });

  it("lets a caller replace the root id", () => {
    render(<ProgressBase value={50} label="Uploading" {...{ "data-finra-ui": "my-progress" }} />);
    expect(screen.getByTestId("my-progress")).toBeInTheDocument();
  });

  it("reports its position through ARIA", () => {
    render(<ProgressBase value={1} max={4} label="Step" />);
    const bar = screen.getByRole("progressbar", { name: "Step" });
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "4");
    // The raw value, not the percentage: a screen reader says "1 of 4".
    expect(bar).toHaveAttribute("aria-valuenow", "1");
  });

  it("omits aria-valuenow entirely when indeterminate", () => {
    // A placeholder number would be announced as real progress.
    render(<ProgressBase label="Working" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).not.toHaveAttribute("aria-valuenow");
    expect(bar).toHaveAttribute("data-indeterminate");
  });

  it("is determinate at zero", () => {
    render(<ProgressBase value={0} label="Uploading" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "0");
    expect(bar).not.toHaveAttribute("data-indeterminate");
  });

  it("sizes the fill from the percentage", () => {
    render(<ProgressBase value={25} label="Uploading" />);
    expect(screen.getByTestId("progress-fill")).toHaveStyle({ inlineSize: "25%" });
  });

  it("leaves the fill unsized while indeterminate, for the stylesheet to drive", () => {
    render(<ProgressBase label="Working" />);
    expect(screen.getByTestId("progress-fill").style.inlineSize).toBe("");
  });

  it("shows a whole percentage by default", () => {
    render(<ProgressBase value={1} max={3} label="Step" showLabel />);
    expect(screen.getByTestId("progress-label")).toHaveTextContent("33%");
  });

  it("passes percent, value and max to a custom formatter", () => {
    const formatLabel = vi.fn(() => "1 of 4");
    render(<ProgressBase value={1} max={4} label="Step" showLabel formatLabel={formatLabel} />);
    expect(formatLabel).toHaveBeenCalledWith(25, 1, 4);
    expect(screen.getByTestId("progress-label")).toHaveTextContent("1 of 4");
  });

  it("renders no visible label while indeterminate", () => {
    // There is no percentage to show, and "NaN%" is worse than nothing.
    render(<ProgressBase label="Working" showLabel />);
    expect(screen.queryByTestId("progress-label")).not.toBeInTheDocument();
  });

  it("hides the visible label unless asked", () => {
    render(<ProgressBase value={50} label="Uploading" />);
    expect(screen.queryByTestId("progress-label")).not.toBeInTheDocument();
  });

  it("clamps a value beyond its range", () => {
    render(<ProgressBase value={150} label="Uploading" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByTestId("progress-fill")).toHaveStyle({ inlineSize: "100%" });
  });

  it("applies the styled layer's part classes", () => {
    render(
      <ProgressBase
        value={50}
        label="Uploading"
        showLabel
        classNames={{ track: "t", fill: "f", label: "l" }}
      />,
    );
    expect(screen.getByTestId("progress-track")).toHaveClass("t");
    expect(screen.getByTestId("progress-fill")).toHaveClass("f");
    expect(screen.getByTestId("progress-label")).toHaveClass("l");
  });
});
