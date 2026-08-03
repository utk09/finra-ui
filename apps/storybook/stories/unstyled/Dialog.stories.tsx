import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@utk09/finra-ui/unstyled";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { overlayPanel, triggerButton } from "./_demoStyles";

const meta: Meta<typeof Dialog> = {
  title: "Unstyled/Dialog",
  component: Dialog,
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
      {/*
        The backdrop is rendered inside `DialogContent`, so there is no child
        element to put an inline style on. `overlayClassName` is its hook. With
        no class it renders as an empty, invisible div: the base ships no CSS.
      */}
      <style>{`
        .unstyled-dialog-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
        }
      `}</style>
      <Dialog>
        <DialogTrigger style={triggerButton}>Open dialog</DialogTrigger>
        <DialogContent
          overlayClassName="unstyled-dialog-backdrop"
          style={{
            ...overlayPanel,
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}>
          <DialogTitle style={{ margin: "0 0 0.5rem" }}>Delete item?</DialogTitle>
          <DialogDescription style={{ marginTop: 0 }}>This cannot be undone.</DialogDescription>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <DialogClose style={triggerButton}>Cancel</DialogClose>
            <DialogClose style={triggerButton}>Delete</DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Open dialog" }));
    // Content portals to <body>, traps focus, and locks body scroll.
    const dialog = await within(document.body).findByRole("dialog");
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
  },
};
