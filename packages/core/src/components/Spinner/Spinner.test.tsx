import { render, screen } from "@testing-library/react";
import { spinnerIcon } from "@utk09/finra-ui-icons";
import { describe, expect, it } from "vitest";

import { Spinner } from "./Spinner";

/**
 * The path data the icons package publishes, as the single source of truth.
 *
 * Destructured rather than read as `spinnerIcon.children`, which the
 * testing-library rule reads as DOM node access. This is icon data, not an
 * element.
 */
const { children: iconShapes } = spinnerIcon;
const iconPaths = iconShapes.flatMap((shape) => (shape.tag === "path" ? [shape.d] : []));

describe("Spinner (styled)", () => {
  it("renders the icons package's glyph, not a hand-rolled SVG", () => {
    render(<Spinner label="Loading" />);
    const markup = screen.getByTestId("spinner").innerHTML;

    // Compared against the data the icons package publishes, so a hand-rolled
    // copy of the artwork fails here rather than passing as "an svg".
    expect(iconPaths.length).toBeGreaterThan(0);
    expect(markup).toContain("<svg");
    for (const path of iconPaths) {
      expect(markup).toContain(path);
    }
  });

  it("stamps the glyph, so one instance can be resized by selector", () => {
    render(<Spinner label="Loading" />);
    expect(screen.getByTestId("spinner-glyph")).toBeInTheDocument();
  });

  it("hides the glyph from assistive tech, leaving the label to name it", () => {
    render(<Spinner label="Loading positions" />);
    const spinner = screen.getByRole("status");
    expect(spinner).toHaveAttribute("aria-label", "Loading positions");
    // The glyph carries no text, so the name comes from aria-label alone rather
    // than being read twice.
    expect(spinner.textContent).toBe("");
  });

  it("applies its class alongside a caller's", () => {
    render(<Spinner label="Loading" className="mine" />);
    expect(screen.getByTestId("spinner")).toHaveClass("mine");
  });

  it("replaces the glyph with a caller's icon", () => {
    render(<Spinner label="Loading" icon={<span>◐</span>} />);
    const markup = screen.getByTestId("spinner").innerHTML;
    expect(markup).toContain("◐");
    expect(markup).not.toContain("<svg");
  });

  it("renders no glyph at all for icon={null}, falling back to the label text", () => {
    render(<Spinner label="Loading" icon={null} />);
    const spinner = screen.getByRole("status");
    expect(spinner.innerHTML).not.toContain("<svg");
    expect(spinner).toHaveTextContent("Loading");
  });

  it("is silent and hidden with no label", () => {
    render(<Spinner />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByTestId("spinner")).toHaveAttribute("aria-hidden", "true");
  });
});
