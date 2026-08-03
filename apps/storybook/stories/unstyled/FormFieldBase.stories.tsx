import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormFieldBase } from "@utk09/finra-ui/unstyled";
import { expect, within } from "storybook/test";

const meta: Meta<typeof FormFieldBase> = {
  title: "Unstyled/FormFieldBase",
  component: FormFieldBase,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
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
