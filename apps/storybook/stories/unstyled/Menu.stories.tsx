import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@utk09/finra-ui/unstyled";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { menuItemStyle, overlayPanel, triggerButton } from "./_demoStyles";

const meta: Meta<typeof Menu> = {
  title: "Unstyled/Menu",
  component: Menu,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Menu>
      <MenuTrigger style={triggerButton}>Actions</MenuTrigger>
      <MenuContent style={{ ...overlayPanel, padding: "0.25rem", minWidth: 160 }}>
        <MenuItem onSelect={() => undefined} style={menuItemStyle}>
          Edit
        </MenuItem>
        <MenuItem onSelect={() => undefined} style={menuItemStyle}>
          Duplicate
        </MenuItem>
        <MenuSeparator style={{ height: 1, background: "#ddd", margin: "0.25rem 0" }} />
        <MenuItem onSelect={() => undefined} style={menuItemStyle}>
          Delete
        </MenuItem>
      </MenuContent>
    </Menu>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Actions" }));
    // Roving focus lands on the first item; selecting closes the menu.
    const menu = await within(document.body).findByRole("menu");
    await expect(within(menu).getByRole("menuitem", { name: "Edit" })).toBeVisible();
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Delete" }));
    await waitFor(() => expect(within(document.body).queryByRole("menu")).toBeNull());
  },
};
