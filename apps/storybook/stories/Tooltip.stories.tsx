import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, IconButton, Tooltip, TooltipContent, TooltipTrigger } from "@utk09/finra-ui";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { EditIcon, TrashIcon } from "./_icons";
import { darkModeOpen } from "./_shared";

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
  subcomponents: { TooltipTrigger, TooltipContent },
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    // Defaults are not restated here. They come from the `@defaultValue` tags on
    // the props, so the table cannot drift from the component the way it did
    // while this file claimed `openDelay` defaulted to 0 rather than 700.
    openDelay: { control: { type: "number", min: 0, max: 2000, step: 50 } },
    closeDelay: { control: { type: "number", min: 0, max: 2000, step: 50 } },
    placement: { control: "select", options: PLACEMENTS },
    children: { control: { disable: true } },
    open: { control: { disable: true } },
    defaultOpen: { control: { disable: true } },
    onOpenChange: { control: { disable: true } },
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

/** Baseline: opens on hover or focus, wires `aria-describedby`, closes on Escape. */
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

/** Every placement, so anchoring can be eyeballed. Hover any trigger. */
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

/** `openDelay` avoids flicker on quick pointer passes; `closeDelay` keeps it up briefly. */
export const WithDelay: Story = {
  args: { openDelay: 400, closeDelay: 150 },
};

/** The most common real use: a label for an icon-only control. */
export const OnIconButton: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <Tooltip {...args}>
        <TooltipTrigger asChild>
          <IconButton aria-label="Edit" icon={<EditIcon />} />
        </TooltipTrigger>
        <TooltipContent>Edit</TooltipContent>
      </Tooltip>
      <Tooltip {...args}>
        <TooltipTrigger asChild>
          <IconButton aria-label="Delete" sentiment="danger" icon={<TrashIcon />} />
        </TooltipTrigger>
        <TooltipContent>Delete</TooltipContent>
      </Tooltip>
    </div>
  ),
};

/** Content can be more than a word - keep it short, though. */
export const RichContent: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger asChild>
        <Button variant="tertiary">Settlement date</Button>
      </TooltipTrigger>
      <TooltipContent>
        The date on which the trade must be settled - usually T+1 for equities.
      </TooltipContent>
    </Tooltip>
  ),
};

/**
 * Restyling the bubble. Both tooltips are held open so the difference is visible
 * at rest.
 *
 * The bubble is portalled, so an override declared on an ancestor only reaches it
 * when `container` brings it back inside that subtree. Semantic tokens carry the
 * inverse surface; anything with no token behind it is reached through
 * `[data-finra-ui="tooltip"]`, which wins because the library ships inside
 * `@layer finra-ui`.
 */
export const Overrides: Story = {
  parameters: { layout: "padded" },
  render: function Render() {
    const [scope, setScope] = useState<HTMLDivElement | null>(null);
    return (
      <div style={{ display: "flex", gap: "6rem", padding: "4rem 1rem 1rem" }}>
        <div>
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem" }}>Default</p>
          <Tooltip open placement="bottom">
            <TooltipTrigger asChild>
              <Button variant="secondary">Default</Button>
            </TooltipTrigger>
            <TooltipContent>Settles T+2</TooltipContent>
          </Tooltip>
        </div>
        <div
          ref={setScope}
          className="tooltip-override-demo"
          style={
            {
              position: "relative",
              "--finra-container-foreground": "#4c1d95",
              "--finra-radius-md": "0.75rem",
            } as React.CSSProperties
          }>
          <style>{`
            :where(.tooltip-override-demo) [data-finra-ui="tooltip"] {
              letter-spacing: var(--finra-tracking-wide);
              text-transform: uppercase;
              font-weight: var(--finra-font-semibold);
            }
          `}</style>
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem" }}>Overridden</p>
          <Tooltip open placement="bottom">
            <TooltipTrigger asChild>
              <Button variant="secondary">Overridden</Button>
            </TooltipTrigger>
            <TooltipContent container={scope}>Settles T+2</TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
  },
};

/** The tooltip left visible in dark mode. Tooltips are the easiest surface to get wrong on a dark background. */
export const DarkModeOpen: Story = {
  ...darkModeOpen,
  play: async () => {
    await userEvent.tab();
    const tip = await within(document.body).findByRole("tooltip");
    await waitFor(() => expect(tip).toBeVisible());
  },
};
