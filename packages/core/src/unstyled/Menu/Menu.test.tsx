import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "./Menu";

function renderMenu(onSelect = vi.fn()) {
  render(
    <Menu>
      <MenuTrigger>Actions</MenuTrigger>
      <MenuContent aria-label="Actions">
        <MenuItem onSelect={() => onSelect("edit")}>Edit</MenuItem>
        <MenuItem onSelect={() => onSelect("duplicate")}>Duplicate</MenuItem>
        <MenuSeparator />
        <MenuItem disabled onSelect={() => onSelect("archived")}>
          Archived
        </MenuItem>
        <MenuItem onSelect={() => onSelect("delete")}>Delete</MenuItem>
      </MenuContent>
    </Menu>,
  );
  return { onSelect };
}

const trigger = () => screen.getByRole("button", { name: "Actions" });
const item = (name: string) => screen.getByRole("menuitem", { name });

describe("Menu", () => {
  it("is closed initially with the right trigger ARIA", () => {
    renderMenu();
    expect(trigger()).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens on click and focuses the first item", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(trigger());

    const menu = screen.getByRole("menu");
    expect(menu).toBeInTheDocument();
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(trigger()).toHaveAttribute("aria-controls", menu.id);
    expect(item("Edit")).toHaveFocus();
  });

  it("moves focus with ArrowDown, skipping disabled items and wrapping", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(trigger());
    const menu = screen.getByRole("menu");

    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(item("Duplicate")).toHaveFocus();
    fireEvent.keyDown(menu, { key: "ArrowDown" }); // skips disabled "Archived"
    expect(item("Delete")).toHaveFocus();
    fireEvent.keyDown(menu, { key: "ArrowDown" }); // wraps to first
    expect(item("Edit")).toHaveFocus();
  });

  it("Home and End jump to the first and last enabled items", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(trigger());
    const menu = screen.getByRole("menu");

    fireEvent.keyDown(menu, { key: "End" });
    expect(item("Delete")).toHaveFocus();
    fireEvent.keyDown(menu, { key: "Home" });
    expect(item("Edit")).toHaveFocus();
  });

  it("selects an item on click, calls onSelect, closes, and restores focus", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderMenu();
    await user.click(trigger());

    await user.click(item("Duplicate"));
    expect(onSelect).toHaveBeenCalledWith("duplicate");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
  });

  it("does not select a disabled item", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderMenu();
    await user.click(trigger());

    await user.click(item("Archived"));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(trigger());

    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
  });

  it("closes on an outside pointer", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(trigger());
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("typeahead focuses the next matching item", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(trigger());
    const menu = screen.getByRole("menu");

    fireEvent.keyDown(menu, { key: "d" }); // Edit(0) -> Duplicate(1)
    expect(item("Duplicate")).toHaveFocus();
  });

  it("opens focused on the last item with ArrowUp from the trigger", () => {
    renderMenu();
    fireEvent.keyDown(trigger(), { key: "ArrowUp" });
    expect(item("Delete")).toHaveFocus();
  });

  it("opens with ArrowDown from the trigger, focusing the first item", () => {
    renderMenu();
    fireEvent.keyDown(trigger(), { key: "ArrowDown" });
    expect(item("Edit")).toHaveFocus();
  });

  it("supports asChild on the trigger", async () => {
    const user = userEvent.setup();
    render(
      <Menu>
        <MenuTrigger asChild>
          <a href="#x">Open</a>
        </MenuTrigger>
        <MenuContent aria-label="Actions">
          <MenuItem>Edit</MenuItem>
        </MenuContent>
      </Menu>,
    );
    await user.click(screen.getByRole("link", { name: "Open" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("toggles closed when the trigger is clicked again", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(trigger());
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await user.click(trigger());
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens on Enter and on Space from the trigger", () => {
    renderMenu();
    fireEvent.keyDown(trigger(), { key: "Enter" });
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });

    fireEvent.keyDown(trigger(), { key: " " });
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("ignores unrelated trigger keys and keydown while already open", () => {
    renderMenu();
    fireEvent.keyDown(trigger(), { key: "a" }); // no-op while closed
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    fireEvent.keyDown(trigger(), { key: "ArrowDown" }); // opens
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.keyDown(trigger(), { key: "ArrowDown" }); // ctx.open -> early return, no throw
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("respects preventDefault on the trigger onClick and onKeyDown", async () => {
    const user = userEvent.setup();
    render(
      <Menu>
        <MenuTrigger onClick={(e) => e.preventDefault()} onKeyDown={(e) => e.preventDefault()}>
          Actions
        </MenuTrigger>
        <MenuContent aria-label="Actions">
          <MenuItem>Edit</MenuItem>
        </MenuContent>
      </Menu>,
    );
    const btn = screen.getByRole("button", { name: "Actions" });
    await user.click(btn);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    fireEvent.keyDown(btn, { key: "ArrowDown" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("does not close when a MenuItem onClick prevents default", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Menu defaultOpen>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuContent aria-label="Actions">
          <MenuItem onClick={(e) => e.preventDefault()} onSelect={onSelect}>
            Edit
          </MenuItem>
        </MenuContent>
      </Menu>,
    );
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("ignores typeahead with modifiers or Space, and forwards content onKeyDown", async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(
      <Menu>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuContent aria-label="Actions" onKeyDown={onKeyDown}>
          <MenuItem>Edit</MenuItem>
          <MenuItem>Duplicate</MenuItem>
        </MenuContent>
      </Menu>,
    );
    await user.click(screen.getByRole("button", { name: "Actions" }));
    const menu = screen.getByRole("menu");

    fireEvent.keyDown(menu, { key: "d", metaKey: true }); // modifier -> no typeahead
    expect(onKeyDown).toHaveBeenCalled();
    expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus();

    fireEvent.keyDown(menu, { key: " " }); // Space -> no typeahead
    expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus();
  });

  it("throws when a part is used outside a Menu", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<MenuItem>Edit</MenuItem>)).toThrow(/must be used within a <Menu>/);
    spy.mockRestore();
  });
});
