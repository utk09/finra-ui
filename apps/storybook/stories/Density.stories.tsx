import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@utk09/finra-ui";
import { expect, within } from "storybook/test";

const meta: Meta = {
  title: "Foundation/Density",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <p style={{ margin: "0 0 0.5rem", fontWeight: 600 }}>High density</p>
        <div data-density="high" style={{ display: "flex", gap: "0.5rem" }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="tertiary">Tertiary</Button>
        </div>
      </div>
      <div>
        <p style={{ margin: "0 0 0.5rem", fontWeight: 600 }}>Medium density (default)</p>
        <div data-density="medium" style={{ display: "flex", gap: "0.5rem" }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="tertiary">Tertiary</Button>
        </div>
      </div>
      <div>
        <p style={{ margin: "0 0 0.5rem", fontWeight: 600 }}>Low density</p>
        <div data-density="low" style={{ display: "flex", gap: "0.5rem" }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="tertiary">Tertiary</Button>
        </div>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole("button");
    await expect(buttons.length).toBe(9);
  },
};

export const WithSentiments: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div data-density="high">
        <p style={{ margin: "0 0 0.5rem", fontWeight: 600 }}>High</p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Button>Default</Button>
          <Button sentiment="danger">Danger</Button>
          <Button sentiment="success">Success</Button>
          <Button variant="secondary" sentiment="danger">
            Secondary Danger
          </Button>
        </div>
      </div>
      <div data-density="medium">
        <p style={{ margin: "0 0 0.5rem", fontWeight: 600 }}>Medium</p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Button>Default</Button>
          <Button sentiment="danger">Danger</Button>
          <Button sentiment="success">Success</Button>
          <Button variant="secondary" sentiment="danger">
            Secondary Danger
          </Button>
        </div>
      </div>
      <div data-density="low">
        <p style={{ margin: "0 0 0.5rem", fontWeight: 600 }}>Low</p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Button>Default</Button>
          <Button sentiment="danger">Danger</Button>
          <Button sentiment="success">Success</Button>
          <Button variant="secondary" sentiment="danger">
            Secondary Danger
          </Button>
        </div>
      </div>
    </div>
  ),
};
