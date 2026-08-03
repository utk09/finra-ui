import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toaster, toast } from "@utk09/finra-ui/unstyled";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { triggerButton } from "./_demoStyles";

const meta: Meta<typeof Toaster> = {
  title: "Unstyled/Toast",
  component: Toaster,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <>
      <button
        type="button"
        style={triggerButton}
        onClick={() => toast.success({ title: "Saved", description: "Changes saved." })}>
        Show toast
      </button>
      <Toaster />
    </>
  ),
  play: async ({ canvasElement }) => {
    toast.clear(); // isolate from other stories
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Show toast" }));
    // Toasts render into an aria-live region portalled to <body>.
    const toastEl = await within(document.body).findByRole("status");
    await expect(toastEl).toHaveTextContent("Saved");
    await userEvent.click(within(toastEl).getByRole("button", { name: "Dismiss notification" }));
    await waitFor(() => expect(within(document.body).queryByRole("status")).toBeNull());
  },
};
