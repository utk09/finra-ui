import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders badge with text", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it('has data-finra-ui="badge" attribute', () => {
    render(<Badge>Test</Badge>);
    expect(screen.getByTestId("badge")).toBeInTheDocument();
  });

  it("forwards ref", () => {
    const ref = vi.fn();
    render(<Badge ref={ref}>Test</Badge>);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLSpanElement));
  });

  it("applies primary variant by default", () => {
    render(<Badge>Test</Badge>);
    const badge = screen.getByTestId("badge");
    expect(badge.className).toMatch(/variantPrimary/);
  });

  it("applies secondary variant", () => {
    render(<Badge variant="secondary">Test</Badge>);
    const badge = screen.getByTestId("badge");
    expect(badge.className).toMatch(/variantSecondary/);
  });

  it("applies tertiary variant", () => {
    render(<Badge variant="tertiary">Test</Badge>);
    const badge = screen.getByTestId("badge");
    expect(badge.className).toMatch(/variantTertiary/);
  });

  it("applies danger sentiment", () => {
    render(<Badge sentiment="danger">Error</Badge>);
    const badge = screen.getByTestId("badge");
    expect(badge.className).toMatch(/sentimentDanger/);
  });

  it("applies success sentiment", () => {
    render(<Badge sentiment="success">Done</Badge>);
    const badge = screen.getByTestId("badge");
    expect(badge.className).toMatch(/sentimentSuccess/);
  });

  it("applies warning sentiment", () => {
    render(<Badge sentiment="warning">Warning</Badge>);
    const badge = screen.getByTestId("badge");
    expect(badge.className).toMatch(/sentimentWarning/);
  });

  it("applies info sentiment", () => {
    render(<Badge sentiment="info">Info</Badge>);
    const badge = screen.getByTestId("badge");
    expect(badge.className).toMatch(/sentimentInfo/);
  });

  it("combines variant and sentiment", () => {
    render(
      <Badge variant="secondary" sentiment="danger">
        Critical
      </Badge>,
    );
    const badge = screen.getByTestId("badge");
    expect(badge.className).toMatch(/variantSecondary/);
    expect(badge.className).toMatch(/sentimentDanger/);
  });

  it("applies custom className", () => {
    render(<Badge className="my-class">Test</Badge>);
    const badge = screen.getByTestId("badge");
    expect(badge.className).toContain("my-class");
  });

  it("renders as a span element", () => {
    render(<Badge>Test</Badge>);
    const badge = screen.getByText("Test");
    expect(badge.tagName).toBe("SPAN");
  });
});
