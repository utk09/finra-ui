import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("expect button to be rendered when Button component is used", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("expect click handler to be called when button is clicked", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("expect button to be disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button");

    expect(button).toBeDisabled();
  });

  it("expect ref to be forwarded when ref prop is provided", () => {
    const ref = vi.fn();
    render(<Button ref={ref}>Button</Button>);
    expect(ref).toHaveBeenCalled();
  });

  it("expect aria attributes to be applied when accessibility props are provided", () => {
    render(
      <Button aria-label="Save document" aria-pressed="true">
        Save
      </Button>,
    );
    const button = screen.getByRole("button");

    expect(button).toHaveAttribute("aria-label", "Save document");
    expect(button).toHaveAttribute("aria-pressed", "true");
  });
});
