import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "@utk09/finra-ui";
import { expect, within } from "storybook/test";

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary"],
    },
    sentiment: {
      control: "select",
      options: [undefined, "danger", "success", "warning", "info"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

//  Variant stories

export const Primary: Story = {
  args: {
    children: "Primary",
    variant: "primary",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Primary")).toBeVisible();
  },
};

export const Secondary: Story = {
  args: {
    children: "Secondary",
    variant: "secondary",
  },
};

export const Tertiary: Story = {
  args: {
    children: "Tertiary",
    variant: "tertiary",
  },
};

//  Sentiment stories

export const Danger: Story = {
  args: {
    children: "Error",
    sentiment: "danger",
  },
};

export const Success: Story = {
  args: {
    children: "Active",
    sentiment: "success",
  },
};

export const Warning: Story = {
  args: {
    children: "Pending",
    sentiment: "warning",
  },
};

export const Info: Story = {
  args: {
    children: "New",
    sentiment: "info",
  },
};

//  Showcase

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="tertiary">Tertiary</Badge>
    </div>
  ),
};

export const AllSentiments: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span style={{ width: 80 }}>Default:</span>
        <Badge variant="primary">Primary</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="tertiary">Tertiary</Badge>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span style={{ width: 80 }}>Danger:</span>
        <Badge variant="primary" sentiment="danger">
          Primary
        </Badge>
        <Badge variant="secondary" sentiment="danger">
          Secondary
        </Badge>
        <Badge variant="tertiary" sentiment="danger">
          Tertiary
        </Badge>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span style={{ width: 80 }}>Success:</span>
        <Badge variant="primary" sentiment="success">
          Primary
        </Badge>
        <Badge variant="secondary" sentiment="success">
          Secondary
        </Badge>
        <Badge variant="tertiary" sentiment="success">
          Tertiary
        </Badge>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span style={{ width: 80 }}>Warning:</span>
        <Badge variant="primary" sentiment="warning">
          Primary
        </Badge>
        <Badge variant="secondary" sentiment="warning">
          Secondary
        </Badge>
        <Badge variant="tertiary" sentiment="warning">
          Tertiary
        </Badge>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span style={{ width: 80 }}>Info:</span>
        <Badge variant="primary" sentiment="info">
          Primary
        </Badge>
        <Badge variant="secondary" sentiment="info">
          Secondary
        </Badge>
        <Badge variant="tertiary" sentiment="info">
          Tertiary
        </Badge>
      </div>
    </div>
  ),
};

export const UseCases: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span>Status indicators:</span>
        <Badge sentiment="success">Active</Badge>
        <Badge sentiment="warning">Pending</Badge>
        <Badge sentiment="danger">Expired</Badge>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span>Categories:</span>
        <Badge variant="tertiary">Equity</Badge>
        <Badge variant="tertiary" sentiment="info">
          Bond
        </Badge>
        <Badge variant="tertiary" sentiment="warning">
          Option
        </Badge>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span>Counts:</span>
        <Badge variant="secondary">12</Badge>
        <Badge variant="secondary" sentiment="danger">
          3
        </Badge>
        <Badge variant="secondary" sentiment="info">
          New
        </Badge>
      </div>
    </div>
  ),
};
