import { render, screen } from "@testing-library/react";
import { errorIcon, infoIcon, successCircleIcon, warningIcon } from "@utk09/finra-ui-icons";
import { describe, expect, it } from "vitest";

import { Banner } from "./Banner";

/**
 * The shapes the icons package publishes, as the single source of truth.
 *
 * Destructured rather than read as `errorIcon.children`, which the
 * testing-library rule reads as DOM node access. This is icon data, not an
 * element.
 */
const { children: dangerShapes } = errorIcon;
const { children: successShapes } = successCircleIcon;
const { children: warningShapes } = warningIcon;
const { children: infoShapes } = infoIcon;

/**
 * Every attribute of every shape, as it appears in rendered markup. Comparing
 * against these means a banner that renders the wrong sentiment's glyph fails
 * here, where a bare "contains an svg" check would pass.
 */
function renderedAttributes(shapes: readonly Record<string, unknown>[]): string[] {
  return shapes.flatMap((shape) =>
    Object.entries(shape)
      .filter(([key]) => key !== "tag")
      .map(([key, value]) => `${key}="${value}"`),
  );
}

const sentimentShapes = {
  danger: dangerShapes,
  success: successShapes,
  warning: warningShapes,
  info: infoShapes,
} as const;

describe("Banner (styled)", () => {
  it("classes every part", () => {
    render(
      <Banner sentiment="info" title="Heads up" dismissible action={<span>Retry</span>}>
        Body
      </Banner>,
    );
    expect(screen.getByTestId("banner").className).toMatch(/banner/);
    expect(screen.getByTestId("banner-icon").className).toMatch(/icon/);
    expect(screen.getByTestId("banner-content").className).toMatch(/content/);
    expect(screen.getByTestId("banner-title").className).toMatch(/title/);
    expect(screen.getByTestId("banner-description").className).toMatch(/description/);
    expect(screen.getByTestId("banner-action").className).toMatch(/action/);
    expect(screen.getByTestId("banner-close").className).toMatch(/close/);
  });

  it.each(["danger", "success", "warning", "info"] as const)(
    "applies the %s sentiment class",
    (sentiment) => {
      render(<Banner sentiment={sentiment}>Body</Banner>);
      const capitalised = sentiment[0].toUpperCase() + sentiment.slice(1);
      expect(screen.getByTestId("banner").className).toMatch(new RegExp(`sentiment${capitalised}`));
    },
  );

  it("carries no sentiment class by default", () => {
    render(<Banner>Body</Banner>);
    expect(screen.getByTestId("banner").className).not.toMatch(/sentiment/);
  });

  it("applies a caller's class alongside its own", () => {
    render(<Banner className="mine">Body</Banner>);
    expect(screen.getByTestId("banner")).toHaveClass("mine");
  });

  //  Icons

  it.each(["danger", "success", "warning", "info"] as const)(
    "renders the icons package's %s glyph",
    (sentiment) => {
      render(<Banner sentiment={sentiment}>Body</Banner>);
      const markup = screen.getByTestId("banner-icon").innerHTML;
      const attributes = renderedAttributes(sentimentShapes[sentiment]);

      expect(attributes.length).toBeGreaterThan(0);
      expect(markup).toContain("<svg");
      for (const attribute of attributes) {
        expect(markup).toContain(attribute);
      }
    },
  );

  it("gives each sentiment a glyph of its own", () => {
    // Four sentiments sharing one glyph would satisfy every per-sentiment
    // assertion above that the glyphs happen to have in common.
    const markup = new Set<string>();
    for (const sentiment of ["danger", "success", "warning", "info"] as const) {
      const { unmount } = render(<Banner sentiment={sentiment}>Body</Banner>);
      markup.add(screen.getByTestId("banner-icon").innerHTML);
      unmount();
    }
    expect(markup.size).toBe(4);
  });

  it("injects no icon when there is no sentiment to reinforce", () => {
    render(<Banner>Body</Banner>);
    expect(screen.queryByTestId("banner-icon")).not.toBeInTheDocument();
  });

  it("replaces the default icon with a given one", () => {
    render(
      <Banner sentiment="danger" icon={<span>!</span>}>
        Body
      </Banner>,
    );
    const markup = screen.getByTestId("banner-icon").innerHTML;
    expect(markup).toContain("!");
    expect(markup).not.toContain("<svg");
  });

  it("renders no icon at all for icon={null}", () => {
    render(
      <Banner sentiment="danger" icon={null}>
        Body
      </Banner>,
    );
    expect(screen.queryByTestId("banner-icon")).not.toBeInTheDocument();
  });

  it("injects an svg dismiss glyph in place of the base's text character", () => {
    render(<Banner dismissible>Body</Banner>);
    const close = screen.getByTestId("banner-close");
    expect(close.innerHTML).toContain("<svg");
    expect(close).not.toHaveTextContent("×");
  });

  //  Contract inherited from the base

  it("keeps the base's announcement rules", () => {
    const { rerender } = render(<Banner sentiment="danger">Body</Banner>);
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive");

    rerender(<Banner sentiment="success">Body</Banner>);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");

    rerender(<Banner>Body</Banner>);
    expect(screen.getByTestId("banner")).not.toHaveAttribute("role");
  });
});
