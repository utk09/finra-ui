import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SkeletonBase } from "./Skeleton";

describe("SkeletonBase", () => {
  it("stamps its own id and defaults to one text line", () => {
    render(<SkeletonBase />);
    const root = screen.getByTestId("skeleton");
    expect(root).toHaveAttribute("data-variant", "text");
    expect(root).toHaveAttribute("data-animation", "pulse");
    expect(screen.getAllByTestId("skeleton-line")).toHaveLength(1);
  });

  it("lets a caller replace the id", () => {
    render(<SkeletonBase {...{ "data-finra-ui": "my-skeleton" }} />);
    expect(screen.getByTestId("my-skeleton")).toBeInTheDocument();
  });

  it("is hidden from assistive tech", () => {
    // A placeholder has nothing to announce. The content it stands in for
    // announces itself when it arrives.
    render(<SkeletonBase />);
    expect(screen.getByTestId("skeleton")).toHaveAttribute("aria-hidden", "true");
  });

  it("renders one element per line", () => {
    render(<SkeletonBase lines={4} />);
    expect(screen.getAllByTestId("skeleton-line")).toHaveLength(4);
  });

  it.each(["circular", "rectangular"] as const)("renders no lines for %s", (variant) => {
    render(<SkeletonBase variant={variant} lines={3} />);
    expect(screen.queryByTestId("skeleton-line")).not.toBeInTheDocument();
    expect(screen.getByTestId("skeleton")).toHaveAttribute("data-variant", variant);
  });

  it.each([0, -3, 0.4])("renders no lines rather than throwing for lines=%p", (lines) => {
    // `lines` arrives from a caller's data as often as from a literal.
    render(<SkeletonBase lines={lines} />);
    expect(screen.queryByTestId("skeleton-line")).not.toBeInTheDocument();
  });

  it("floors a fractional line count", () => {
    render(<SkeletonBase lines={3.7} />);
    expect(screen.getAllByTestId("skeleton-line")).toHaveLength(3);
  });

  it("carries the animation through as an attribute", () => {
    render(<SkeletonBase animation="none" />);
    expect(screen.getByTestId("skeleton")).toHaveAttribute("data-animation", "none");
  });

  it("applies the styled layer's line class", () => {
    render(<SkeletonBase lines={2} classNames={{ line: "injected" }} />);
    for (const line of screen.getAllByTestId("skeleton-line")) {
      expect(line).toHaveClass("injected");
    }
  });
});
