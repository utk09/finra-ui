import type { Meta, StoryObj } from "@storybook/react-vite";
import { TextareaBase } from "@utk09/finra-ui/unstyled";
import { expect, userEvent, within } from "storybook/test";

import { forwardsTo } from "../_shared";

const meta: Meta<typeof TextareaBase> = {
  title: "Unstyled/TextareaBase",
  component: TextareaBase,
  parameters: {
    layout: "padded",
    docs: { forwardsTo: forwardsTo("textarea", "textarea element") },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 300 }}>
      <TextareaBase placeholder="Unstyled textarea" rows={3} aria-label="Default textarea" />
      <TextareaBase defaultValue="With content" rows={3} aria-label="Textarea with content" />
      <TextareaBase placeholder="Disabled" rows={3} disabled aria-label="Disabled textarea" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("Default textarea");
    await expect(textarea).toBeVisible();
    await userEvent.type(textarea, "Line 1\nLine 2");
    await expect(textarea).toHaveValue("Line 1\nLine 2");
  },
};
