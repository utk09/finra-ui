import type { Meta, StoryObj } from "@storybook/react-vite";
import { ButtonBase } from "@utk09/finra-ui/unstyled";
import { expect, userEvent, within } from "storybook/test";

import { forwardsTo } from "../_shared";

const meta: Meta<typeof ButtonBase> = {
  title: "Unstyled/ButtonBase",
  component: ButtonBase,
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
      <ButtonBase type="button">Unstyled Button</ButtonBase>
      <ButtonBase type="submit">Submit</ButtonBase>
      <ButtonBase type="button" disabled>
        Disabled
      </ButtonBase>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Unstyled Button" });
    await expect(button).toBeVisible();
    await userEvent.click(button);
  },
};

export const AsChild: Story = {
  render: () => (
    <ButtonBase asChild>
      <a href="#example">I render as an anchor tag</a>
    </ButtonBase>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link");
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "#example");
  },
};
