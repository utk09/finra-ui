import type { Meta, StoryObj } from "@storybook/react-vite";
import { Divider } from "@utk09/finra-ui";
import { expect, within } from "storybook/test";

const meta: Meta<typeof Divider> = {
  title: "Components/Divider",
  component: Divider,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
    decorative: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Basic stories ───

export const Horizontal: Story = {
  args: {
    orientation: "horizontal",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const divider = canvas.getByRole("separator");
    await expect(divider).toBeVisible();
    await expect(divider).toHaveAttribute("aria-orientation", "horizontal");
  },
};

export const Vertical: Story = {
  args: {
    orientation: "vertical",
  },
  render: (args) => (
    <div style={{ display: "flex", alignItems: "stretch", height: 100, gap: "1rem" }}>
      <span>Left</span>
      <Divider {...args} />
      <span>Right</span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const divider = canvas.getByRole("separator");
    await expect(divider).toHaveAttribute("aria-orientation", "vertical");
  },
};

export const Decorative: Story = {
  args: {
    decorative: true,
  },
  play: async ({ canvasElement }) => {
    const hr = canvasElement.querySelector("hr");
    await expect(hr).toHaveAttribute("aria-hidden", "true");
  },
};

// ─── Showcase ───

export const InContent: Story = {
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <p style={{ marginBottom: "1rem" }}>
        This is the first section of content. It contains some information about the topic.
      </p>
      <Divider />
      <p style={{ marginTop: "1rem" }}>
        This is the second section, separated by a divider for visual clarity.
      </p>
    </div>
  ),
};

export const InList: Story = {
  render: () => (
    <div style={{ maxWidth: 300 }}>
      {["Apple", "Banana", "Cherry", "Date"].map((fruit, i, arr) => (
        <div key={fruit}>
          <div style={{ padding: "0.75rem 0" }}>{fruit}</div>
          {i < arr.length - 1 ? <Divider decorative /> : null}
        </div>
      ))}
    </div>
  ),
};

export const VerticalInToolbar: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.5rem 1rem",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
      }}>
      <button type="button">Cut</button>
      <button type="button">Copy</button>
      <button type="button">Paste</button>
      <Divider orientation="vertical" />
      <button type="button">Undo</button>
      <button type="button">Redo</button>
    </div>
  ),
};
