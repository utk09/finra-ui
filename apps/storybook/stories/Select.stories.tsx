import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select, SelectContent, SelectTrigger } from "@utk09/finra-ui";
import { expect, userEvent, waitFor, within } from "storybook/test";

const options = [
  { value: "aapl", label: "Apple" },
  { value: "msft", label: "Microsoft" },
  { value: "goog", label: "Alphabet" },
  { value: "amzn", label: "Amazon", disabled: true },
  { value: "nvda", label: "NVIDIA" },
];

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

const meta: Meta<typeof Select> = {
  title: "Components/Select",
  component: Select,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    placeholder: { control: "text" },
    placement: { control: "select", options: PLACEMENTS },
    offset: { control: { type: "number", min: 0, max: 40 } },
    loop: { control: "boolean" },
    dismissOnEscape: { control: "boolean" },
    dismissOnOutside: { control: "boolean" },
    // Not useful as interactive controls.
    options: { table: { disable: true } },
    children: { table: { disable: true } },
    value: { table: { disable: true } },
    defaultValue: { table: { disable: true } },
    open: { table: { disable: true } },
    defaultOpen: { table: { disable: true } },
    onValueChange: { table: { disable: true } },
    onOpenChange: { table: { disable: true } },
  },
  args: {
    options,
    placeholder: "Select a ticker",
    placement: "bottom",
    offset: 6,
    loop: true,
    dismissOnEscape: true,
    dismissOnOutside: true,
  },
  render: (args) => (
    <div style={{ inlineSize: "16rem" }}>
      <Select {...args}>
        <SelectTrigger aria-label="Ticker" />
        <SelectContent aria-label="Tickers" />
      </Select>
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: "Ticker" });
    await userEvent.click(trigger);

    // The listbox is portalled to <body>, outside the story canvas.
    const listbox = await within(document.body).findByRole("listbox");
    await waitFor(() => expect(listbox).toBeVisible());
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(within(listbox).getByRole("option", { name: "Microsoft" }));
    await waitFor(() => expect(within(document.body).queryByRole("listbox")).toBeNull());
    await expect(trigger).toHaveTextContent("Microsoft");
  },
};

export const WithSelectedValue: Story = {
  args: {
    defaultValue: "goog",
  },
};
