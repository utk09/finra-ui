import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ButtonBase,
  IconButtonBase,
  InputBase,
  TextareaBase,
  NumberInputBase,
  CheckboxBase,
  SwitchBase,
  RadioButtonBase,
} from "@utk09/finra-ui/unstyled";
import { expect, userEvent, within } from "storybook/test";
import { SearchIcon, PlusIcon, CloseIcon, CheckIcon, EditIcon } from "./_icons";

// Using ButtonBase as the meta component, but this file showcases all unstyled components
const meta: Meta<typeof ButtonBase> = {
  title: "Unstyled/Core",
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ─── ButtonBase ───

export const ButtonBaseDefault: Story = {
  name: "ButtonBase - Default",
  render: () => (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <ButtonBase type="button">Unstyled Button</ButtonBase>
      <ButtonBase type="submit">Submit</ButtonBase>
      <ButtonBase type="button" disabled>
        Disabled
      </ButtonBase>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Unstyled Button" });
    await expect(button).toBeVisible();
    await userEvent.click(button);
  },
};

export const ButtonBaseAsChild: Story = {
  name: "ButtonBase - asChild",
  render: () => (
    <ButtonBase asChild>
      <a href="#example">I render as an anchor tag</a>
    </ButtonBase>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link");
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "#example");
  },
};

// ─── IconButtonBase ───

export const IconButtonBaseDefault: Story = {
  name: "IconButtonBase - Default",
  render: () => (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <IconButtonBase type="button" icon={<PlusIcon />} aria-label="Add item" />
      <IconButtonBase type="button" icon={<EditIcon />} aria-label="Edit" />
      <IconButtonBase type="button" icon={<CloseIcon />} aria-label="Close" />
      <IconButtonBase type="button" icon={<SearchIcon />} aria-label="Search" disabled />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const addButton = canvas.getByRole("button", { name: "Add item" });
    await expect(addButton).toBeVisible();
  },
};

// ─── InputBase ───

export const InputBaseDefault: Story = {
  name: "InputBase - Default",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 300 }}>
      <InputBase placeholder="Unstyled input" aria-label="Default input" />
      <InputBase defaultValue="With value" aria-label="Input with value" />
      <InputBase placeholder="Disabled" disabled aria-label="Disabled input" />
      <InputBase defaultValue="Read-only" readOnly aria-label="Read-only input" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Default input");
    await expect(input).toBeVisible();
    await userEvent.type(input, "Hello");
    await expect(input).toHaveValue("Hello");
  },
};

// ─── TextareaBase ───

export const TextareaBaseDefault: Story = {
  name: "TextareaBase - Default",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 300 }}>
      <TextareaBase placeholder="Unstyled textarea" rows={3} aria-label="Default textarea" />
      <TextareaBase defaultValue="With content" rows={3} aria-label="Textarea with content" />
      <TextareaBase placeholder="Disabled" rows={3} disabled aria-label="Disabled textarea" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("Default textarea");
    await expect(textarea).toBeVisible();
    await userEvent.type(textarea, "Line 1\nLine 2");
    await expect(textarea).toHaveValue("Line 1\nLine 2");
  },
};

// ─── NumberInputBase ───

export const NumberInputBaseDefault: Story = {
  name: "NumberInputBase - Default",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 300 }}>
      <NumberInputBase placeholder="Unstyled number input" aria-label="Default number input" />
      <NumberInputBase defaultValue="42" aria-label="Number input with value" />
      <NumberInputBase placeholder="Disabled" disabled aria-label="Disabled number input" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Default number input");
    await expect(input).toBeVisible();
    await userEvent.type(input, "123");
    await expect(input).toHaveValue("123");
  },
};

// ─── CheckboxBase ───

export const CheckboxBaseDefault: Story = {
  name: "CheckboxBase - Default",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label htmlFor="cb-accept" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <CheckboxBase id="cb-accept" aria-label="Accept terms" /> Accept terms
      </label>
      <label htmlFor="cb-checked" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <CheckboxBase id="cb-checked" defaultChecked aria-label="Checked" /> Checked
      </label>
      <label htmlFor="cb-disabled" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <CheckboxBase id="cb-disabled" disabled aria-label="Disabled" /> Disabled
      </label>
      <label
        htmlFor="cb-indeterminate"
        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <CheckboxBase id="cb-indeterminate" indeterminate aria-label="Indeterminate" />{" "}
        Indeterminate
      </label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByLabelText("Accept terms");
    await expect(checkbox).toBeVisible();
    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();
  },
};

// ─── RadioButtonBase ───

export const RadioButtonBaseDefault: Story = {
  name: "RadioButtonBase - Default",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label htmlFor="rb-option-a" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <RadioButtonBase id="rb-option-a" name="rb-group" aria-label="Option A" /> Option A
      </label>
      <label htmlFor="rb-option-b" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <RadioButtonBase id="rb-option-b" name="rb-group" defaultChecked aria-label="Option B" />{" "}
        Option B (checked)
      </label>
      <label htmlFor="rb-option-c" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <RadioButtonBase id="rb-option-c" name="rb-group" disabled aria-label="Option C" /> Option C
        (disabled)
      </label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const radio = canvas.getByLabelText("Option A");
    await expect(radio).toBeVisible();
    await userEvent.click(radio);
    await expect(radio).toBeChecked();
  },
};

// ─── SwitchBase ───

export const SwitchBaseDefault: Story = {
  name: "SwitchBase - Default",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label
        htmlFor="sw-notifications"
        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <SwitchBase id="sw-notifications" aria-label="Toggle notifications" /> Notifications
      </label>
      <label htmlFor="sw-active" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <SwitchBase id="sw-active" defaultChecked aria-label="Active switch" /> Active
      </label>
      <label htmlFor="sw-disabled" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <SwitchBase id="sw-disabled" disabled aria-label="Disabled switch" /> Disabled
      </label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByLabelText("Toggle notifications");
    await expect(switchEl).toBeVisible();
    await userEvent.click(switchEl);
    await expect(switchEl).toBeChecked();
  },
};

// ─── Showcase ───

export const AllUnstyled: Story = {
  name: "All Unstyled Components",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h3 style={{ marginBottom: "0.5rem" }}>ButtonBase</h3>
        <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
          A plain button element with <code>asChild</code> support via internal Slot utility.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <ButtonBase type="button">Click me</ButtonBase>
          <ButtonBase type="button" disabled>
            Disabled
          </ButtonBase>
          <ButtonBase asChild>
            <a href="#link">As anchor</a>
          </ButtonBase>
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: "0.5rem" }}>IconButtonBase</h3>
        <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
          Renders an icon inside a button. Requires <code>aria-label</code> for accessibility.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <IconButtonBase type="button" icon={<PlusIcon />} aria-label="Add" />
          <IconButtonBase type="button" icon={<EditIcon />} aria-label="Edit" />
          <IconButtonBase type="button" icon={<CloseIcon />} aria-label="Close" />
          <IconButtonBase type="button" icon={<CheckIcon />} aria-label="Confirm" />
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: "0.5rem" }}>InputBase</h3>
        <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
          A plain input element with <code>asChild</code> support.
        </p>
        <InputBase
          placeholder="Type something..."
          aria-label="Demo input"
          style={{ maxWidth: 300 }}
        />
      </div>

      <div>
        <h3 style={{ marginBottom: "0.5rem" }}>TextareaBase</h3>
        <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
          A plain textarea element with <code>asChild</code> support.
        </p>
        <TextareaBase
          placeholder="Write something..."
          rows={3}
          aria-label="Demo textarea"
          style={{ maxWidth: 300 }}
        />
      </div>

      <div>
        <h3 style={{ marginBottom: "0.5rem" }}>NumberInputBase</h3>
        <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
          An input with <code>inputMode=&quot;decimal&quot;</code> for numeric entry. No built-in
          step buttons - those are in the styled <code>NumberInput</code>.
        </p>
        <NumberInputBase placeholder="0" aria-label="Demo number input" style={{ maxWidth: 300 }} />
      </div>

      <div>
        <h3 style={{ marginBottom: "0.5rem" }}>CheckboxBase</h3>
        <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
          A native checkbox input with <code>indeterminate</code> support via a DOM property.
        </p>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <label
            htmlFor="demo-cb"
            style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <CheckboxBase id="demo-cb" aria-label="Demo checkbox" /> Check me
          </label>
          <label
            htmlFor="demo-cb-checked"
            style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <CheckboxBase id="demo-cb-checked" defaultChecked aria-label="Demo checked" /> Checked
          </label>
          <label
            htmlFor="demo-cb-indet"
            style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <CheckboxBase id="demo-cb-indet" indeterminate aria-label="Demo indeterminate" />{" "}
            Indeterminate
          </label>
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: "0.5rem" }}>RadioButtonBase</h3>
        <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
          A native radio input for grouped exclusive selection.
        </p>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <label
            htmlFor="demo-rb-a"
            style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <RadioButtonBase id="demo-rb-a" name="demo-rb" aria-label="Demo option A" /> Option A
          </label>
          <label
            htmlFor="demo-rb-b"
            style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <RadioButtonBase
              id="demo-rb-b"
              name="demo-rb"
              defaultChecked
              aria-label="Demo option B"
            />{" "}
            Option B
          </label>
          <label
            htmlFor="demo-rb-c"
            style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <RadioButtonBase id="demo-rb-c" name="demo-rb" disabled aria-label="Demo option C" />{" "}
            Disabled
          </label>
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: "0.5rem" }}>SwitchBase</h3>
        <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
          A checkbox input with <code>role=&quot;switch&quot;</code> for toggle behavior.
        </p>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <label
            htmlFor="demo-sw"
            style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <SwitchBase id="demo-sw" aria-label="Demo switch" /> Toggle
          </label>
          <label
            htmlFor="demo-sw-on"
            style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <SwitchBase id="demo-sw-on" defaultChecked aria-label="Demo switch on" /> On
          </label>
        </div>
      </div>
    </div>
  ),
};
