import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "./Menu";

function renderMenu(onSelect = vi.fn()) {
  render(
    <Menu>
      <MenuTrigger>Actions</MenuTrigger>
      <MenuContent aria-label="Actions">
        <MenuItem onSelect={onSelect}>Edit</MenuItem>
        <MenuSeparator />
        <MenuItem>Delete</MenuItem>
      </MenuContent>
    </Menu>,
  );
  return { onSelect };
}

describe("Menu (styled)", () => {
  it("applies data-finra-ui identifiers and classes when open", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole("button", { name: "Actions" }));

    const menu = screen.getByRole("menu");
    expect(menu).toHaveAttribute("data-finra-ui", "menu");
    expect(menu.className).toMatch(/panel/);

    const edit = screen.getByRole("menuitem", { name: "Edit" });
    expect(edit).toHaveAttribute("data-finra-ui", "menu-item");
    expect(edit.className).toMatch(/item/);

    expect(screen.getByRole("separator")).toHaveAttribute("data-finra-ui", "menu-separator");
  });

  it("selects a styled item and closes", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderMenu();
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));

    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
