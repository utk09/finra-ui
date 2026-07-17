import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "./Popover";

function renderPopover() {
  return render(
    <Popover>
      <PopoverTrigger>Open</PopoverTrigger>
      <PopoverContent aria-label="Filters">
        <p>Body</p>
        <PopoverClose>Done</PopoverClose>
      </PopoverContent>
    </Popover>,
  );
}

describe("Popover (styled)", () => {
  it("applies the data-finra-ui identifier and panel class when open", async () => {
    const user = userEvent.setup();
    renderPopover();
    await user.click(screen.getByRole("button", { name: "Open" }));

    const panel = screen.getByRole("dialog");
    expect(panel).toHaveAttribute("data-finra-ui", "popover");
    expect(panel.className).toMatch(/panel/);
  });

  it("closes via the styled close button", async () => {
    const user = userEvent.setup();
    renderPopover();
    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
