import type { Meta, StoryObj } from "@storybook/react-vite";
import { ComboBox } from "@utk09/finra-ui";
import { TenorInput } from "@utk09/finra-ui-finance";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { forwardsTo, inDark, LabelledRow, nativeFieldArgTypes, Stack } from "./_shared";

const meta: Meta<typeof TenorInput> = {
  title: "Finance/TenorInput",
  component: TenorInput,
  parameters: {
    layout: "centered",
    // Docgen does not follow `extends` across modules, so without this the props
    // inherited from ComboBox are missing from the table. The omit list mirrors
    // the `Omit<ComboBoxProps<string>, …>` in `TenorInputProps`, or the table
    // would advertise props this component does not accept.
    docs: {
      inheritsFrom: ComboBox,
      inheritedOmit: [
        "options",
        "multiple",
        "creatable",
        "onCreateOption",
        "formatCreateLabel",
        "value",
        "onChange",
      ],
      forwardsTo: forwardsTo("ComboBox", "combo box input"),
    },
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    "aria-label": nativeFieldArgTypes["aria-label"],
    disabled: { control: "boolean" },
    fullWidth: { control: "boolean" },
    allowCustom: { control: "boolean" },
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary"],
    },
    validationStatus: {
      control: "select",
      options: [undefined, "error", "warning", "success"],
    },
  },
  args: {
    onChange: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ minInlineSize: 300 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

//  Basic stories

export const Default: Story = {
  args: {
    "aria-label": "Tenor",
  },
};

export const WithValue: Story = {
  args: {
    "aria-label": "Tenor",
    value: "3M",
  },
};

export const AllowCustom: Story = {
  args: {
    "aria-label": "Tenor",
    allowCustom: true,
    placeholder: "Type or select tenor...",
  },
};

export const RestrictedTenors: Story = {
  args: {
    "aria-label": "Tenor",
    allowedTenors: ["ON", "1W", "1M", "3M", "6M", "1Y"],
  },
};

export const ExtraTenors: Story = {
  args: {
    "aria-label": "Tenor",
    extraTenors: ["4M", "7Y", "50Y"],
  },
};

export const Disabled: Story = {
  args: {
    "aria-label": "Tenor",
    value: "6M",
    disabled: true,
  },
};

//  Variants

export const Variants: Story = {
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div style={{ minInlineSize: 500 }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <Stack>
      <LabelledRow label="Primary">
        <TenorInput aria-label="Primary tenor" variant="primary" />
      </LabelledRow>
      <LabelledRow label="Secondary">
        <TenorInput aria-label="Secondary tenor" variant="secondary" />
      </LabelledRow>
      <LabelledRow label="Tertiary">
        <TenorInput aria-label="Tertiary tenor" variant="tertiary" />
      </LabelledRow>
    </Stack>
  ),
};

//  Interactive

export const Interactive: Story = {
  render: () => {
    const [tenor, setTenor] = useState<string | null>(null);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <TenorInput aria-label="Tenor" value={tenor} onChange={setTenor} allowCustom />
        <div style={{ fontSize: "0.875rem", color: "var(--finra-container-foreground-muted)" }}>
          Selected: <strong>{tenor ?? "none"}</strong>
        </div>
      </div>
    );
  },
};

//  Showcase

export const AllStates: Story = {
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div style={{ minInlineSize: 500 }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <TenorInput aria-label="Default" />
      <TenorInput aria-label="With value" value="3M" />
      <TenorInput aria-label="Disabled" disabled value="1Y" />
      <TenorInput
        aria-label="Restricted"
        allowedTenors={["1M", "3M", "6M", "1Y"]}
        placeholder="Short tenors only"
      />
      <TenorInput aria-label="Custom allowed" allowCustom placeholder="Type any tenor..." />
    </div>
  ),
};

/**
 * Restyling the field and its list. The list is portalled, so `container` is what
 * brings it back inside the element carrying the overrides.
 *
 * This component is a thin wrapper over `ComboBox`, so the parts it exposes are
 * the combo box's own ids plus `[data-finra-ui="tenor-input"]` on the wrapper.
 * Semantic tokens carry colour and radius; the selected option's leading rule has
 * no token behind it and is reached by id, which wins because the library ships
 * inside `@layer finra-ui`.
 */
export const Overrides: Story = {
  parameters: { layout: "padded" },
  render: function Render() {
    const [scope, setScope] = useState<HTMLDivElement | null>(null);
    return (
      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
        <div style={{ inlineSize: "14rem" }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem" }}>Default</p>
          <TenorInput aria-label="Default tenor" value="3M" />
        </div>
        <div
          ref={setScope}
          className="tenor-input-override-demo"
          style={
            {
              inlineSize: "14rem",
              "--finra-actionable-emphasis": "#0f766e",
              "--finra-actionable-accent-subtle": "#ccfbf1",
              "--finra-radius-md": "0.75rem",
            } as React.CSSProperties
          }>
          <style>{`
            :where(.tenor-input-override-demo) [data-finra-ui="tenor-input"] {
              padding-inline-start: var(--finra-spacing-2);
              border-inline-start: var(--finra-border-thick) solid var(--finra-actionable-emphasis);
            }
            :where(.tenor-input-override-demo) [data-finra-ui="combo-box-option"][aria-selected="true"] {
              font-weight: var(--finra-font-semibold);
            }
          `}</style>
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem" }}>Overridden</p>
          <TenorInput aria-label="Overridden tenor" value="3M" container={scope} />
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    // Open it, so the portalled list is on screen and visibly inside the scope.
    // A resting-state view shows none of the option parts being overridden.
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("combobox", { name: "Overridden tenor" }));
    const listbox = await within(document.body).findByRole("listbox");
    await waitFor(() => expect(listbox).toBeVisible());
  },
};

/** Dark-mode counterpart of `Default`, so the accessibility check covers dark contrast. */
export const DarkMode: Story = inDark(Default);
