import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@utk09/finra-ui";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { CheckIcon, EditIcon, PlusIcon, TrashIcon } from "./_icons";

const PLACEMENTS = [
  "bottom-start",
  "bottom",
  "bottom-end",
  "top-start",
  "top",
  "top-end",
  "right-start",
  "left-start",
] as const;

const meta: Meta<typeof Menu> = {
  title: "Components/Menu",
  component: Menu,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    placement: {
      control: "select",
      options: PLACEMENTS,
      table: { defaultValue: { summary: "bottom-start" } },
    },
    offset: {
      control: { type: "number", min: 0, max: 24 },
      table: { defaultValue: { summary: "4" } },
    },
    children: { table: { disable: true } },
    open: { table: { disable: true } },
    defaultOpen: { table: { disable: true } },
    onOpenChange: { table: { disable: true } },
  },
  args: {
    placement: "bottom-start",
    offset: 4,
  },
  render: (args) => (
    <Menu {...args}>
      <MenuTrigger asChild>
        <Button>Actions</Button>
      </MenuTrigger>
      <MenuContent aria-label="Row actions">
        <MenuItem onSelect={fn()}>Edit</MenuItem>
        <MenuItem onSelect={fn()}>Duplicate</MenuItem>
        <MenuSeparator />
        <MenuItem onSelect={fn()}>Delete</MenuItem>
      </MenuContent>
    </Menu>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

/** APG menu button: opens on click / ArrowDown, roving focus, type-ahead, Escape closes. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Actions" });
    await userEvent.click(trigger);

    // The menu is portalled to <body>, outside the story canvas.
    const menu = await within(document.body).findByRole("menu");
    await waitFor(() => expect(menu).toBeVisible());
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(within(menu).getByRole("menuitem", { name: "Edit" }));
    await waitFor(() => expect(within(document.body).queryByRole("menu")).toBeNull());
  },
};

/** Leading icons clarify each action. */
export const WithIcons: Story = {
  render: (args) => (
    <Menu {...args}>
      <MenuTrigger asChild>
        <Button>Actions</Button>
      </MenuTrigger>
      <MenuContent aria-label="Row actions">
        <MenuItem onSelect={fn()}>
          <EditIcon /> Edit
        </MenuItem>
        <MenuItem onSelect={fn()}>
          <PlusIcon /> Duplicate
        </MenuItem>
        <MenuItem onSelect={fn()}>
          <CheckIcon /> Mark reviewed
        </MenuItem>
        <MenuSeparator />
        <MenuItem onSelect={fn()}>
          <TrashIcon /> Delete
        </MenuItem>
      </MenuContent>
    </Menu>
  ),
};

/** Disabled items are skipped by roving focus and type-ahead. */
export const WithDisabledItems: Story = {
  render: (args) => (
    <Menu {...args}>
      <MenuTrigger asChild>
        <Button>Actions</Button>
      </MenuTrigger>
      <MenuContent aria-label="Row actions">
        <MenuItem onSelect={fn()}>Open</MenuItem>
        <MenuItem onSelect={fn()} disabled>
          Duplicate (needs permission)
        </MenuItem>
        <MenuItem onSelect={fn()} disabled>
          Move
        </MenuItem>
        <MenuItem onSelect={fn()}>Archive</MenuItem>
      </MenuContent>
    </Menu>
  ),
};

/** Separators group related actions. */
export const Grouped: Story = {
  render: (args) => (
    <Menu {...args}>
      <MenuTrigger asChild>
        <Button>File</Button>
      </MenuTrigger>
      <MenuContent aria-label="File actions">
        <MenuItem onSelect={fn()}>New</MenuItem>
        <MenuItem onSelect={fn()}>Open…</MenuItem>
        <MenuSeparator />
        <MenuItem onSelect={fn()}>Save</MenuItem>
        <MenuItem onSelect={fn()}>Save as…</MenuItem>
        <MenuSeparator />
        <MenuItem onSelect={fn()}>Close</MenuItem>
      </MenuContent>
    </Menu>
  ),
};

/** A few anchoring options. Open any trigger to compare. */
export const Placements: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1.5rem" }}>
      {(["bottom-start", "bottom-end", "top-start", "right-start"] as const).map((placement) => (
        <Menu key={placement} placement={placement}>
          <MenuTrigger asChild>
            <Button variant="secondary">{placement}</Button>
          </MenuTrigger>
          <MenuContent aria-label={`Menu ${placement}`}>
            <MenuItem onSelect={fn()}>First</MenuItem>
            <MenuItem onSelect={fn()}>Second</MenuItem>
          </MenuContent>
        </Menu>
      ))}
    </div>
  ),
};
