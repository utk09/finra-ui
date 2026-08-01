import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DateTenorInputBase } from "./DateTenorInput";

// The styled wrapper supplies its own indicator and hides the render prop, so
// the base layer is the only place this seam can be driven.
describe("DateTenorInputBase - indicator", () => {
  it("toggles the popup from the indicator, and reports open state to it", async () => {
    const user = userEvent.setup();
    render(
      <DateTenorInputBase
        dateAriaLabel="Date"
        renderIndicator={(isOpen) => (isOpen ? "close" : "open")}
      />,
    );

    await user.click(screen.getByText("open"));
    expect(screen.getByRole("option", { name: "3M" })).toBeInTheDocument();

    // The same affordance has to shut it again - opening from a control that
    // then does nothing reads as a broken toggle.
    await user.click(screen.getByText("close"));
    expect(screen.queryByRole("option", { name: "3M" })).not.toBeInTheDocument();
  });

  it("renders no indicator at all when none is supplied", async () => {
    const user = userEvent.setup();
    render(<DateTenorInputBase dateAriaLabel="Date" />);

    await user.click(screen.getByLabelText("Date"));
    // The base ships no chrome of its own, so an unstyled consumer gets a bare
    // field rather than a placeholder glyph they then have to hide.
    expect(screen.getByRole("option", { name: "3M" })).toBeInTheDocument();
    expect(screen.queryByText("open")).not.toBeInTheDocument();
  });

  it("classes the indicator only while open", async () => {
    const user = userEvent.setup();
    render(
      <DateTenorInputBase
        dateAriaLabel="Date"
        renderIndicator={(isOpen) => (isOpen ? "close" : "open")}
        classNames={{ indicator: "ind", indicatorOpen: "ind-open" }}
      />,
    );

    expect(screen.getByText("open", { selector: ".ind" })).toBeInTheDocument();
    await user.click(screen.getByText("open"));
    expect(screen.getByText("close", { selector: ".ind.ind-open" })).toBeInTheDocument();
  });
});
