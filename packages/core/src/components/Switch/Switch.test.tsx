import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Switch } from "./Switch";

describe("Switch", () => {
  it("renders a switch input", () => {
    render(<Switch aria-label="Toggle" />);
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it('has data-finra-ui="switch" attribute', () => {
    render(<Switch aria-label="Toggle" />);
    expect(screen.getByTestId("switch")).toBeInTheDocument();
  });

  it("forwards ref", () => {
    const ref = vi.fn();
    render(<Switch ref={ref} aria-label="Toggle" />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it("renders label text", () => {
    render(<Switch label="Dark mode" />);
    expect(screen.getByText("Dark mode")).toBeInTheDocument();
  });

  it("does not render label span when label is not provided", () => {
    render(<Switch aria-label="Toggle" />);
    expect(screen.getByTestId("switch-track")).toBeInTheDocument();
    expect(screen.queryByTestId("switch-label")).not.toBeInTheDocument();
  });

  it("toggles checked state on click", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<Switch aria-label="Toggle" onChange={handleChange} />);
    await user.click(screen.getByRole("switch"));
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("can be controlled as checked", () => {
    render(<Switch aria-label="Toggle" checked onChange={vi.fn()} />);
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("can be controlled as unchecked", () => {
    render(<Switch aria-label="Toggle" checked={false} onChange={vi.fn()} />);
    expect(screen.getByRole("switch")).not.toBeChecked();
  });

  it("applies disabled state", () => {
    render(<Switch aria-label="Toggle" disabled />);
    expect(screen.getByRole("switch")).toBeDisabled();
    const wrapper = screen.getByTestId("switch");
    expect(wrapper.className).toMatch(/disabled/);
  });

  it("uses checkbox type with switch role", () => {
    render(<Switch aria-label="Toggle" />);
    const input = screen.getByRole("switch");
    expect(input).toHaveAttribute("type", "checkbox");
  });

  it("renders track and thumb elements", () => {
    render(<Switch aria-label="Toggle" />);
    const track = screen.getByTestId("switch-track");
    expect(track).toBeInTheDocument();
    expect(track).toHaveAttribute("aria-hidden", "true");
    const thumb = screen.getByTestId("switch-thumb");
    expect(thumb).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Switch aria-label="Toggle" className="my-class" />);
    const wrapper = screen.getByTestId("switch");
    expect(wrapper.className).toContain("my-class");
  });
});
