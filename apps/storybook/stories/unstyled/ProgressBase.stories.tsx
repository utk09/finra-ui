import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProgressBase } from "@utk09/finra-ui/unstyled";
import { expect, within } from "storybook/test";

import { forwardsTo } from "../_shared";

const meta: Meta<typeof ProgressBase> = {
  title: "Unstyled/ProgressBase",
  component: ProgressBase,
  parameters: {
    layout: "padded",
    docs: { forwardsTo: forwardsTo("div") },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The base carries the ARIA contract and the fill's inline size, which comes
 * from `value` and so cannot live in a stylesheet. Everything else is the
 * consumer's: this story attaches its own rules to the part ids to make the
 * bars visible.
 */
export const Default: Story = {
  render: () => (
    <>
      <style>{`
        .progress-demo [data-finra-ui="progress-track"] {
          block-size: 0.5rem;
          background: #e5e7eb;
          border-radius: 9999px;
          overflow: hidden;
        }
        .progress-demo [data-finra-ui="progress-fill"] {
          block-size: 100%;
          background: #4f46e5;
        }
      `}</style>
      <div className="progress-demo" style={{ display: "grid", gap: "1rem", maxWidth: 320 }}>
        <ProgressBase value={40} label="Determinate" showLabel />
        <ProgressBase value={3} max={8} label="Step counter" showLabel />
        <ProgressBase label="Indeterminate" />
      </div>
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("progressbar", { name: "Determinate" })).toHaveAttribute(
      "aria-valuenow",
      "40",
    );
    // No stand-in number while the total is unknown.
    await expect(canvas.getByRole("progressbar", { name: "Indeterminate" })).not.toHaveAttribute(
      "aria-valuenow",
    );
  },
};
