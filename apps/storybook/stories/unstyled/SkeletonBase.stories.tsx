import type { Meta, StoryObj } from "@storybook/react-vite";
import { SkeletonBase } from "@utk09/finra-ui/unstyled";
import { expect, within } from "storybook/test";

import { forwardsTo } from "../_shared";

const meta: Meta<typeof SkeletonBase> = {
  title: "Unstyled/SkeletonBase",
  component: SkeletonBase,
  parameters: {
    layout: "padded",
    docs: { forwardsTo: forwardsTo("div") },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The base contributes structure and state, never dimensions: one element per
 * line, plus `data-variant` and `data-animation` for a stylesheet to hook. With
 * no CSS attached there is nothing to see, so this story outlines the boxes to
 * show what a consumer's own rules would be styling.
 */
export const Default: Story = {
  render: () => (
    <>
      <style>{`
        .skeleton-outline [data-finra-ui="skeleton-line"] {
          block-size: 1lh;
          outline: 1px dashed currentColor;
        }
      `}</style>
      <div className="skeleton-outline" style={{ display: "grid", gap: "1rem", maxWidth: 320 }}>
        <SkeletonBase lines={3} />
        <SkeletonBase variant="rectangular" animation="wave" />
      </div>
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [root] = canvas.getAllByTestId("skeleton");
    await expect(root).toHaveAttribute("aria-hidden", "true");
    await expect(canvas.getAllByTestId("skeleton-line")).toHaveLength(3);
  },
};
