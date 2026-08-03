import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconButtonBase } from "@utk09/finra-ui/unstyled";
import { expect, within } from "storybook/test";

import { CloseIcon, EditIcon, PlusIcon, SearchIcon } from "../_icons";
import { forwardsTo } from "../_shared";

const meta: Meta<typeof IconButtonBase> = {
  title: "Unstyled/IconButtonBase",
  component: IconButtonBase,
  parameters: {
    layout: "padded",
    docs: { forwardsTo: forwardsTo("button", "button element") },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <IconButtonBase type="button" icon={<PlusIcon />} aria-label="Add item" />
      <IconButtonBase type="button" icon={<EditIcon />} aria-label="Edit" />
      <IconButtonBase type="button" icon={<CloseIcon />} aria-label="Close" />
      <IconButtonBase type="button" icon={<SearchIcon />} aria-label="Search" disabled />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const addButton = canvas.getByRole("button", { name: "Add item" });
    await expect(addButton).toBeVisible();
  },
};
