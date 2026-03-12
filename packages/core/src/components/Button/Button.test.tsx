import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./Button";

describe("Button", () => {
  it("renders with text content", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("has data-finra-ui attribute", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-finra-ui", "button");
  });

  it("defaults to type='button'", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("allows type override to submit", () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("calls click handler when clicked", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not call click handler when disabled", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Button onClick={handleClick} disabled>
        Disabled
      </Button>,
    );
    await user.click(screen.getByRole("button"));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("forwards ref", () => {
    const ref = vi.fn();
    render(<Button ref={ref}>Button</Button>);
    expect(ref).toHaveBeenCalled();
  });

  it("applies aria attributes", () => {
    render(
      <Button aria-label="Save document" aria-pressed="true">
        Save
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Save document");
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("renders primary variant by default", () => {
    render(<Button>Primary</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toMatch(/variantPrimary/);
  });

  it("renders secondary variant", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toMatch(/variantSecondary/);
  });

  it("renders tertiary variant", () => {
    render(<Button variant="tertiary">Tertiary</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toMatch(/variantTertiary/);
  });

  it("applies sentiment class for danger", () => {
    render(<Button sentiment="danger">Delete</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toMatch(/sentimentDanger/);
  });

  it("applies sentiment class for success", () => {
    render(<Button sentiment="success">Approve</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toMatch(/sentimentSuccess/);
  });

  it("combines variant and sentiment", () => {
    render(
      <Button variant="secondary" sentiment="danger">
        Remove
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button.className).toMatch(/variantSecondary/);
    expect(button.className).toMatch(/sentimentDanger/);
  });

  it("applies fullWidth class", () => {
    render(<Button fullWidth>Full Width</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toMatch(/fullWidth/);
  });

  it("merges custom className", () => {
    render(<Button className="custom">Button</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("custom");
  });

  describe("startIcon and endIcon", () => {
    const TestIcon = () => <svg data-finra-ui="test-icon" />;

    it("renders startIcon", () => {
      render(<Button startIcon={<TestIcon />}>With Icon</Button>);
      expect(screen.getByTestId("test-icon")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /with icon/i })).toBeInTheDocument();
    });

    it("renders endIcon", () => {
      render(<Button endIcon={<TestIcon />}>With Icon</Button>);
      expect(screen.getByTestId("test-icon")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /with icon/i })).toBeInTheDocument();
    });

    it("renders both startIcon and endIcon", () => {
      const StartIcon = () => <svg data-finra-ui="start-icon" />;
      const EndIcon = () => <svg data-finra-ui="end-icon" />;
      render(
        <Button startIcon={<StartIcon />} endIcon={<EndIcon />}>
          Both Icons
        </Button>,
      );
      expect(screen.getByTestId("start-icon")).toBeInTheDocument();
      expect(screen.getByTestId("end-icon")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /both icons/i })).toBeInTheDocument();
    });
  });
});
