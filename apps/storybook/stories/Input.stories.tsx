import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "@utk09/finra-ui";
import { InputBase } from "@utk09/finra-ui/unstyled";
import { expect, fn, userEvent, within } from "storybook/test";

import { CloseIcon, LockIcon, MailIcon, SearchIcon } from "./_icons";
import { inDark, TokenScope } from "./_shared";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  parameters: {
    layout: "centered",
    // Docgen does not follow `extends` across modules, so `asChild` from the
    // base is otherwise missing from the table.
    docs: { inheritsFrom: InputBase },
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary"],
    },
    validationStatus: {
      control: "select",
      options: [undefined, "error", "warning", "success"],
    },
    fullWidth: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
    readOnly: {
      control: "boolean",
    },
    clearable: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

//  Basic stories

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await expect(input).toBeVisible();
    await userEvent.type(input, "Hello world");
    await expect(input).toHaveValue("Hello world");
  },
};

export const PrimaryVariant: Story = {
  args: {
    variant: "primary",
    placeholder: "Primary input",
  },
};

export const SecondaryVariant: Story = {
  args: {
    variant: "secondary",
    placeholder: "Secondary input",
  },
};

export const TertiaryVariant: Story = {
  args: {
    variant: "tertiary",
    placeholder: "Tertiary input",
  },
};

//  Adornment stories

export const WithStartAdornment: Story = {
  args: {
    placeholder: "Search...",
    startAdornment: <SearchIcon />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await expect(input).toBeVisible();
    await userEvent.type(input, "query");
    await expect(input).toHaveValue("query");
  },
};

export const WithEndAdornment: Story = {
  args: {
    placeholder: "Password",
    type: "password",
    endAdornment: <LockIcon />,
  },
};

export const WithBothAdornments: Story = {
  args: {
    placeholder: "Enter email...",
    startAdornment: <MailIcon />,
    endAdornment: <CloseIcon />,
  },
};

//  Clearable stories

export const Clearable: Story = {
  args: {
    placeholder: "Type something...",
    defaultValue: "Clear me!",
    clearable: true,
    onClear: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const clearButton = canvas.getByRole("button", { name: "Clear input" });
    await expect(clearButton).toBeVisible();
  },
};

//  Validation stories

export const ValidationError: Story = {
  args: {
    placeholder: "Email",
    defaultValue: "invalid-email",
    validationStatus: "error",
  },
};

export const ValidationWarning: Story = {
  args: {
    placeholder: "Username",
    defaultValue: "ab",
    validationStatus: "warning",
  },
};

export const ValidationSuccess: Story = {
  args: {
    placeholder: "Username",
    defaultValue: "validuser123",
    validationStatus: "success",
  },
};

//  State stories

export const Disabled: Story = {
  args: {
    placeholder: "Disabled input",
    defaultValue: "Cannot edit",
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await expect(input).toBeDisabled();
  },
};

export const ReadOnly: Story = {
  args: {
    "aria-label": "Read-only input",
    defaultValue: "Read-only value",
    readOnly: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await expect(input).toHaveAttribute("readonly");
  },
};

export const FullWidth: Story = {
  args: {
    placeholder: "Full width input",
    fullWidth: true,
  },
  parameters: {
    layout: "padded",
  },
};

export const Placeholder: Story = {
  args: {
    placeholder: "This is a placeholder",
  },
};

//  Showcase stories

export const AllStates: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 400 }}>
      {/* Variants */}
      <div>
        <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Variants</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Input variant="primary" placeholder="Primary" />
          <Input variant="secondary" placeholder="Secondary" />
          <Input variant="tertiary" placeholder="Tertiary" />
        </div>
      </div>
      {/* Validation statuses across variants */}
      <div>
        <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Validation (Primary)</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Input
            variant="primary"
            validationStatus="error"
            defaultValue="Error state"
            aria-label="Primary error"
          />
          <Input
            variant="primary"
            validationStatus="warning"
            defaultValue="Warning state"
            aria-label="Primary warning"
          />
          <Input
            variant="primary"
            validationStatus="success"
            defaultValue="Success state"
            aria-label="Primary success"
          />
        </div>
      </div>
      <div>
        <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Validation (Secondary)</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Input
            variant="secondary"
            validationStatus="error"
            defaultValue="Error state"
            aria-label="Secondary error"
          />
          <Input
            variant="secondary"
            validationStatus="warning"
            defaultValue="Warning state"
            aria-label="Secondary warning"
          />
          <Input
            variant="secondary"
            validationStatus="success"
            defaultValue="Success state"
            aria-label="Secondary success"
          />
        </div>
      </div>
      <div>
        <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Validation (Tertiary)</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Input
            variant="tertiary"
            validationStatus="error"
            defaultValue="Error state"
            aria-label="Tertiary error"
          />
          <Input
            variant="tertiary"
            validationStatus="warning"
            defaultValue="Warning state"
            aria-label="Tertiary warning"
          />
          <Input
            variant="tertiary"
            validationStatus="success"
            defaultValue="Success state"
            aria-label="Tertiary success"
          />
        </div>
      </div>
      {/* Adornments */}
      <div>
        <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Adornments</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Input startAdornment={<SearchIcon />} placeholder="Start adornment" />
          <Input endAdornment={<LockIcon />} placeholder="End adornment" />
          <Input
            startAdornment={<MailIcon />}
            endAdornment={<LockIcon />}
            placeholder="Both adornments"
          />
        </div>
      </div>
      {/* States */}
      <div>
        <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>States</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Input disabled defaultValue="Disabled" aria-label="Disabled input" />
          <Input readOnly defaultValue="Read-only" aria-label="Read-only input" />
          <Input clearable defaultValue="Clearable" aria-label="Clearable input" />
        </div>
      </div>
    </div>
  ),
};

/**
 * The focus ring reads `--finra-actionable-emphasis` and the error state reads
 * `--finra-status-danger-accent`. Click the first field to see the ring.
 *
 * ```css
 * .brand-region {
 *   --finra-actionable-emphasis: #7c3aed;
 *   --finra-status-danger-accent: #9f1239;
 * }
 * ```
 */
export const Overrides: Story = {
  render: () => (
    <TokenScope
      align="flex-start"
      tokens={{
        "--finra-actionable-emphasis": "#7c3aed",
        "--finra-status-danger-accent": "#9f1239",
        "--finra-container-foreground-muted": "#7c3aed",
      }}>
      <div style={{ inlineSize: 200 }}>
        <Input placeholder="Focus me" />
      </div>
      <div style={{ inlineSize: 200 }}>
        <Input placeholder="Rejected" validationStatus="error" />
      </div>
    </TokenScope>
  ),
  play: async ({ canvasElement }) => {
    within(canvasElement).getByPlaceholderText("Focus me").focus();
  },
};

/** Dark-mode counterpart of `Default`, so the accessibility check covers dark contrast. */
export const DarkMode: Story = inDark(Default);

/**
 * Secondary variant in dark mode, with a value on screen.
 *
 * The value is the point. This variant paints its own field surface, and a
 * placeholder is drawn in the muted colour, so an empty field looks correct
 * even when the surface and the text resolve to the same colour. Only a
 * populated field puts that in front of the accessibility check.
 */
export const SecondaryVariantDark: Story = inDark({
  ...SecondaryVariant,
  args: { ...SecondaryVariant.args, defaultValue: "1,250,000 USD" },
});
