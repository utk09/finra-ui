import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadioButton } from "@utk09/finra-ui";
import { RadioButtonBase } from "@utk09/finra-ui/unstyled";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import { forwardsTo, inDark, NATIVE, Row, Stack, TokenScope } from "./_shared";

const meta: Meta<typeof RadioButton> = {
  title: "Components/RadioButton",
  component: RadioButton,
  parameters: {
    layout: "centered",
    docs: {
      inheritsFrom: RadioButtonBase,
      // Mirrors the `Omit` on the styled props: the wrapper owns the root's
      // class, so the base's is not consumer API here.
      inheritedOmit: ["className"],
      description: { component: forwardsTo("input", "the radio input") },
    },
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    disabled: {
      control: "boolean",
      description: "Native disabled state. A disabled radio is not focusable and submits nothing.",
      table: { category: NATIVE, type: { summary: "boolean" } },
    },
    onChange: {
      description:
        "Fires when this radio becomes the selected member of its group. It does not fire on the radio being deselected, because selecting a sibling is what deselects it.",
      table: {
        category: NATIVE,
        type: { summary: "(event: ChangeEvent<HTMLInputElement>) => void" },
      },
    },
    name: {
      control: "text",
      description:
        "Groups the radios. Every member of a set must share one, or the browser will not make them mutually exclusive and arrow keys will not move between them.",
      table: { category: NATIVE, type: { summary: "string" } },
    },
    value: {
      control: "text",
      description: "Value submitted with the form when this member of the group is selected.",
      table: { category: NATIVE, type: { summary: "string" } },
    },
    checked: {
      control: "boolean",
      description: "Controlled selected state. Supply `onChange` alongside it.",
      table: { category: NATIVE, type: { summary: "boolean" } },
    },
    defaultChecked: {
      control: "boolean",
      description: "Starting selected state for an uncontrolled radio.",
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
    label: "Option A",
    name: "default-group",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const radio = canvas.getByRole("radio");
    await expect(radio).toBeInTheDocument();
    await expect(radio).not.toBeChecked();
    await userEvent.click(canvas.getByText("Option A"));
    await expect(radio).toBeChecked();
  },
};

export const Checked: Story = {
  args: {
    label: "Selected option",
    name: "checked-group",
    defaultChecked: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("radio")).toBeChecked();
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled option",
    name: "disabled-group",
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("radio")).toBeDisabled();
  },
};

export const DisabledChecked: Story = {
  args: {
    label: "Disabled and selected",
    name: "disabled-checked-group",
    disabled: true,
    defaultChecked: true,
  },
};

export const WithoutLabel: Story = {
  args: {
    "aria-label": "Standalone radio",
    name: "no-label-group",
  },
};

//  Interactive

export const Group: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => {
    const [selected, setSelected] = useState("email");

    return (
      <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 600, marginBlockEnd: "0.5rem" }}>
          Preferred contact method
        </legend>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <RadioButton
            label="Email"
            name="contact"
            value="email"
            checked={selected === "email"}
            onChange={() => setSelected("email")}
          />
          <RadioButton
            label="Phone"
            name="contact"
            value="phone"
            checked={selected === "phone"}
            onChange={() => setSelected("phone")}
          />
          <RadioButton
            label="Mail"
            name="contact"
            value="mail"
            checked={selected === "mail"}
            onChange={() => setSelected("mail")}
          />
        </div>
      </fieldset>
    );
  },
};

//  Showcase

export const AllStates: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <RadioButton label="Unchecked" name="showcase-1" />
      <RadioButton label="Checked" name="showcase-2" defaultChecked />
      <RadioButton label="Disabled" name="showcase-3" disabled />
      <RadioButton label="Disabled Checked" name="showcase-4" disabled defaultChecked />
      <RadioButton aria-label="Without label" name="showcase-5" />
    </div>
  ),
};

/**
 * Two supported ways to restyle, both shown against an untouched control.
 *
 * Re-point a token on any ancestor and every control below follows, dark mode
 * included. For anything a token does not cover, target the part by its
 * `data-finra-ui` id: `radio-button`, `radio-button-input`,
 * `radio-button-indicator`, `radio-button-dot` and `radio-button-label`.
 *
 * ```css
 * [data-finra-ui="radio-button-indicator"] { border-radius: 0.25rem; }
 * ```
 *
 * That rule is no more specific than the library's own and still wins, because
 * everything the library ships sits in `@layer finra-ui` and your stylesheet
 * does not. The `:where()` wrapper below only stops the demo leaking onto the
 * rest of this page; it adds no specificity.
 */
export const Overrides: Story = {
  render: () => (
    <Stack gap="1.25rem">
      <Row>
        <span style={{ minInlineSize: "7rem" }}>Default</span>
        <RadioButton name="ov-default" label="Buy" defaultChecked />
        <RadioButton name="ov-default" label="Sell" />
      </Row>
      <TokenScope tokens={{ "--finra-actionable-accent": "#b45309" }}>
        <span style={{ minInlineSize: "7rem" }}>Token</span>
        <RadioButton name="ov-token" label="Buy" defaultChecked />
        <RadioButton name="ov-token" label="Sell" />
      </TokenScope>
      <div className="radio-shape-demo">
        <style>{`
          :where(.radio-shape-demo) [data-finra-ui="radio-button-indicator"] {
            border-radius: 0.25rem;
          }
          :where(.radio-shape-demo) [data-finra-ui="radio-button-dot"] {
            border-radius: 0.125rem;
          }
        `}</style>
        <Row>
          <span style={{ minInlineSize: "7rem" }}>Selector</span>
          <RadioButton name="ov-shape" label="Buy" defaultChecked />
          <RadioButton name="ov-shape" label="Sell" />
        </Row>
      </div>
    </Stack>
  ),
};

/** Dark-mode counterpart of `Default`, so the accessibility check covers dark contrast. */
export const DarkMode: Story = inDark(Default);
