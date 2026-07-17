import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@utk09/finra-ui";
import { expect, userEvent, waitFor, within } from "storybook/test";

const PLACEMENTS = [
  "top",
  "top-start",
  "top-end",
  "right",
  "bottom",
  "bottom-start",
  "bottom-end",
  "left",
] as const;

const meta: Meta<typeof Tooltip> = {
  title: "Components/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    openDelay: { control: { type: "number", min: 0, max: 2000, step: 50 } },
    closeDelay: { control: { type: "number", min: 0, max: 2000, step: 50 } },
    placement: { control: "select", options: PLACEMENTS },
    children: { table: { disable: true } },
    open: { table: { disable: true } },
    defaultOpen: { table: { disable: true } },
    onOpenChange: { table: { disable: true } },
  },
  args: {
    openDelay: 0,
    closeDelay: 0,
    placement: "top",
  },
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger asChild>
        <Button>Hover or focus me</Button>
      </TooltipTrigger>
      <TooltipContent>Saves without closing the record.</TooltipContent>
    </Tooltip>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Hover or focus me" });

    // Focus shows the tooltip and wires aria-describedby.
    await userEvent.tab();
    await expect(trigger).toHaveFocus();

    // The tooltip is portalled to <body>, outside the story canvas.
    const tooltip = await within(document.body).findByRole("tooltip");
    // Wait for the fade-in animation to settle before asserting visibility.
    await waitFor(() => expect(tooltip).toBeVisible());
    await expect(trigger).toHaveAttribute("aria-describedby", tooltip.id);

    // Escape hides it immediately.
    await userEvent.keyboard("{Escape}");
    await expect(within(document.body).queryByRole("tooltip")).toBeNull();
  },
};

export const Placements: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "2rem" }}>
      {(["top", "right", "bottom", "left"] as const).map((placement) => (
        <Tooltip key={placement} placement={placement} openDelay={0}>
          <TooltipTrigger asChild>
            <Button variant="secondary">{placement}</Button>
          </TooltipTrigger>
          <TooltipContent>Placed on {placement}.</TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
};
