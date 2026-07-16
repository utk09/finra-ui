import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@utk09/finra-ui";
import { expect, userEvent, within } from "storybook/test";

const meta: Meta<typeof Dialog> = {
  title: "Components/Dialog",
  component: Dialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "a11y-test"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Delete item?</DialogTitle>
        <DialogDescription>
          This permanently removes the item and cannot be undone.
        </DialogDescription>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <DialogClose asChild>
            <Button variant="tertiary">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button sentiment="danger">Delete</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Open dialog" }));

    // The dialog is portalled to <body>, outside the story canvas.
    const dialog = await within(document.body).findByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");

    // Close it so the story doesn't leave a modal open in the docs.
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
  },
};
