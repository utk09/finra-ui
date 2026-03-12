import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Divider } from "./Divider";

describe("Divider", () => {
  it("renders an hr element", () => {
    render(<Divider />);
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it('has data-finra-ui="divider" attribute', () => {
    render(<Divider />);
    expect(screen.getByTestId("divider")).toBeInTheDocument();
  });

  it("forwards ref", () => {
    const ref = vi.fn();
    render(<Divider ref={ref} />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLHRElement));
  });

  it("defaults to horizontal orientation", () => {
    render(<Divider />);
    const hr = screen.getByRole("separator");
    expect(hr.className).toMatch(/horizontal/);
  });

  it("applies vertical orientation", () => {
    render(<Divider orientation="vertical" />);
    const hr = screen.getByRole("separator");
    expect(hr.className).toMatch(/vertical/);
  });

  it("has role=separator and aria-orientation when not decorative", () => {
    render(<Divider />);
    const hr = screen.getByRole("separator");
    expect(hr).toHaveAttribute("role", "separator");
    expect(hr).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("has aria-orientation=vertical when vertical", () => {
    render(<Divider orientation="vertical" />);
    const hr = screen.getByRole("separator");
    expect(hr).toHaveAttribute("role", "separator");
    expect(hr).toHaveAttribute("aria-orientation", "vertical");
  });

  it("has aria-hidden when decorative", () => {
    render(<Divider decorative />);
    const hr = screen.getByTestId("divider");
    expect(hr).toHaveAttribute("aria-hidden", "true");
    expect(hr).not.toHaveAttribute("role");
  });

  it("does not have aria-hidden when not decorative", () => {
    render(<Divider />);
    const hr = screen.getByRole("separator");
    expect(hr).not.toHaveAttribute("aria-hidden");
  });

  it("applies custom className", () => {
    render(<Divider className="my-class" />);
    const hr = screen.getByRole("separator");
    expect(hr.className).toContain("my-class");
  });
});
