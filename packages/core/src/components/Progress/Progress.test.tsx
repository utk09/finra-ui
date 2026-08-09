import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Progress } from "./Progress";

describe("Progress (styled)", () => {
  it("classes every part", () => {
    render(<Progress value={50} label="Uploading" showLabel />);
    expect(screen.getByTestId("progress").className).toMatch(/progress/);
    expect(screen.getByTestId("progress-track").className).toMatch(/track/);
    expect(screen.getByTestId("progress-fill").className).toMatch(/fill/);
    expect(screen.getByTestId("progress-label").className).toMatch(/label/);
  });

  it.each(["danger", "success", "warning", "info"] as const)(
    "applies the %s sentiment class",
    (sentiment) => {
      render(<Progress value={50} label="Uploading" sentiment={sentiment} />);
      const capitalised = sentiment[0].toUpperCase() + sentiment.slice(1);
      expect(screen.getByTestId("progress").className).toMatch(
        new RegExp(`sentiment${capitalised}`),
      );
    },
  );

  it("carries no sentiment class by default", () => {
    render(<Progress value={50} label="Uploading" />);
    expect(screen.getByTestId("progress").className).not.toMatch(/sentiment/);
  });

  it("applies a caller's class alongside its own", () => {
    render(<Progress value={50} label="Uploading" className="mine" />);
    expect(screen.getByTestId("progress")).toHaveClass("mine");
  });

  it("keeps the base's ARIA contract", () => {
    render(<Progress value={30} max={60} label="Uploading" />);
    const bar = screen.getByRole("progressbar", { name: "Uploading" });
    expect(bar).toHaveAttribute("aria-valuenow", "30");
    expect(bar).toHaveAttribute("aria-valuemax", "60");
    expect(screen.getByTestId("progress-fill")).toHaveStyle({ inlineSize: "50%" });
  });
});
