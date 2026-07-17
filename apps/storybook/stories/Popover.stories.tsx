import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@utk09/finra-ui";
import { expect, userEvent, waitFor, within } from "storybook/test";

const PLACEMENTS = [
  "top",
  "top-start",
  "top-end",
  "right",
  "right-start",
  "right-end",
  "bottom",
  "bottom-start",
  "bottom-end",
  "left",
  "left-start",
  "left-end",
] as const;

const meta: Meta<typeof Popover> = {
  title: "Components/Popover",
  component: Popover,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    placement: { control: "select", options: PLACEMENTS },
    offset: { control: { type: "number", min: 0, max: 40 } },
    dismissOnEscape: { control: "boolean" },
    dismissOnOutside: { control: "boolean" },
    children: { table: { disable: true } },
    open: { table: { disable: true } },
    defaultOpen: { table: { disable: true } },
    onOpenChange: { table: { disable: true } },
  },
  args: {
    placement: "bottom",
    offset: 8,
    dismissOnEscape: true,
    dismissOnOutside: true,
  },
  render: (args) => (
    <Popover {...args}>
      <PopoverTrigger asChild>
        <Button>Filters</Button>
      </PopoverTrigger>
      <PopoverContent aria-label="Filter options">
        <p style={{ margin: 0 }}>Adjust how the table is filtered.</p>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <PopoverClose asChild>
            <Button variant="tertiary">Close</Button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Filters" });
    await userEvent.click(trigger);

    // The panel is portalled to <body>, outside the story canvas.
    const panel = await within(document.body).findByRole("dialog");
    // Wait for the entrance animation to settle before asserting visibility.
    await waitFor(() => expect(panel).toBeVisible());
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    // Close it so the story doesn't leave the popover open in the docs.
    await userEvent.click(within(panel).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
  },
};
