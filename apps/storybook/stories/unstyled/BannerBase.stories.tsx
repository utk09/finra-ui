import type { Meta, StoryObj } from "@storybook/react-vite";
import { BannerBase } from "@utk09/finra-ui/unstyled";
import { expect, within } from "storybook/test";

import { forwardsTo } from "../_shared";

const meta: Meta<typeof BannerBase> = {
  title: "Unstyled/BannerBase",
  component: BannerBase,
  parameters: {
    layout: "padded",
    docs: { forwardsTo: forwardsTo("div") },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The base contributes structure, announcement and state, never colour: a part
 * per slot, plus `data-sentiment` and a live-region role for a stylesheet and a
 * screen reader to hook. It ships no icon, so the leading slot stays empty
 * until `renderIcon` returns one.
 *
 * With no CSS attached there is nothing to see, so this story outlines the
 * parts to show what a consumer's own rules would be styling.
 */
export const Default: Story = {
  render: () => (
    <>
      <style>{`
        .banner-outline [data-finra-ui="banner"] {
          display: flex;
          gap: 0.5rem;
          padding: 0.5rem;
          outline: 1px dashed currentColor;
        }
        .banner-outline [data-finra-ui="banner-content"] { flex: 1; }
        .banner-outline [data-finra-ui="banner-title"] { font-weight: 600; }
      `}</style>
      <div className="banner-outline" style={{ display: "grid", gap: "1rem", maxWidth: 480 }}>
        <BannerBase sentiment="danger" title="Order rejected" dismissible>
          Insufficient buying power for 500 shares of ACME.
        </BannerBase>
        <BannerBase title="Scheduled maintenance">
          The platform is unavailable on Sunday between 02:00 and 04:00.
        </BannerBase>
      </div>
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const alert = canvas.getByRole("alert");
    await expect(alert).toHaveAttribute("aria-live", "assertive");
    await expect(alert).toHaveAttribute("data-sentiment", "danger");

    // The neutral banner is the second root, and it announces nothing.
    const [, neutral] = canvas.getAllByTestId("banner");
    await expect(neutral).not.toHaveAttribute("role");

    // No icon ships with the unstyled layer, so neither banner has the slot.
    await expect(canvas.queryByTestId("banner-icon")).not.toBeInTheDocument();
    // The dismiss glyph is a text character rather than an SVG.
    await expect(canvas.getByTestId("banner-close")).toHaveTextContent("×");
  },
};
