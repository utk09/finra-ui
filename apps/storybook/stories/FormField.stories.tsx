import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox, FormField, Input, Switch, Textarea } from "@utk09/finra-ui";
import { expect, within } from "storybook/test";

const meta: Meta<typeof FormField> = {
  title: "Components/FormField",
  component: FormField,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    validationStatus: {
      control: "select",
      options: [undefined, "error", "warning", "success"],
    },
    required: {
      control: "boolean",
    },
    fullWidth: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

//  Basic stories

export const Default: Story = {
  args: {
    label: "Email",
    children: <Input placeholder="Enter your email" />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Email")).toBeVisible();
    await expect(canvas.getByPlaceholderText("Enter your email")).toBeVisible();
  },
};

export const WithHelperText: Story = {
  args: {
    label: "Username",
    helperText: "Choose a unique username.",
    children: <Input placeholder="Enter username" />,
  },
};

export const WithError: Story = {
  args: {
    label: "Email",
    validationStatus: "error",
    errorMessage: "Please enter a valid email address.",
    children: <Input placeholder="Enter email" />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toBeVisible();
    await expect(canvas.getByText("Please enter a valid email address.")).toBeVisible();
  },
};

export const WithErrorAndHelper: Story = {
  args: {
    label: "Password",
    validationStatus: "error",
    errorMessage: "Password must be at least 8 characters.",
    helperText: "Use a mix of letters, numbers, and symbols.",
    children: <Input type="password" placeholder="Enter password" />,
  },
};

export const Required: Story = {
  args: {
    label: "Full Name",
    required: true,
    children: <Input placeholder="Enter your name" />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText("Full Name");
    await expect(label).toBeVisible();
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled Field",
    disabled: true,
    children: <Input placeholder="Cannot edit" />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await expect(input).toBeDisabled();
  },
};

export const FullWidth: Story = {
  args: {
    label: "Description",
    fullWidth: true,
    children: <Textarea placeholder="Enter description..." />,
  },
  parameters: {
    layout: "padded",
  },
};

//  With different input types

export const WithTextarea: Story = {
  args: {
    label: "Message",
    helperText: "Max 500 characters.",
    children: <Textarea placeholder="Write your message..." />,
  },
};

export const WithCheckbox: Story = {
  args: {
    label: "Terms and Conditions",
    helperText: "You must agree to continue.",
    children: <Checkbox label="I agree to the terms" />,
  },
};

export const WithSwitch: Story = {
  args: {
    label: "Notifications",
    helperText: "Receive email notifications for updates.",
    children: <Switch label="Enable notifications" />,
  },
};

//  Showcase

export const AllStates: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 400 }}>
      <FormField label="Default">
        <Input placeholder="Default field" />
      </FormField>

      <FormField label="With Helper" helperText="This is a helper message.">
        <Input placeholder="Helpful field" />
      </FormField>

      <FormField label="Required" required>
        <Input placeholder="Required field" />
      </FormField>

      <FormField label="Error" validationStatus="error" errorMessage="This field is required.">
        <Input placeholder="Error field" />
      </FormField>

      <FormField
        label="Error + Helper"
        validationStatus="error"
        errorMessage="Invalid input."
        helperText="Additional guidance here.">
        <Input placeholder="Error with helper" />
      </FormField>

      <FormField label="Warning" validationStatus="warning">
        <Input placeholder="Warning field" />
      </FormField>

      <FormField label="Success" validationStatus="success">
        <Input placeholder="Success field" />
      </FormField>

      <FormField label="Disabled" disabled>
        <Input placeholder="Disabled field" />
      </FormField>

      <FormField label="Full Width" fullWidth>
        <Input placeholder="Full width field" />
      </FormField>
    </div>
  ),
};
