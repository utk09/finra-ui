import type { Meta, StoryObj } from "@storybook/react-vite";
import { Banner, Button } from "@utk09/finra-ui";
import { BannerBase } from "@utk09/finra-ui/unstyled";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import { forwardsTo, inDark, LabelledRow, Stack, TokenScope } from "./_shared";

const meta: Meta<typeof Banner> = {
  title: "Components/Banner",
  component: Banner,
  parameters: {
    layout: "padded",
    docs: {
      inheritsFrom: BannerBase,
      // Mirrors the `Omit` on the styled props: the styled layer fills these in.
      inheritedOmit: ["renderIcon", "classNames"],
      forwardsTo: forwardsTo("div"),
    },
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    sentiment: { control: "select", options: [undefined, "danger", "success", "warning", "info"] },
    title: { control: "text" },
    dismissible: { control: "boolean" },
    dismissLabel: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    sentiment: "info",
    title: "Market data delayed",
    children: "Prices shown are delayed by 15 minutes.",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status")).toHaveAttribute("aria-live", "polite");
  },
};

function Toggleable() {
  const [shown, setShown] = useState(true);
  return (
    <Stack gap="0.75rem">
      <Button onClick={() => setShown((value) => !value)}>
        {shown ? "Hide banner" : "Show banner"}
      </Button>
      {shown ? (
        <Banner sentiment="warning" title="Market closed">
          Orders entered now queue until 09:30.
        </Banner>
      ) : null}
      <p style={{ margin: 0 }}>Content below the banner.</p>
    </Stack>
  );
}

/**
 * A banner occupies layout space, which is the whole reason it exists as
 * something other than a Toast. Mounting one moves the content below it down;
 * dismissing it moves that content back.
 */
export const OccupiesLayoutSpace: Story = {
  render: () => <Toggleable />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const below = canvas.getByText("Content below the banner.");
    const withBanner = below.getBoundingClientRect().top;

    await userEvent.click(canvas.getByRole("button", { name: "Hide banner" }));
    const withoutBanner = below.getBoundingClientRect().top;

    // Both states, not only the one that proves the point: the banner has to
    // take space when present and give it back when gone.
    await expect(withBanner).toBeGreaterThan(withoutBanner);
    await expect(canvas.queryByTestId("banner")).not.toBeInTheDocument();
  },
};

/**
 * Sentiment sets the colour and how loudly the banner announces. Danger and
 * warning interrupt a screen reader; success and info wait their turn. It is
 * never the sole carrier of the meaning, so each title says what happened.
 */
export const Sentiments: Story = {
  render: () => (
    <Stack gap="0.75rem">
      <Banner sentiment="danger" title="Order rejected">
        Insufficient buying power for 500 shares of ACME.
      </Banner>
      <Banner sentiment="warning" title="Market closed">
        Orders entered now queue until 09:30.
      </Banner>
      <Banner sentiment="success" title="Allocation booked">
        12 accounts allocated at an average price of 41.28.
      </Banner>
      <Banner sentiment="info" title="Market data delayed">
        Prices shown are delayed by 15 minutes.
      </Banner>
    </Stack>
  ),
};

/**
 * With no sentiment there is no status colour, no icon and no live-region role.
 * A banner that is part of the page rather than news about it should not
 * interrupt a screen reader on mount.
 */
export const Neutral: Story = {
  args: {
    title: "Scheduled maintenance",
    children: "The platform is unavailable on Sunday between 02:00 and 04:00.",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const banner = canvas.getByTestId("banner");
    await expect(banner).not.toHaveAttribute("role");
    await expect(canvas.queryByTestId("banner-icon")).not.toBeInTheDocument();
  },
};

/** Removing the banner is the caller's job, so `onDismiss` only reports the click. */
export const Dismissible: Story = {
  args: {
    sentiment: "info",
    title: "New allocation rules",
    children: "Block trades now default to pro-rata allocation.",
    dismissible: true,
    onDismiss: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Dismiss" }));
    await expect(args.onDismiss).toHaveBeenCalledTimes(1);
    // Still mounted: the banner does not decide what fills the space it leaves.
    await expect(canvas.getByTestId("banner")).toBeInTheDocument();
  },
};

/** A trailing action, and a dismiss button beside it. */
export const WithAction: Story = {
  args: {
    sentiment: "danger",
    title: "Connection lost",
    children: "Streaming prices stopped updating at 14:32.",
    dismissible: true,
    action: (
      <Button variant="secondary" sentiment="danger">
        Reconnect
      </Button>
    ),
  },
};

/** Title and body are both optional; either alone is a valid banner. */
export const TitleAndBody: Story = {
  render: () => (
    <Stack gap="0.75rem">
      <LabelledRow label="Both">
        <Banner sentiment="info" title="Market data delayed">
          Prices shown are delayed by 15 minutes.
        </Banner>
      </LabelledRow>
      <LabelledRow label="Title only">
        <Banner sentiment="info" title="Market data delayed by 15 minutes" />
      </LabelledRow>
      <LabelledRow label="Body only">
        <Banner sentiment="info">Prices shown are delayed by 15 minutes.</Banner>
      </LabelledRow>
    </Stack>
  ),
};

/**
 * Two supported ways to restyle, neither of them a prop.
 *
 * The wash and the rule both read the sentiment's own tokens, so redeclaring
 * one on an ancestor restyles every banner in a region. Anything the tokens do
 * not cover is reached through the part's id, and `@layer finra-ui` means the
 * consumer rule wins without `!important`.
 *
 * ```css
 * .flush-banner [data-finra-ui="banner"] {
 *   border-radius: 0;
 *   border-inline-start-width: 0;
 *   padding-block: 1.25rem;
 * }
 * ```
 */
export const Overrides: Story = {
  render: () => (
    <>
      <style>{`
        .banner-override [data-finra-ui="banner"] {
          border-radius: 0;
          border-inline-start-width: 0;
          padding-block: 1.25rem;
        }
        .banner-override [data-finra-ui="banner-title"] {
          text-transform: uppercase;
          letter-spacing: var(--finra-tracking-wide);
        }
      `}</style>
      <Stack gap="1rem">
        <LabelledRow label="Default">
          <Banner sentiment="warning" title="Market closed">
            Orders entered now queue until 09:30.
          </Banner>
        </LabelledRow>
        <TokenScope tokens={{ "--finra-status-warning-subtle": "#ede9fe" }}>
          <LabelledRow label="Recoloured token">
            <Banner sentiment="warning" title="Market closed">
              Orders entered now queue until 09:30.
            </Banner>
          </LabelledRow>
        </TokenScope>
        <div className="banner-override">
          <LabelledRow label="Restyled by selector">
            <Banner sentiment="warning" title="Market closed">
              Orders entered now queue until 09:30.
            </Banner>
          </LabelledRow>
        </div>
      </Stack>
    </>
  ),
};

/** Dark-mode counterpart of `Sentiments`, so the accessibility check covers dark contrast. */
export const DarkMode: Story = inDark(Sentiments);
