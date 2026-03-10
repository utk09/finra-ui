import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadioButton } from "@utk09/finra-ui";
import { fn, expect, userEvent, within } from "storybook/test";

const meta: Meta<typeof RadioButton> = {
  title: "Components/RadioButton",
  component: RadioButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    disabled: {
      control: "boolean",
    },
  },
  args: {
    onChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Basic stories ───

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

// ─── Interactive ───

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

// ─── Showcase ───

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
