import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

function renderTooltip() {
  return render(
    <Tooltip open>
      <TooltipTrigger>Trigger</TooltipTrigger>
      <TooltipContent>Helpful hint</TooltipContent>
    </Tooltip>,
  );
}

describe("Tooltip (styled)", () => {
  it("applies the data-finra-ui identifier and tooltip class to the content", () => {
    renderTooltip();
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveAttribute("data-finra-ui", "tooltip");
    expect(tooltip.className).toMatch(/tooltip/);
    expect(tooltip).toHaveTextContent("Helpful hint");
  });

  it("merges a caller className with the tooltip class", () => {
    render(
      <Tooltip open>
        <TooltipTrigger>Trigger</TooltipTrigger>
        <TooltipContent className="custom">Hint</TooltipContent>
      </Tooltip>,
    );
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.className).toMatch(/tooltip/);
    expect(tooltip.className).toMatch(/custom/);
  });
});
