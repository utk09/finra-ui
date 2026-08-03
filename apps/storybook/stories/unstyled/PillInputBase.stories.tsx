import type { Meta, StoryObj } from "@storybook/react-vite";
import { PillInputBase } from "@utk09/finra-ui/unstyled";
import { expect, userEvent, within } from "storybook/test";

const meta: Meta<typeof PillInputBase> = {
  title: "Unstyled/PillInputBase",
  component: PillInputBase,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 400 }}>
      <PillInputBase placeholder="Type and press Enter" aria-label="Tags" />
      <PillInputBase
        values={["React", "TypeScript"]}
        placeholder="Controlled"
        aria-label="Controlled pills"
      />
      <PillInputBase placeholder="Disabled" disabled aria-label="Disabled pills" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Tags" });
    await expect(input).toBeVisible();
    await userEvent.type(input, "hello{Enter}");
  },
};
