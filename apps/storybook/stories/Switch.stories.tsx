import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "@utk09/finra-ui";
import { SwitchBase } from "@utk09/finra-ui/unstyled";
import { expect, fn, userEvent, within } from "storybook/test";

import { forwardsTo, inDark, NATIVE, Row, Stack, TokenScope } from "./_shared";

const meta: Meta<typeof Switch> = {
  title: "Components/Switch",
  component: Switch,
  parameters: {
    layout: "centered",
    docs: {
      inheritsFrom: SwitchBase,
      // Mirrors the `Omit` on the styled props: the wrapper owns the root's
      // class, so the base's is not consumer API here.
      inheritedOmit: ["className"],
      forwardsTo: forwardsTo("input", "checkbox input"),
    },
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    disabled: {
      control: "boolean",
      description: "Native disabled state. A disabled switch is not focusable and submits nothing.",
      table: { category: NATIVE, type: { summary: "boolean" } },
    },
    onChange: {
      description:
        "Fires on every toggle. Read `event.target.checked`. A switch takes effect immediately, so this is where the change should be applied rather than on a later submit.",
      table: {
        category: NATIVE,
        type: { summary: "(event: ChangeEvent<HTMLInputElement>) => void" },
      },
    },
    checked: {
      control: "boolean",
      description: "Controlled on/off state. Supply `onChange` alongside it.",
      table: { category: NATIVE, type: { summary: "boolean" } },
    },
    defaultChecked: {
      control: "boolean",
      description: "Starting state for an uncontrolled switch.",
      table: { category: NATIVE, type: { summary: "boolean" } },
    },
  },
  args: {
    onChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

//  Basic stories

export const Default: Story = {
  args: {
    label: "Enable notifications",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole("switch");
    await expect(switchEl).toBeInTheDocument();
    await expect(switchEl).not.toBeChecked();
    await userEvent.click(canvas.getByText("Enable notifications"));
    await expect(switchEl).toBeChecked();
  },
};

export const Checked: Story = {
  args: {
    label: "Active",
    defaultChecked: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("switch")).toBeChecked();
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled switch",
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("switch")).toBeDisabled();
  },
};

export const DisabledChecked: Story = {
  args: {
    label: "Disabled and on",
    disabled: true,
    defaultChecked: true,
  },
};

export const WithoutLabel: Story = {
  args: {
    "aria-label": "Standalone switch",
  },
};

//  Showcase

export const AllStates: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Switch label="Unchecked" />
      <Switch label="Checked" defaultChecked />
      <Switch label="Disabled Off" disabled />
      <Switch label="Disabled On" disabled defaultChecked />
      <Switch aria-label="Without label" />
    </div>
  ),
};

/**
 * Two supported ways to restyle, both shown against an untouched control.
 *
 * Re-point a token on any ancestor and every switch below follows, dark mode
 * included. For anything a token does not cover, target the part by its
 * `data-finra-ui` id: `switch`, `switch-input`, `switch-track`, `switch-thumb`
 * and `switch-label`.
 *
 * ```css
 * [data-finra-ui="switch-track"] { border-radius: 0.25rem; }
 * [data-finra-ui="switch-thumb"] { border-radius: 0.125rem; }
 * ```
 *
 * Those rules are no more specific than the library's own and still win,
 * because everything the library ships sits in `@layer finra-ui` and your
 * stylesheet does not. The `:where()` wrapper below only stops the demo leaking
 * onto the rest of this page; it adds no specificity.
 *
 * The checked state is on the visually hidden input, so a rule that depends on
 * it hangs off `:checked` there rather than off a class.
 */
export const Overrides: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <Stack gap="1.25rem">
      <Row>
        <span style={{ minInlineSize: "7rem" }}>Default</span>
        <Switch label="Streaming" defaultChecked />
        <Switch label="Paused" />
      </Row>
      <TokenScope tokens={{ "--finra-actionable-accent": "#0f766e" }}>
        <span style={{ minInlineSize: "7rem" }}>Token</span>
        <Switch label="Streaming" defaultChecked />
        <Switch label="Paused" />
      </TokenScope>
      <div className="switch-shape-demo">
        <style>{`
          :where(.switch-shape-demo) [data-finra-ui="switch-track"] {
            border-radius: 0.25rem;
          }
          :where(.switch-shape-demo) [data-finra-ui="switch-thumb"] {
            border-radius: 0.125rem;
          }
        `}</style>
        <Row>
          <span style={{ minInlineSize: "7rem" }}>Selector</span>
          <Switch label="Streaming" defaultChecked />
          <Switch label="Paused" />
        </Row>
      </div>
    </Stack>
  ),
};

/** Dark-mode counterpart of `Default`, so the accessibility check covers dark contrast. */
export const DarkMode: Story = inDark(Default);
