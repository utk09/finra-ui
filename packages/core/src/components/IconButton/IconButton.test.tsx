import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IconButton } from "./IconButton";

const TestIcon = () => <svg data-testid="test-icon" />;

describe("IconButton", () => {
  it("renders with icon and aria-label", () => {
    render(<IconButton icon={<TestIcon />} aria-label="Close" />);
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  it('has data-finra-ui="icon-button" attribute', () => {
    render(<IconButton icon={<TestIcon />} aria-label="Close" />);
    expect(screen.getByRole("button")).toHaveAttribute("data-finra-ui", "icon-button");
  });

  it("defaults to type='button'", () => {
    render(<IconButton icon={<TestIcon />} aria-label="Close" />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("calls click handler", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<IconButton icon={<TestIcon />} aria-label="Close" onClick={handleClick} />);
    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    render(<IconButton icon={<TestIcon />} aria-label="Close" disabled />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders primary variant by default", () => {
    const { container } = render(<IconButton icon={<TestIcon />} aria-label="Close" />);
    const button = container.querySelector("button");
    expect(button?.className).toMatch(/variantPrimary/);
  });

  it("renders secondary variant", () => {
    const { container } = render(
      <IconButton icon={<TestIcon />} aria-label="Close" variant="secondary" />,
    );
    const button = container.querySelector("button");
    expect(button?.className).toMatch(/variantSecondary/);
  });

  it("renders tertiary variant", () => {
    const { container } = render(
      <IconButton icon={<TestIcon />} aria-label="Close" variant="tertiary" />,
    );
    const button = container.querySelector("button");
    expect(button?.className).toMatch(/variantTertiary/);
  });

  it("applies sentiment class for danger", () => {
    const { container } = render(
      <IconButton icon={<TestIcon />} aria-label="Delete" sentiment="danger" />,
    );
    const button = container.querySelector("button");
    expect(button?.className).toMatch(/sentimentDanger/);
  });

  it("applies sentiment class for success", () => {
    const { container } = render(
      <IconButton icon={<TestIcon />} aria-label="Approve" sentiment="success" />,
    );
    const button = container.querySelector("button");
    expect(button?.className).toMatch(/sentimentSuccess/);
  });

  it("forwards ref", () => {
    const ref = vi.fn();
    render(<IconButton ref={ref} icon={<TestIcon />} aria-label="Close" />);
    expect(ref).toHaveBeenCalled();
  });
});
