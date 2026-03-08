import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders badge with text", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it('has data-finra-ui="badge" attribute', () => {
    const { container } = render(<Badge>Test</Badge>);
    expect(container.querySelector('[data-finra-ui="badge"]')).toBeInTheDocument();
  });

  it("forwards ref", () => {
    const ref = vi.fn();
    render(<Badge ref={ref}>Test</Badge>);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLSpanElement));
  });

  it("applies primary variant by default", () => {
    const { container } = render(<Badge>Test</Badge>);
    const badge = container.querySelector('[data-finra-ui="badge"]');
    expect(badge?.className).toMatch(/variantPrimary/);
  });

  it("applies secondary variant", () => {
    const { container } = render(<Badge variant="secondary">Test</Badge>);
    const badge = container.querySelector('[data-finra-ui="badge"]');
    expect(badge?.className).toMatch(/variantSecondary/);
  });

  it("applies tertiary variant", () => {
    const { container } = render(<Badge variant="tertiary">Test</Badge>);
    const badge = container.querySelector('[data-finra-ui="badge"]');
    expect(badge?.className).toMatch(/variantTertiary/);
  });

  it("applies danger sentiment", () => {
    const { container } = render(<Badge sentiment="danger">Error</Badge>);
    const badge = container.querySelector('[data-finra-ui="badge"]');
    expect(badge?.className).toMatch(/sentimentDanger/);
  });

  it("applies success sentiment", () => {
    const { container } = render(<Badge sentiment="success">Done</Badge>);
    const badge = container.querySelector('[data-finra-ui="badge"]');
    expect(badge?.className).toMatch(/sentimentSuccess/);
  });

  it("applies warning sentiment", () => {
    const { container } = render(<Badge sentiment="warning">Warning</Badge>);
    const badge = container.querySelector('[data-finra-ui="badge"]');
    expect(badge?.className).toMatch(/sentimentWarning/);
  });

  it("applies info sentiment", () => {
    const { container } = render(<Badge sentiment="info">Info</Badge>);
    const badge = container.querySelector('[data-finra-ui="badge"]');
    expect(badge?.className).toMatch(/sentimentInfo/);
  });

  it("combines variant and sentiment", () => {
    const { container } = render(
      <Badge variant="secondary" sentiment="danger">
        Critical
      </Badge>,
    );
    const badge = container.querySelector('[data-finra-ui="badge"]');
    expect(badge?.className).toMatch(/variantSecondary/);
    expect(badge?.className).toMatch(/sentimentDanger/);
  });

  it("applies custom className", () => {
    const { container } = render(<Badge className="my-class">Test</Badge>);
    const badge = container.querySelector('[data-finra-ui="badge"]');
    expect(badge?.className).toContain("my-class");
  });

  it("renders as a span element", () => {
    render(<Badge>Test</Badge>);
    const badge = screen.getByText("Test");
    expect(badge.tagName).toBe("SPAN");
  });
});
