import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  FormField,
  Input,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@utk09/finra-ui";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { darkModeOpen } from "./_shared";

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
  // Without these the page documents only the root, and the parts a consumer
  // actually renders are undocumented.
  subcomponents: { PopoverTrigger, PopoverContent, PopoverClose },
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    placement: {
      control: "select",
      options: PLACEMENTS,
      table: { defaultValue: { summary: "bottom" } },
    },
    offset: {
      control: { type: "number", min: 0, max: 40 },
      table: { defaultValue: { summary: "8" } },
    },
    dismissOnEscape: { control: "boolean", table: { defaultValue: { summary: "true" } } },
    dismissOnOutside: { control: "boolean", table: { defaultValue: { summary: "true" } } },
    children: { control: { disable: true } },
    open: { control: { disable: true } },
    defaultOpen: { control: { disable: true } },
    onOpenChange: { control: { disable: true } },
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

/** Non-modal: click the trigger to open, click outside or Escape to dismiss. */
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

/** Anchoring options. Click a trigger to see where its panel lands. */
export const Placements: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1.5rem" }}>
      {(["top", "right", "bottom", "left"] as const).map((placement) => (
        <Popover key={placement} placement={placement}>
          <PopoverTrigger asChild>
            <Button variant="secondary">{placement}</Button>
          </PopoverTrigger>
          <PopoverContent aria-label={`Panel ${placement}`}>
            <p style={{ margin: 0 }}>Placed on {placement}.</p>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  ),
};

/** A popover is a good home for a compact form; focus is trapped inside it. */
export const WithForm: Story = {
  render: (args) => (
    <Popover {...args}>
      <PopoverTrigger asChild>
        <Button>Rename</Button>
      </PopoverTrigger>
      <PopoverContent aria-label="Rename">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            minInlineSize: "16rem",
          }}>
          <FormField label="Portfolio name">
            <Input defaultValue="Growth fund" />
          </FormField>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <PopoverClose asChild>
              <Button variant="tertiary">Cancel</Button>
            </PopoverClose>
            <PopoverClose asChild>
              <Button>Save</Button>
            </PopoverClose>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

/** With `dismissOnOutside` off, only the Close button (or Escape) dismisses it. */
export const StaysOpenOnOutsideClick: Story = {
  args: { dismissOnOutside: false },
};

/** A larger gap between trigger and panel. */
export const CustomOffset: Story = {
  args: { offset: 24, placement: "right" },
};

/**
 * Everything here is scoped to one wrapper, including the panel.
 *
 * The panel is portalled to `document.body` by default, so nothing in your tree
 * is its ancestor and a token set there cannot reach it. Pass `container` on
 * `PopoverContent` to portal it into a node you own.
 */
export const Overrides: Story = {
  render: function Render(args) {
    const [scope, setScope] = useState<HTMLDivElement | null>(null);
    return (
      <div
        ref={setScope}
        style={
          {
            "--finra-container-background": "#064e3b",
            "--finra-container-foreground": "#d1fae5",
            "--finra-container-border": "#047857",
          } as React.CSSProperties
        }>
        <Popover {...args}>
          <PopoverTrigger asChild>
            <Button>Details</Button>
          </PopoverTrigger>
          <PopoverContent container={scope}>
            <p style={{ margin: 0 }}>The panel follows the tokens on the wrapper.</p>
          </PopoverContent>
        </Popover>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Details" }));
    await canvas.findByRole("dialog");
  },
};

/** The panel left open in dark mode, so axe audits the portalled content. */
export const DarkModeOpen: Story = {
  ...darkModeOpen,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Filters" }));
    const panel = await within(document.body).findByRole("dialog");
    await waitFor(() => expect(panel).toBeVisible());
  },
};
