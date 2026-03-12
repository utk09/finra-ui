import type { Meta, StoryObj } from "@storybook/react-vite";
import { PillInput } from "@utk09/finra-ui";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

const meta: Meta<typeof PillInput> = {
  title: "Components/PillInput",
  component: PillInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    disabled: {
      control: "boolean",
    },
    maxPills: {
      control: "number",
    },
  },
  args: {
    onChange: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ minInlineSize: 350 }}>
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
    placeholder: "Type and press Enter...",
    "aria-label": "Tags",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await expect(input).toBeVisible();
    await userEvent.type(input, "React{Enter}");
    await expect(canvas.getByText("React")).toBeVisible();
  },
};

export const WithValues: Story = {
  args: {
    values: ["React", "TypeScript", "SCSS"],
    placeholder: "Add more...",
    "aria-label": "Technologies",
  },
};

export const MaxPills: Story = {
  args: {
    values: ["React", "Vue"],
    maxPills: 3,
    placeholder: "Max 3 tags",
    "aria-label": "Limited tags",
  },
};

export const Disabled: Story = {
  args: {
    values: ["React", "TypeScript"],
    disabled: true,
    "aria-label": "Disabled tags",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeDisabled();
  },
};

//  Interactive

export const Controlled: Story = {
  render: () => {
    const [tags, setTags] = useState(["React", "TypeScript"]);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <PillInput
          aria-label="Skills"
          values={tags}
          onChange={setTags}
          placeholder="Add skills..."
        />
        <p style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}>
          Tags: {tags.join(", ") || "none"}
        </p>
      </div>
    );
  },
};

export const CommaDelimiter: Story = {
  render: () => {
    const [tags, setTags] = useState<string[]>([]);

    return (
      <PillInput
        aria-label="Comma separated"
        values={tags}
        onChange={setTags}
        delimiters={[","]}
        placeholder="Separate with comma or Enter..."
      />
    );
  },
};

//  Showcase

export const AllStates: Story = {
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div style={{ minInlineSize: 400 }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <PillInput aria-label="Empty" placeholder="Type and press Enter..." />
      <PillInput aria-label="With values" values={["React", "Vue", "Angular"]} />
      <PillInput aria-label="Disabled" values={["React", "TypeScript"]} disabled />
    </div>
  ),
};
