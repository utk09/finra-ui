import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, toast, Toaster } from "@utk09/finra-ui";
import { expect, userEvent, within } from "storybook/test";

const POSITIONS = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
] as const;

const meta: Meta<typeof Toaster> = {
  title: "Components/Toast",
  component: Toaster,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    position: {
      control: "select",
      options: POSITIONS,
      table: { defaultValue: { summary: "bottom-right" } },
    },
    label: { control: "text", table: { defaultValue: { summary: "Notifications" } } },
    className: { table: { disable: true } },
    renderToast: { table: { disable: true } },
  },
  args: {
    position: "bottom-right",
    label: "Notifications",
  },
  render: (args) => (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        <Button onClick={() => toast.success({ title: "Saved", description: "Changes saved." })}>
          Success
        </Button>
        <Button
          sentiment="danger"
          onClick={() => toast.error({ title: "Failed", description: "Could not save." })}>
          Error
        </Button>
        <Button
          sentiment="warning"
          onClick={() => toast.warning({ title: "Heads up", description: "Market closes soon." })}>
          Warning
        </Button>
        <Button
          variant="secondary"
          onClick={() => toast.info({ title: "FYI", description: "Report is ready." })}>
          Info
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast({
              description: "Item moved to archive.",
              action: { label: "Undo", onClick: () => undefined },
            })
          }>
          With action
        </Button>
        <Button
          variant="tertiary"
          onClick={() =>
            toast({ title: "Sticky", description: "Stays until dismissed.", duration: 0 })
          }>
          Persistent
        </Button>
      </div>
      <Toaster {...args} />
    </>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Fires a success toast, asserts the live region, then dismisses it. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    toast.clear(); // start clean so findByRole("status") matches exactly one
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Success" }));

    // Toasts portal to <body>, outside the story canvas.
    const toastEl = await within(document.body).findByRole("status");
    await expect(toastEl).toHaveTextContent("Saved");

    // Dismiss so the story doesn't leave a toast lingering.
    await userEvent.click(within(toastEl).getByRole("button", { name: "Dismiss notification" }));
  },
};

/** One button per sentiment. Danger/warning announce assertively (`role=alert`). */
export const Sentiments: Story = {};

/** An action button runs a callback, then dismisses the toast (e.g. Undo). */
export const WithAction: Story = {
  play: async ({ canvasElement }) => {
    toast.clear();
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "With action" }));

    const toastEl = await within(document.body).findByRole("status");
    await userEvent.click(within(toastEl).getByRole("button", { name: "Undo" }));
    await expect(within(document.body).queryByText("Item moved to archive.")).toBeNull();
  },
};

/** Anchored to the top-centre of the viewport. */
export const TopCenter: Story = {
  args: { position: "top-center" },
};

/** Anchored to the bottom-left. */
export const BottomLeft: Story = {
  args: { position: "bottom-left" },
};

/** `renderToast` replaces the default item entirely; `controls.dismiss` still works. */
export const CustomAppearance: Story = {
  args: {
    renderToast: (t, controls) => (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.75rem 1rem",
          background: "var(--finra-container-foreground)",
          color: "var(--finra-container-background)",
          borderRadius: "var(--finra-radius-md)",
          boxShadow: "var(--finra-shadow-lg)",
        }}>
        <strong>{t.title ?? t.description}</strong>
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={controls.dismiss}
          style={{
            marginInlineStart: "auto",
            background: "none",
            border: "none",
            color: "inherit",
            cursor: "pointer",
          }}>
          ✕
        </button>
      </div>
    ),
  },
};
