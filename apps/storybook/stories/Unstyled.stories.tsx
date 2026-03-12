import type { Meta, StoryObj } from "@storybook/react-vite";
import { DateTenorInputBase, TenorInputBase } from "@utk09/finra-ui/finance";
import {
  ButtonBase,
  CalendarBase,
  CheckboxBase,
  ComboBoxBase,
  DateInputBase,
  FileDropZoneBase,
  FormFieldBase,
  IconButtonBase,
  InputBase,
  NumberInputBase,
  PillInputBase,
  RadioButtonBase,
  SliderBase,
  SwitchBase,
  TextareaBase,
} from "@utk09/finra-ui/unstyled";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { CheckIcon, CloseIcon, EditIcon, PlusIcon, SearchIcon } from "./_icons";

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

//  ButtonBase

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

//  IconButtonBase

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

//  InputBase

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

//  TextareaBase

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

//  NumberInputBase

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

//  CheckboxBase

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

//  RadioButtonBase

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

//  SwitchBase

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

//  SliderBase

export const SliderBaseDefault: Story = {
  name: "SliderBase - Default",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 300 }}>
      <label
        htmlFor="sl-default"
        style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        Volume
        <SliderBase id="sl-default" min={0} max={100} defaultValue={50} aria-label="Volume" />
      </label>
      <label
        htmlFor="sl-stepped"
        style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        Stepped (10)
        <SliderBase
          id="sl-stepped"
          min={0}
          max={100}
          step={10}
          defaultValue={30}
          aria-label="Stepped"
        />
      </label>
      <label
        htmlFor="sl-disabled"
        style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        Disabled
        <SliderBase
          id="sl-disabled"
          min={0}
          max={100}
          defaultValue={70}
          disabled
          aria-label="Disabled"
        />
      </label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByLabelText("Volume");
    await expect(slider).toBeVisible();
  },
};

//  Showcase

//  FormFieldBase

export const FormFieldBaseDefault: Story = {
  name: "FormFieldBase - Default",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 300 }}>
      <FormFieldBase label="Email">
        <input type="email" placeholder="you@example.com" />
      </FormFieldBase>
      <FormFieldBase label="Username" required helperText="Must be unique">
        <input type="text" placeholder="Choose a username" />
      </FormFieldBase>
      <FormFieldBase label="Password" validationStatus="error" errorMessage="Password is too short">
        <input type="password" />
      </FormFieldBase>
      <FormFieldBase label="Notes" disabled>
        <textarea rows={2} placeholder="Disabled field" />
      </FormFieldBase>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const emailInput = canvas.getByPlaceholderText("you@example.com");
    await expect(emailInput).toBeVisible();
    const errorMsg = canvas.getByRole("alert");
    await expect(errorMsg).toHaveTextContent("Password is too short");
  },
};

//  PillInputBase

export const PillInputBaseDefault: Story = {
  name: "PillInputBase - Default",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 400 }}>
      <PillInputBase placeholder="Type and press Enter" aria-label="Tags" />
      <PillInputBase
        values={["React", "TypeScript"]}
        placeholder="Controlled"
        aria-label="Controlled pills"
      />
      <PillInputBase placeholder="Disabled" disabled aria-label="Disabled pills" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Tags" });
    await expect(input).toBeVisible();
    await userEvent.type(input, "hello{Enter}");
  },
};

//  FileDropZoneBase

export const FileDropZoneBaseDefault: Story = {
  name: "FileDropZoneBase - Default",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 400 }}>
      <FileDropZoneBase
        style={{ border: "2px dashed #ccc", padding: "2rem", textAlign: "center" }}
        aria-label="Upload files"
      />
      <FileDropZoneBase
        accept=".pdf,.csv"
        style={{ border: "2px dashed #ccc", padding: "2rem", textAlign: "center" }}
        aria-label="Upload documents">
        <span>Drop PDFs or CSVs here</span>
      </FileDropZoneBase>
      <FileDropZoneBase
        disabled
        style={{
          border: "2px dashed #ccc",
          padding: "2rem",
          textAlign: "center",
          opacity: 0.5,
        }}
        aria-label="Disabled upload">
        <span>Disabled</span>
      </FileDropZoneBase>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const zone = canvas.getByLabelText("Upload files");
    await expect(zone).toBeVisible();
  },
};

//  ComboBoxBase

export const ComboBoxBaseDefault: Story = {
  name: "ComboBoxBase - Default",
  render: () => {
    const options = [
      { value: "apple", label: "Apple" },
      { value: "banana", label: "Banana" },
      { value: "cherry", label: "Cherry" },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 300 }}>
        <ComboBoxBase options={options} value={null} placeholder="Select a fruit..." />
        <ComboBoxBase options={options} value="banana" placeholder="With value" />
        <ComboBoxBase options={options} value={null} disabled placeholder="Disabled" />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getAllByRole("searchbox")[0];
    await expect(input).toBeVisible();
    await userEvent.click(input);
    await expect(canvas.getByRole("listbox")).toBeVisible();
  },
};

//  CalendarBase

export const CalendarBaseDefault: Story = {
  name: "CalendarBase - Default",
  render: () => {
    const [selected, setSelected] = useState<Date | null>(null);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 280 }}>
        <CalendarBase
          value={selected}
          onSelect={(d) => setSelected(d)}
          today={new Date(2026, 2, 18)}
        />
        <div style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>
          Selected: {selected ? selected.toISOString().split("T")[0] : "null"}
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("March 2026")).toBeVisible();
  },
};

export const CalendarBaseWithConstraints: Story = {
  name: "CalendarBase - With Constraints",
  render: () => {
    const [selected, setSelected] = useState<Date | null>(null);
    const min = new Date(2026, 2, 10);
    const max = new Date(2026, 2, 25);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 280 }}>
        <div style={{ fontSize: "0.75rem", color: "#666" }}>Only March 10–25, 2026 selectable</div>
        <CalendarBase
          value={selected}
          onSelect={(d) => setSelected(d)}
          min={min}
          max={max}
          today={new Date(2026, 2, 18)}
        />
        <div style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>
          Selected: {selected ? selected.toISOString().split("T")[0] : "null"}
        </div>
      </div>
    );
  },
};

export const CalendarBaseSundayStart: Story = {
  name: "CalendarBase - Sunday Start",
  render: () => {
    const [selected, setSelected] = useState<Date | null>(null);

    return (
      <div style={{ maxWidth: 280 }}>
        <CalendarBase
          value={selected}
          onSelect={(d) => setSelected(d)}
          weekStartsOn={0}
          today={new Date(2026, 2, 18)}
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // First weekday abbreviation should be "Su" for Sunday start
    const abbrs = canvas.getAllByText(/^(Su|Mo|Tu|We|Th|Fr|Sa)$/);
    await expect(abbrs[0]).toHaveTextContent("Su");
  },
};

//  DateInputBase

export const DateInputBaseDefault: Story = {
  name: "DateInputBase - Default",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 300 }}>
      <DateInputBase aria-label="Default date" />
      <DateInputBase
        format="MM/DD/YYYY"
        value={new Date(2024, 2, 15)}
        aria-label="US format date"
      />
      <DateInputBase disabled value={new Date(2024, 0, 1)} aria-label="Disabled date" />
      <DateInputBase readOnly value={new Date(2024, 5, 20)} aria-label="Read-only date" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Default date");
    await expect(input).toBeVisible();
  },
};

//  TenorInputBase

export const TenorInputBaseDefault: Story = {
  name: "TenorInputBase - Default",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 300 }}>
      <TenorInputBase aria-label="Default tenor" placeholder="Select tenor..." />
      <TenorInputBase aria-label="With value" value="3M" />
      <TenorInputBase aria-label="Disabled tenor" disabled />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Default tenor");
    await expect(input).toBeVisible();
  },
};

//  DateTenorInputBase

export const DateTenorInputBaseDefault: Story = {
  name: "DateTenorInputBase - Default",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 400 }}>
      <DateTenorInputBase dateAriaLabel="Date" tenorAriaLabel="Tenor" />
      <DateTenorInputBase
        dateAriaLabel="With values date"
        tenorAriaLabel="With values tenor"
        dateValue={new Date(2026, 5, 11)}
        tenorValue="3M"
      />
      <DateTenorInputBase dateAriaLabel="Disabled date" tenorAriaLabel="Disabled tenor" disabled />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Date");
    await expect(input).toBeVisible();
  },
};

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

      <div>
        <h3 style={{ marginBottom: "0.5rem" }}>SliderBase</h3>
        <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
          A native range input for slider/range selection.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 250 }}>
          <SliderBase min={0} max={100} defaultValue={50} aria-label="Demo slider" />
          <SliderBase
            min={0}
            max={100}
            defaultValue={70}
            disabled
            aria-label="Demo slider disabled"
          />
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: "0.5rem" }}>FormFieldBase</h3>
        <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
          Wires up label, error, and helper text with proper a11y attributes for any child input.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 300 }}>
          <FormFieldBase label="Email" helperText="We'll never share your email">
            <input type="email" placeholder="you@example.com" />
          </FormFieldBase>
          <FormFieldBase label="Password" validationStatus="error" errorMessage="Too short">
            <input type="password" />
          </FormFieldBase>
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: "0.5rem" }}>PillInputBase</h3>
        <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
          Keyboard-driven pill/tag input with add, remove, and deduplication logic.
        </p>
        <PillInputBase
          placeholder="Type and press Enter"
          aria-label="Demo pill input"
          style={{ maxWidth: 300 }}
        />
      </div>

      <div>
        <h3 style={{ marginBottom: "0.5rem" }}>FileDropZoneBase</h3>
        <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
          Drag-and-drop file zone with click-to-browse and keyboard activation.
        </p>
        <FileDropZoneBase
          aria-label="Demo file drop zone"
          style={{
            border: "2px dashed #ccc",
            padding: "2rem",
            textAlign: "center",
            maxWidth: 300,
          }}
        />
      </div>

      <div>
        <h3 style={{ marginBottom: "0.5rem" }}>ComboBoxBase</h3>
        <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
          Typeahead combobox with single/multi select, groups, favourites, async, and creatable.
        </p>
        <ComboBoxBase
          options={[
            { value: "apple", label: "Apple" },
            { value: "banana", label: "Banana" },
            { value: "cherry", label: "Cherry" },
          ]}
          value={null}
          placeholder="Select a fruit..."
          aria-label="Demo combo box"
          style={{ maxWidth: 300 }}
        />
      </div>

      <div>
        <h3 style={{ marginBottom: "0.5rem" }}>CalendarBase</h3>
        <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
          Month-view calendar grid with keyboard navigation, min/max constraints, disabled dates,
          and configurable week start day. Used internally by DateInput and DateTenorInput.
        </p>
        <CalendarBase today={new Date(2026, 2, 18)} />
      </div>

      <div>
        <h3 style={{ marginBottom: "0.5rem" }}>DateInputBase</h3>
        <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
          Date input with auto-separator insertion and calendar popup. Configurable format, min/max
          constraints, and disabled-date support.
        </p>
        <DateInputBase aria-label="Demo date input" style={{ maxWidth: 300 }} />
      </div>

      <div>
        <h3 style={{ marginBottom: "0.5rem" }}>TenorInputBase</h3>
        <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
          ComboBox-style dropdown with predefined financial tenors (ON, 1M, 3M, 1Y, etc.).
        </p>
        <TenorInputBase
          aria-label="Demo tenor input"
          placeholder="Select tenor..."
          style={{ maxWidth: 300 }}
        />
      </div>

      <div>
        <h3 style={{ marginBottom: "0.5rem" }}>DateTenorInputBase</h3>
        <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
          Unified date-tenor picker with calendar popup and tenor grid. Selecting a tenor resolves
          to a date; entering a date reverse-looks up the matching tenor.
        </p>
        <DateTenorInputBase
          dateAriaLabel="Demo date"
          tenorAriaLabel="Demo tenor"
          style={{ maxWidth: 400 }}
        />
      </div>
    </div>
  ),
};
