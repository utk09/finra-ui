import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { Divider } from "./Divider";

describe("Divider", () => {
  it("renders an hr element", () => {
    const { container } = render(<Divider />);
    expect(container.querySelector("hr")).toBeInTheDocument();
  });

  it('has data-finra-ui="divider" attribute', () => {
    const { container } = render(<Divider />);
    expect(container.querySelector('[data-finra-ui="divider"]')).toBeInTheDocument();
  });

  it("forwards ref", () => {
    const ref = vi.fn();
    render(<Divider ref={ref} />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLHRElement));
  });

  it("defaults to horizontal orientation", () => {
    const { container } = render(<Divider />);
    const hr = container.querySelector("hr");
    expect(hr?.className).toMatch(/horizontal/);
  });

  it("applies vertical orientation", () => {
    const { container } = render(<Divider orientation="vertical" />);
    const hr = container.querySelector("hr");
    expect(hr?.className).toMatch(/vertical/);
  });

  it("has role=separator and aria-orientation when not decorative", () => {
    const { container } = render(<Divider />);
    const hr = container.querySelector("hr");
    expect(hr).toHaveAttribute("role", "separator");
    expect(hr).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("has aria-orientation=vertical when vertical", () => {
    const { container } = render(<Divider orientation="vertical" />);
    const hr = container.querySelector("hr");
    expect(hr).toHaveAttribute("role", "separator");
    expect(hr).toHaveAttribute("aria-orientation", "vertical");
  });

  it("has aria-hidden when decorative", () => {
    const { container } = render(<Divider decorative />);
    const hr = container.querySelector("hr");
    expect(hr).toHaveAttribute("aria-hidden", "true");
    expect(hr).not.toHaveAttribute("role");
  });

  it("does not have aria-hidden when not decorative", () => {
    const { container } = render(<Divider />);
    const hr = container.querySelector("hr");
    expect(hr).not.toHaveAttribute("aria-hidden");
  });

  it("applies custom className", () => {
    const { container } = render(<Divider className="my-class" />);
    const hr = container.querySelector("hr");
    expect(hr?.className).toContain("my-class");
  });
});
