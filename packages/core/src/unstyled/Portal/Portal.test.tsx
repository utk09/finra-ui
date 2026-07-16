import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Portal } from "./Portal";

// Portal is a DOM-placement primitive: its tests must assert where nodes land
// and what attributes the portal wrapper carries, which Testing Library queries
// cannot express - hence the targeted no-node-access exemptions below.

describe("Portal", () => {
  it("renders children into document.body by default", () => {
    const { container } = render(
      <Portal>
        <span>portalled</span>
      </Portal>,
    );

    const node = screen.getByText("portalled");
    expect(node).toBeInTheDocument();
    // The content lives under body, not the render container.
    expect(container.contains(node)).toBe(false);
    expect(document.body.contains(node)).toBe(true);
  });

  it("renders into a custom container when provided", () => {
    const custom = document.createElement("div");
    document.body.appendChild(custom);

    render(
      <Portal container={custom}>
        <span>in custom</span>
      </Portal>,
    );

    expect(custom.contains(screen.getByText("in custom"))).toBe(true);
    custom.remove();
  });

  it("renders in place when disabled", () => {
    const { container } = render(
      <Portal disabled>
        <span>inline</span>
      </Portal>,
    );

    expect(container.contains(screen.getByText("inline"))).toBe(true);
  });

  it("copies data-theme and data-density from the nearest ancestor onto the portal wrapper", () => {
    render(
      <div data-theme="dark" data-density="high">
        <Portal>
          <span>themed</span>
        </Portal>
      </div>,
    );

    // eslint-disable-next-line testing-library/no-node-access -- asserting portal wrapper attributes
    const wrapper = document.querySelector("[data-finra-ui-portal]");
    expect(wrapper).not.toBeNull();
    expect(wrapper).toHaveAttribute("data-theme", "dark");
    expect(wrapper).toHaveAttribute("data-density", "high");
    expect(wrapper).toContainElement(screen.getByText("themed"));
  });

  it("omits theme attributes when there is no themed ancestor", () => {
    render(
      <Portal>
        <span>unthemed</span>
      </Portal>,
    );

    // eslint-disable-next-line testing-library/no-node-access -- asserting portal wrapper attributes
    const wrapper = document.querySelector("[data-finra-ui-portal]");
    expect(wrapper).not.toBeNull();
    expect(wrapper).not.toHaveAttribute("data-theme");
    expect(wrapper).not.toHaveAttribute("data-density");
  });
});
