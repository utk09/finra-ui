import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "./Popover";

function renderPopover(props?: Parameters<typeof Popover>[0]) {
  return render(
    <Popover {...props}>
      <PopoverTrigger>Open</PopoverTrigger>
      <PopoverContent aria-label="Filters">
        <p>Body</p>
        <PopoverClose>Done</PopoverClose>
      </PopoverContent>
    </Popover>,
  );
}

describe("Popover", () => {
  it("is closed initially and opens on trigger click", async () => {
    const user = userEvent.setup();
    renderPopover();

    const trigger = screen.getByRole("button", { name: "Open" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(trigger);

    const panel = screen.getByRole("dialog");
    expect(panel).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveAttribute("aria-labelledby", trigger.id);
  });

  it("toggles closed when the trigger is clicked again (trigger excluded from outside-dismiss)", async () => {
    const user = userEvent.setup();
    renderPopover();
    const trigger = screen.getByRole("button", { name: "Open" });

    await user.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(trigger);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    renderPopover();
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on an outside pointer", async () => {
    const user = userEvent.setup();
    renderPopover();
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not close on an outside pointer when dismissOnOutside is false", async () => {
    const user = userEvent.setup();
    renderPopover({ dismissOnOutside: false });
    await user.click(screen.getByRole("button", { name: "Open" }));

    fireEvent.pointerDown(document.body);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not close on Escape when dismissOnEscape is false", async () => {
    const user = userEvent.setup();
    renderPopover({ dismissOnEscape: false });
    await user.click(screen.getByRole("button", { name: "Open" }));

    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes via PopoverClose", async () => {
    const user = userEvent.setup();
    renderPopover();
    await user.click(screen.getByRole("button", { name: "Open" }));

    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("respects a controlled open state", () => {
    render(
      <Popover open>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent aria-label="Filters">Body</PopoverContent>
      </Popover>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("supports asChild on the trigger", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger asChild>
          <a href="#anchor">Open</a>
        </PopoverTrigger>
        <PopoverContent aria-label="Filters">Body</PopoverContent>
      </Popover>,
    );
    const trigger = screen.getByRole("link", { name: "Open" });
    await user.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("calls a custom trigger onClick and still opens", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Popover>
        <PopoverTrigger onClick={onClick}>Open</PopoverTrigger>
        <PopoverContent aria-label="Filters">Body</PopoverContent>
      </Popover>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not open when the trigger onClick prevents default", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger onClick={(event) => event.preventDefault()}>Open</PopoverTrigger>
        <PopoverContent aria-label="Filters">Body</PopoverContent>
      </Popover>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not close when a PopoverClose onClick prevents default", async () => {
    const user = userEvent.setup();
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent aria-label="Filters">
          <PopoverClose onClick={(event) => event.preventDefault()}>Done</PopoverClose>
        </PopoverContent>
      </Popover>,
    );
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("supports asChild on PopoverClose", async () => {
    const user = userEvent.setup();
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent aria-label="Filters">
          <PopoverClose asChild>
            <a href="#x">Done</a>
          </PopoverClose>
        </PopoverContent>
      </Popover>,
    );
    await user.click(screen.getByRole("link", { name: "Done" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("throws when a part is used outside a Popover", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<PopoverTrigger>Open</PopoverTrigger>)).toThrow(
      /must be used within a <Popover>/,
    );
    spy.mockRestore();
  });
});
