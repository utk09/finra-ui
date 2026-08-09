import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "@utk09/finra-ui";
import { SkeletonBase } from "@utk09/finra-ui/unstyled";
import { expect, within } from "storybook/test";

import { forwardsTo, inDark, LabelledRow, Stack, TokenScope } from "./_shared";

const meta: Meta<typeof Skeleton> = {
  title: "Components/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "padded",
    docs: {
      inheritsFrom: SkeletonBase,
      // Mirrors the `Omit` on the styled props: the styled layer fills this in.
      inheritedOmit: ["classNames"],
      forwardsTo: forwardsTo("div"),
    },
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    variant: { control: "select", options: ["text", "circular", "rectangular"] },
    animation: { control: "select", options: ["pulse", "wave", "none"] },
    lines: { control: { type: "number", min: 0, max: 8 } },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { lines: 3 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // A placeholder is decoration: it has nothing to announce, and the content
    // it stands in for announces itself when it arrives.
    await expect(canvas.getByTestId("skeleton")).toHaveAttribute("aria-hidden", "true");
  },
};

/**
 * A text placeholder is exactly one line-height tall, so swapping in the real
 * text shifts nothing. That holds at every density and for any font size,
 * because the line box is measured rather than assumed.
 */
export const MatchesTheTextItReplaces: Story = {
  render: () => (
    <Stack gap="1.5rem">
      {(["high", "medium", "low"] as const).map((density) => (
        <div key={density} data-density={density}>
          <LabelledRow label={density}>
            <div style={{ inlineSize: "18rem" }}>
              <p style={{ margin: 0 }}>Real text on one line</p>
              <Skeleton lines={1} />
            </div>
          </LabelledRow>
        </div>
      ))}
    </Stack>
  ),
};

export const Variants: Story = {
  render: () => (
    <Stack gap="1.5rem">
      <LabelledRow label="text">
        <div style={{ inlineSize: "18rem" }}>
          <Skeleton lines={3} />
        </div>
      </LabelledRow>
      <LabelledRow label="circular">
        <Skeleton variant="circular" />
      </LabelledRow>
      <LabelledRow label="rectangular">
        <div style={{ inlineSize: "18rem" }}>
          <Skeleton variant="rectangular" />
        </div>
      </LabelledRow>
    </Stack>
  ),
};

export const Animations: Story = {
  render: () => (
    <Stack gap="1.5rem">
      {(["pulse", "wave", "none"] as const).map((animation) => (
        <LabelledRow key={animation} label={animation}>
          <div style={{ inlineSize: "18rem" }}>
            <Skeleton animation={animation} lines={2} />
          </div>
        </LabelledRow>
      ))}
    </Stack>
  ),
};

/** What a loading card looks like before its data arrives. */
export const CardPlaceholder: Story = {
  render: () => (
    <div
      style={{
        inlineSize: "20rem",
        display: "flex",
        gap: "0.75rem",
        padding: "1rem",
        border: "var(--finra-border-thin) solid var(--finra-container-border)",
        borderRadius: "var(--finra-radius-lg)",
      }}>
      <Skeleton variant="circular" />
      <div style={{ flex: 1 }}>
        <Skeleton lines={3} />
      </div>
    </div>
  ),
};

/**
 * The placeholder surface is `--finra-container-track`, so redeclaring that on
 * an ancestor restyles every skeleton in a region. Dimensions are not a prop:
 * a rule against the id sizes one instance.
 *
 * ```css
 * .avatar-placeholder [data-finra-ui="skeleton"] {
 *   inline-size: 4rem;
 *   block-size: 4rem;
 * }
 * ```
 */
export const Overrides: Story = {
  render: () => (
    <>
      <style>{`
        .skeleton-override [data-finra-ui="skeleton"] {
          inline-size: 4rem;
          block-size: 4rem;
        }
      `}</style>
      <Stack gap="1.5rem">
        <LabelledRow label="Default">
          <Skeleton variant="circular" />
        </LabelledRow>
        <TokenScope tokens={{ "--finra-container-track": "#c4b5fd" }}>
          <LabelledRow label="Recoloured token">
            <Skeleton variant="circular" />
          </LabelledRow>
        </TokenScope>
        <div className="skeleton-override">
          <LabelledRow label="Resized by selector">
            <Skeleton variant="circular" />
          </LabelledRow>
        </div>
      </Stack>
    </>
  ),
};

/** Dark-mode counterpart of `Default`, so the accessibility check covers dark contrast. */
export const DarkMode: Story = inDark(Default);
