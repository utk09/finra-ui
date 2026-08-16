import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  createToastStore,
  SoundSettings,
  soundEngine,
  Toaster,
  toast,
} from "@utk09/finra-ui";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { darkModeOpen, Row, Stack } from "./_shared";

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
    dismissLabel: { control: "text" },
    className: { control: { disable: true } },
    renderToast: { control: { disable: true } },
  },
  args: {
    position: "bottom-right",
    label: "Notifications",
  },
  render: (args) => (
    <>
      <ToastButtons />
      <Toaster {...args} />
    </>
  ),
};

/** The shared button row, so `WithSound` can put a sound control above it. */
function ToastButtons() {
  return (
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
      <Button
        variant="secondary"
        onClick={() =>
          toast.success({
            title: "Filled",
            description: "2M EURUSD at 1.0921.",
            sound: "chime",
          })
        }>
        With sound
      </Button>
    </div>
  );
}

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

/**
 * The dismiss button's accessible name is English by default, so an app that
 * ships in another language passes `dismissLabel`. It is the button's only
 * name: the glyph inside it is decorative.
 */
export const TranslatedDismissLabel: Story = {
  args: { dismissLabel: "Cerrar notificación" },
  play: async ({ canvasElement }) => {
    toast.clear();
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Success" }));

    const toastEl = await within(document.body).findByRole("status");
    // Both states: the passed name is there and the default one is gone.
    const close = within(toastEl).getByRole("button", { name: "Cerrar notificación" });
    await expect(
      within(toastEl).queryByRole("button", { name: "Dismiss notification" }),
    ).toBeNull();
    await userEvent.click(close);
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

/**
 * Restyling toasts. Two regions are mounted so one raised toast renders in both,
 * default on the right and overridden on the left.
 *
 * Two mounted `Toaster`s is exactly what the API docs tell you not to do in an
 * app, because every toast then renders twice. It is done here so the same toast
 * can be seen styled two ways at once; ship one.
 *
 * The region is portalled, so `container` is what brings it back inside the
 * element carrying the overrides. Sentiment colour, radius and panel surface are
 * semantic tokens; the accent bar's width has no token of its own and is reached
 * through `[data-finra-ui="toast"]`, which wins because the library ships inside
 * `@layer finra-ui`.
 */
export const Overrides: Story = {
  parameters: { layout: "padded" },
  render: function Render() {
    const [scope, setScope] = useState<HTMLDivElement | null>(null);
    return (
      <>
        <Button
          onClick={() =>
            toast.success({ title: "Order filled", description: "2M EURUSD at 1.0921." })
          }>
          Raise a toast
        </Button>
        <Toaster position="bottom-right" label="Default notifications" />
        <div
          ref={setScope}
          className="toast-override-demo"
          style={
            {
              "--finra-status-success-accent": "#7c3aed",
              "--finra-radius-md": "1rem",
              "--finra-container-background": "#faf5ff",
            } as React.CSSProperties
          }>
          <style>{`
            :where(.toast-override-demo) [data-finra-ui="toast"] {
              border-inline-start-width: 0.5rem;
            }
            :where(.toast-override-demo) [data-finra-ui="toast-title"] {
              text-transform: uppercase;
              letter-spacing: var(--finra-tracking-wide);
            }
          `}</style>
          <Toaster position="bottom-left" label="Overridden notifications" container={scope} />
        </div>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    toast.clear();
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Raise a toast" }));
    // Both regions render it, so wait for the pair rather than the first match.
    await waitFor(async () =>
      expect(await within(document.body).findAllByRole("status")).toHaveLength(2),
    );
  },
};

/**
 * `ToastInput.sound` attaches a cue, played once when the toast is raised.
 *
 * **To hear it, switch Sound on first.** The shared `soundEngine` ships muted
 * and nothing in this library unmutes it for you, so a toast with a cue is
 * silent until a person opts in. The control above is `SoundSettings` bound to
 * that same shared engine, which is the whole mechanism: no provider, no
 * configuration, one process-wide setting that any control can drive. Flip it
 * on, then press "With sound" and the toast arrives with a `chime`.
 *
 * Leave it off and the toast is identical in every other way, which is the
 * point: sound is additive and never a second source of truth for the toast.
 */
export const WithSound: Story = {
  render: (args) => (
    <Stack gap="1.25rem">
      <SoundSettings engine={soundEngine} />
      <ToastButtons />
      <Toaster {...args} />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    toast.clear();
    const canvas = within(canvasElement);

    // Muted by default, and nothing in the library changes that. This is the
    // promise the engine makes, asserted where a consumer would first meet it.
    await expect(canvas.getByRole("switch", { name: "Sound" })).not.toBeChecked();

    await userEvent.click(canvas.getByRole("button", { name: "With sound" }));

    // Scoped to the notification region, not to the body: `SoundSettings`
    // carries a polite `role="status"` of its own, so this is the one story
    // where the two live regions are on screen together and a body-wide query
    // matches both.
    const region = within(document.body).getByRole("region", { name: "Notifications" });
    const toastEl = await within(region).findByRole("status");
    await expect(toastEl).toHaveTextContent("Filled");
  },
};

/**
 * `controller` points a region at a queue the global `toast()` does not reach.
 *
 * The default is the shared controller, which is what lets `toast()` be called
 * from anywhere with no prop-drilling. Pass one from `createToastStore` when a
 * region needs its own queue: an isolated sound engine, a region scoped to one
 * workspace pane, or a test that must not bleed into the shared queue. The
 * buttons on the left write to a private controller and the one on the right to
 * the shared one, and neither appears in the other's region.
 */
export const OwnController: Story = {
  parameters: { layout: "padded" },
  render: function Render() {
    const own = useState(() => createToastStore())[0];
    return (
      <Stack gap="1rem">
        <Row gap="0.5rem">
          <Button variant="secondary" onClick={() => own.toast({ description: "Private queue" })}>
            Raise on my controller
          </Button>
          <Button variant="secondary" onClick={() => toast({ description: "Shared queue" })}>
            Raise on the shared one
          </Button>
        </Row>
        <Toaster controller={own} position="top-left" label="Pane notifications" />
        <Toaster position="bottom-right" label="Notifications" />
      </Stack>
    );
  },
  play: async ({ canvasElement }) => {
    toast.clear();
    const canvas = within(canvasElement);
    const body = within(document.body);

    await userEvent.click(canvas.getByRole("button", { name: "Raise on my controller" }));

    const pane = body.getByRole("region", { name: "Pane notifications" });
    const shared = body.getByRole("region", { name: "Notifications" });
    await expect(within(pane).getByText("Private queue")).toBeInTheDocument();
    // The other half: it did not also land in the shared region.
    await expect(within(shared).queryByText("Private queue")).toBeNull();
  },
};

/** A toast left on screen in dark mode, so axe audits the portalled notification. */
export const DarkModeOpen: Story = {
  ...darkModeOpen,
  play: async ({ canvasElement }) => {
    toast.clear();
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Success" }));
    await within(document.body).findByRole("status");
  },
};
