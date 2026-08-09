import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Skeleton } from "./Skeleton";

describe("Skeleton (styled)", () => {
  it("applies its class alongside a caller's", () => {
    render(<Skeleton className="mine" />);
    const root = screen.getByTestId("skeleton");
    expect(root).toHaveClass("mine");
    expect(root.className).toMatch(/skeleton/);
  });

  it("classes every line", () => {
    render(<Skeleton lines={3} />);
    const lines = screen.getAllByTestId("skeleton-line");
    expect(lines).toHaveLength(3);
    for (const line of lines) {
      expect(line.className).toMatch(/line/);
    }
  });

  it("keeps the base's variant and animation attributes for the stylesheet", () => {
    render(<Skeleton variant="circular" animation="wave" />);
    const root = screen.getByTestId("skeleton");
    expect(root).toHaveAttribute("data-variant", "circular");
    expect(root).toHaveAttribute("data-animation", "wave");
  });

  it("stays hidden from assistive tech", () => {
    render(<Skeleton />);
    expect(screen.getByTestId("skeleton")).toHaveAttribute("aria-hidden", "true");
  });
});
