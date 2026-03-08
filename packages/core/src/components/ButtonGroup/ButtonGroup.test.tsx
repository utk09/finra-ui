import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ButtonGroup } from "./ButtonGroup";

describe("ButtonGroup", () => {
  it("renders children", () => {
    render(
      <ButtonGroup>
        <button type="button">One</button>
        <button type="button">Two</button>
      </ButtonGroup>,
    );
    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("Two")).toBeInTheDocument();
  });

  it('has role="group"', () => {
    render(
      <ButtonGroup>
        <button type="button">One</button>
      </ButtonGroup>,
    );
    expect(screen.getByRole("group")).toBeInTheDocument();
  });

  it('has data-finra-ui="button-group" attribute', () => {
    render(
      <ButtonGroup>
        <button type="button">One</button>
      </ButtonGroup>,
    );
    expect(screen.getByRole("group")).toHaveAttribute("data-finra-ui", "button-group");
  });

  it("applies horizontal class by default", () => {
    const { container } = render(
      <ButtonGroup>
        <button type="button">One</button>
      </ButtonGroup>,
    );
    const group = container.firstElementChild;
    expect(group?.className).toMatch(/buttonGroup/);
    // Should NOT have vertical class by default
    expect(group?.className).not.toMatch(/vertical/);
  });

  it("applies vertical class", () => {
    const { container } = render(
      <ButtonGroup orientation="vertical">
        <button type="button">One</button>
      </ButtonGroup>,
    );
    const group = container.firstElementChild;
    expect(group?.className).toMatch(/vertical/);
  });

  it("merges custom className", () => {
    const { container } = render(
      <ButtonGroup className="custom">
        <button type="button">One</button>
      </ButtonGroup>,
    );
    const group = container.firstElementChild;
    expect(group?.className).toContain("custom");
  });
});
