import type { Meta, StoryObj } from "@storybook/react-vite";
import { Progress } from "@utk09/finra-ui";
import { ProgressBase } from "@utk09/finra-ui/unstyled";
import { useEffect, useState } from "react";
import { expect, within } from "storybook/test";

import { APPEARANCE, forwardsTo, inDark, LabelledRow, Stack, TokenScope } from "./_shared";

const meta: Meta<typeof Progress> = {
  title: "Components/Progress",
  component: Progress,
  parameters: {
    layout: "padded",
    // Picks up value, max, label and the label formatting, all declared on the
    // base rather than here.
    docs: {
      inheritsFrom: ProgressBase,
      // Mirrors the `Omit` on the styled props: the styled layer fills this in.
      inheritedOmit: ["classNames"],
      forwardsTo: forwardsTo("div"),
    },
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    sentiment: {
      control: "select",
      options: [undefined, "danger", "success", "warning", "info"],
      table: { category: APPEARANCE },
    },
    value: { control: { type: "number", min: 0, max: 100 } },
    showLabel: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: 42, label: "Uploading trades" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByRole("progressbar", { name: "Uploading trades" });
    await expect(bar).toHaveAttribute("aria-valuenow", "42");
    await expect(bar).toHaveAttribute("aria-valuemin", "0");
    await expect(bar).toHaveAttribute("aria-valuemax", "100");
  },
};

export const WithLabel: Story = {
  args: { value: 42, label: "Uploading trades", showLabel: true },
};

/**
 * Omit `value` for work whose total is not yet known. The bar carries no
 * `aria-valuenow` at all rather than a stand-in number, which is what tells a
 * screen reader the progress is indeterminate.
 */
export const Indeterminate: Story = {
  args: { label: "Contacting the venue" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByRole("progressbar");
    await expect(bar).not.toHaveAttribute("aria-valuenow");
  },
};

/** Zero is a determinate state: no progress, not unknown progress. */
export const Zero: Story = {
  args: { value: 0, label: "Queued", showLabel: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  },
};

export const Sentiments: Story = {
  render: () => (
    <Stack gap="1rem">
      <LabelledRow label="default">
        <div style={{ inlineSize: "18rem" }}>
          <Progress value={60} label="Default" />
        </div>
      </LabelledRow>
      {(["danger", "success", "warning", "info"] as const).map((sentiment) => (
        <LabelledRow key={sentiment} label={sentiment}>
          <div style={{ inlineSize: "18rem" }}>
            <Progress value={60} sentiment={sentiment} label={`${sentiment} progress`} />
          </div>
        </LabelledRow>
      ))}
    </Stack>
  ),
};

/** `aria-valuenow` reports the raw value, so a step counter reads "3 of 8". */
export const StepCounter: Story = {
  args: {
    value: 3,
    max: 8,
    label: "Order ticket steps",
    showLabel: true,
    formatLabel: (_percent, value, max) => `${value} of ${max}`,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "3");
    await expect(canvas.getByText("3 of 8")).toBeInTheDocument();
  },
};

function Advancing() {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setValue((current) => (current >= 100 ? 0 : current + 5)), 400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ inlineSize: "20rem" }}>
      <Progress value={value} label="Downloading positions" showLabel />
    </div>
  );
}

/** The fill transitions between values, and holds still under reduced motion. */
export const Advances: Story = {
  render: () => <Advancing />,
};

/**
 * Height and width are layout, not props. Both are reachable by selector, and
 * the fill colour is a token.
 *
 * ```css
 * .thick-progress [data-finra-ui="progress-track"] {
 *   block-size: 1rem;
 * }
 * ```
 */
export const Overrides: Story = {
  render: () => (
    <>
      <style>{`
        .progress-override [data-finra-ui="progress-track"] {
          block-size: 1rem;
        }
      `}</style>
      <Stack gap="1.5rem">
        <div style={{ inlineSize: "18rem" }}>
          <Progress value={60} label="Default" />
        </div>
        <TokenScope tokens={{ "--finra-actionable-accent": "#7c3aed" }}>
          <div style={{ inlineSize: "18rem" }}>
            <Progress value={60} label="Recoloured token" />
          </div>
        </TokenScope>
        <div className="progress-override" style={{ inlineSize: "18rem" }}>
          <Progress value={60} label="Thicker by selector" />
        </div>
      </Stack>
    </>
  ),
};

/** Dark-mode counterpart of `WithLabel`, so the accessibility check covers dark contrast. */
export const DarkMode: Story = inDark(WithLabel);
