import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  FormField,
  Input,
} from "@utk09/finra-ui";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { darkModeOpen } from "./_shared";

/** Filler long enough to make the dialog body scroll. */
const SCROLL_SECTIONS = Array.from({ length: 12 }, (_, i) => `Section ${i + 1}`);

const meta: Meta<typeof Dialog> = {
  title: "Components/Dialog",
  component: Dialog,
  // Without these the page documents only the root's two props, and the parts
  // a consumer actually renders are undocumented.
  subcomponents: { DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose },
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    dismissOnEscape: { control: "boolean", table: { defaultValue: { summary: "true" } } },
    dismissOnOutside: { control: "boolean", table: { defaultValue: { summary: "true" } } },
    children: { control: { disable: true } },
    open: { control: { disable: true } },
    defaultOpen: { control: { disable: true } },
    onOpenChange: { control: { disable: true } },
  },
  args: {
    dismissOnEscape: true,
    dismissOnOutside: true,
  },
  render: (args) => (
    <Dialog {...args}>
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
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Modal confirm dialog: focus is trapped, body scroll is locked, Escape/outside dismiss. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Open dialog" }));

    // The dialog is portalled to <body>, outside the story canvas.
    const dialog = await within(document.body).findByRole("dialog");
    // Wait for the fade-in animation to settle before asserting visibility.
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(dialog).toHaveAttribute("aria-modal", "true");

    // Close it so the story doesn't leave a modal open in the docs.
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
  },
};

/** A dialog is a natural container for a short form; focus starts inside it. */
export const FormDialog: Story = {
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <Button>Edit profile</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Edit profile</DialogTitle>
        <DialogDescription>Update the details shown on your account.</DialogDescription>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            minInlineSize: "18rem",
          }}>
          <FormField label="Display name">
            <Input defaultValue="Jordan Lee" />
          </FormField>
          <FormField label="Email" helperText="Used for trade confirmations.">
            <Input type="email" defaultValue="jordan@example.com" />
          </FormField>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <DialogClose asChild>
            <Button variant="tertiary">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button>Save</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  ),
};

/** With both dismiss paths off, the dialog can only be closed by an explicit control. */
export const NonDismissable: Story = {
  args: { dismissOnEscape: false, dismissOnOutside: false },
};

/** Long bodies scroll within the panel while the header stays put. */
export const LongContent: Story = {
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <Button>Terms</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Terms of service</DialogTitle>
        <DialogDescription>Please review before continuing.</DialogDescription>
        <div style={{ maxBlockSize: "40vh", overflowY: "auto" }}>
          {SCROLL_SECTIONS.map((section) => (
            <p key={section} style={{ marginBlock: "0.5rem" }}>
              {section}. Trading involves risk and past performance does not guarantee future
              results. All orders are subject to review and may be rejected at our discretion.
            </p>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <DialogClose asChild>
            <Button>I agree</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  ),
};

/** Drive `open` yourself when another control (not a `DialogTrigger`) opens the dialog. */
export const Controlled: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open externally</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogTitle>Controlled dialog</DialogTitle>
            <DialogDescription>Its open state lives in the parent component.</DialogDescription>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <DialogClose asChild>
                <Button>Done</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  },
};

/**
 * Everything here is scoped to one wrapper, including the panel and backdrop.
 *
 * They are portalled to `document.body` by default, so nothing in your tree is
 * their ancestor and a token set there cannot reach them. Pass `container` to
 * portal them into a node you own.
 *
 * ```tsx
 * const [scope, setScope] = useState<HTMLDivElement | null>(null);
 *
 * <div ref={setScope} className="brand-region">
 *   <DialogContent container={scope}>...</DialogContent>
 * </div>
 * ```
 */
export const Overrides: Story = {
  render: function Render(args) {
    const [scope, setScope] = useState<HTMLDivElement | null>(null);
    return (
      <div
        ref={setScope}
        style={
          {
            "--finra-container-background": "#1e1b4b",
            "--finra-container-foreground": "#e0e7ff",
            "--finra-container-foreground-muted": "#c7d2fe",
            "--finra-container-border": "#4338ca",
          } as React.CSSProperties
        }>
        <Dialog {...args}>
          <DialogTrigger asChild>
            <Button>Open branded dialog</Button>
          </DialogTrigger>
          <DialogContent container={scope}>
            <DialogTitle>Confirm order</DialogTitle>
            <DialogDescription>
              The panel and its backdrop follow the tokens on the wrapper.
            </DialogDescription>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <DialogClose asChild>
                <Button>Close</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    // Open it, so the restyled surface is what the story shows.
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Open branded dialog" }));
    await canvas.findByRole("dialog");
  },
};

/** The dialog left open in dark mode, so axe audits the portalled surface and its backdrop. */
export const DarkModeOpen: Story = {
  ...darkModeOpen,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Open dialog" }));
    const dialog = await within(document.body).findByRole("dialog");
    await waitFor(() => expect(dialog).toBeVisible());
  },
};
