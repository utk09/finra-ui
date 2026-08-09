import type { Meta, StoryObj } from "@storybook/react-vite";
import { SpinnerBase } from "@utk09/finra-ui/unstyled";
import { expect, within } from "storybook/test";

import { forwardsTo } from "../_shared";

const meta: Meta<typeof SpinnerBase> = {
  title: "Unstyled/SpinnerBase",
  component: SpinnerBase,
  parameters: {
    layout: "padded",
    docs: { forwardsTo: forwardsTo("span") },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The unstyled layer ships no icon and no animation, so a labelled spinner
 * renders its label as text. The styled layer swaps in the spinning glyph
 * through `renderIndicator`, at which point the label moves to `aria-label`.
 */
export const Default: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <SpinnerBase label="Loading positions" />
      <SpinnerBase label="With an indicator" renderIndicator={() => <span>◐</span>} />
      <span>
        <SpinnerBase /> decorative, hidden from assistive tech
      </span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [announced] = canvas.getAllByRole("status");
    await expect(announced).toHaveTextContent("Loading positions");
  },
};
