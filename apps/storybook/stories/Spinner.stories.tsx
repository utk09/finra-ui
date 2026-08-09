import type { Meta, StoryObj } from "@storybook/react-vite";
import { Spinner } from "@utk09/finra-ui";
import { SpinnerBase } from "@utk09/finra-ui/unstyled";
import { expect, within } from "storybook/test";

import { forwardsTo, inDark, LabelledRow, Stack, TokenScope } from "./_shared";

const meta: Meta<typeof Spinner> = {
  title: "Components/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
    // Picks up `label`, which is declared on the base rather than here.
    docs: {
      inheritsFrom: SpinnerBase,
      // Mirrors the `Omit` on the styled props: the styled layer fills these in.
      inheritedOmit: ["renderIndicator", "children"],
      forwardsTo: forwardsTo("span"),
    },
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    label: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: "Loading positions" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const spinner = canvas.getByRole("status");
    await expect(spinner).toHaveAccessibleName("Loading positions");
  },
};

/**
 * Without a label the spinner is hidden from assistive tech entirely. Use this
 * inside something that already announces the loading state, so the news is
 * read once rather than twice.
 */
export const Decorative: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("status")).not.toBeInTheDocument();
    await expect(canvas.getByTestId("spinner")).toHaveAttribute("aria-hidden", "true");
  },
};

/**
 * No size prop. The glyph reads `--finra-density-icon-size`, so a spinner
 * follows whatever density it is dropped into.
 */
export const Densities: Story = {
  render: () => (
    <Stack gap="1rem">
      {(["high", "medium", "low"] as const).map((density) => (
        <div key={density} data-density={density}>
          <LabelledRow label={density}>
            <Spinner label={`Loading at ${density} density`} />
          </LabelledRow>
        </div>
      ))}
    </Stack>
  ),
};

/** The glyph strokes with `currentColor`, so it follows the text around it. */
export const FollowsTextColour: Story = {
  render: () => (
    <Stack gap="0.75rem">
      <p style={{ margin: 0, color: "var(--finra-status-danger-accent)" }}>
        <Spinner label="Retrying" /> Retrying the request
      </p>
      <p style={{ margin: 0, color: "var(--finra-container-foreground-muted)" }}>
        <Spinner label="Loading quietly" /> Fetching in the background
      </p>
    </Stack>
  ),
};

/**
 * Two supported ways to restyle, both without a prop.
 *
 * Colour comes from `currentColor`, so setting `color` on an ancestor changes
 * the glyph. Size comes from the density token, so a rule against the id
 * resizes one instance without touching the others.
 *
 * ```css
 * .compact-spinner [data-finra-ui="spinner-glyph"] {
 *   inline-size: 2.5rem;
 *   block-size: 2.5rem;
 * }
 * ```
 */
export const Overrides: Story = {
  render: () => (
    <>
      <style>{`
        .spinner-override [data-finra-ui="spinner-glyph"] {
          inline-size: 2.5rem;
          block-size: 2.5rem;
        }
      `}</style>
      <Stack gap="1.5rem">
        <LabelledRow label="Default">
          <Spinner label="Default spinner" />
        </LabelledRow>
        <TokenScope tokens={{ color: "#7c3aed" }}>
          <LabelledRow label="Inherited colour">
            <Spinner label="Purple spinner" />
          </LabelledRow>
        </TokenScope>
        <div className="spinner-override">
          <LabelledRow label="Resized by selector">
            <Spinner label="Large spinner" />
          </LabelledRow>
        </div>
      </Stack>
    </>
  ),
};

/** Dark-mode counterpart of `Default`, so the accessibility check covers dark contrast. */
export const DarkMode: Story = inDark(Default);
