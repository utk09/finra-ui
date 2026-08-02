import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@utk09/finra-ui";
import { expect, within } from "storybook/test";

import { inDark } from "./_shared";

const meta: Meta = {
  // Plural, matching `storySort` and the links on the landing page. A singular
  // "Foundation" would sort as its own sidebar group.
  title: "Foundations/Density",
  parameters: {
    layout: "centered",
  },
  /**
   * Autodocs is off for this file only.
   *
   * `preview.tsx` turns it on project-wide, but `docs/foundations/Density.mdx`
   * attaches to these stories with `<Meta of={...} />`. Leaving the generated
   * page enabled as well would put two "Docs" entries under one title, so the
   * tag is negated rather than the prose page being made standalone - a
   * standalone page would need its own title, and any title that did not
   * collide with this one would split density across two sidebar entries.
   */
  tags: ["!autodocs"],
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

/** Dark-mode counterpart of `Comparison`, so the accessibility check covers dark contrast. */
export const DarkMode: Story = inDark(Comparison);
