import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconButton, type IconButtonSentiment } from "@utk09/finra-ui";
import { expect, fn, userEvent, within } from "storybook/test";

import {
  CheckIcon,
  CloseIcon,
  EditIcon,
  LockIcon,
  MailIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "./_icons";
import { forwardsTo, inDark, NATIVE, Row, Stack, TokenScope } from "./_shared";

const meta: Meta<typeof IconButton> = {
  title: "Components/IconButton",
  component: IconButton,
  parameters: {
    layout: "centered",
    docs: { forwardsTo: forwardsTo("button", "button element") },
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary"],
    },
    sentiment: {
      control: "select",
      options: [undefined, "danger", "success", "warning", "info"],
    },
    disabled: {
      control: "boolean",
      description:
        "Native disabled state. A disabled icon button is not focusable and fires no events.",
      table: { category: NATIVE, type: { summary: "boolean" } },
    },
    onClick: {
      description:
        "Fires on click and on Enter or Space while focused, because the element is a real `button`.",
      table: {
        category: NATIVE,
        type: { summary: "(event: MouseEvent<HTMLButtonElement>) => void" },
      },
    },
  },
  args: {
    onClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The sentiment-less default first, then the four sentiments. */
const SENTIMENT_ROWS: { label: string; sentiment?: IconButtonSentiment }[] = [
  { label: "Default" },
  { label: "Danger", sentiment: "danger" },
  { label: "Success", sentiment: "success" },
  { label: "Warning", sentiment: "warning" },
  { label: "Info", sentiment: "info" },
];

const VARIANTS = ["primary", "secondary", "tertiary"] as const;

//  Variant stories

export const Default: Story = {
  args: {
    icon: <PlusIcon />,
    "aria-label": "Add item",
    variant: "primary",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Add item" });
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute("type", "button");
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Secondary: Story = {
  args: {
    icon: <EditIcon />,
    "aria-label": "Edit item",
    variant: "secondary",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Edit item" });
    await expect(button).toBeVisible();
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Tertiary: Story = {
  args: {
    icon: <CloseIcon />,
    "aria-label": "Close",
    variant: "tertiary",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Close" });
    await expect(button).toBeVisible();
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

//  Sentiment stories

export const DangerSentiment: Story = {
  args: {
    icon: <TrashIcon />,
    "aria-label": "Delete item",
    sentiment: "danger",
  },
};

export const SuccessSentiment: Story = {
  args: {
    icon: <CheckIcon />,
    "aria-label": "Approve",
    sentiment: "success",
  },
};

export const WarningSentiment: Story = {
  args: {
    icon: <CloseIcon />,
    "aria-label": "Warning action",
    sentiment: "warning",
  },
};

export const InfoSentiment: Story = {
  args: {
    icon: <MailIcon />,
    "aria-label": "Info",
    sentiment: "info",
  },
};

//  State stories

export const Disabled: Story = {
  args: {
    icon: <PlusIcon />,
    "aria-label": "Add item (disabled)",
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Add item (disabled)" });
    await expect(button).toBeDisabled();
  },
};

/**
 * Disabled beside enabled, for every variant and sentiment.
 *
 * The same treatment `Button` uses. An icon-only control's glyph is a graphic
 * rather than text, so the 4.5:1 minimum does not formally reach it. It is held
 * to that bar anyway: the two controls sit side by side in a toolbar, and an
 * icon that fades while the label beside it keeps its colour reads as a defect
 * whatever the specification allows.
 */
export const DisabledSentiments: Story = {
  render: () => (
    <Stack gap="0.75rem">
      {SENTIMENT_ROWS.map(({ label, sentiment }) => (
        <Row key={label}>
          <span style={{ minInlineSize: "5rem" }}>{label}</span>
          {VARIANTS.flatMap((variant) => [
            <IconButton
              key={variant}
              variant={variant}
              sentiment={sentiment}
              icon={<PlusIcon />}
              aria-label={`${label} ${variant}`}
            />,
            <IconButton
              key={`${variant} disabled`}
              variant={variant}
              sentiment={sentiment}
              icon={<PlusIcon />}
              aria-label={`${label} ${variant} disabled`}
              disabled
            />,
          ])}
        </Row>
      ))}
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const styleOf = (name: string) => getComputedStyle(canvas.getByRole("button", { name }));

    // The icon is `stroke="currentColor"`, so the button's colour is the glyph's.
    // Four sentiments, four colours: a flat neutral treatment paints one.
    const inks = new Set(
      SENTIMENT_ROWS.filter((row) => row.sentiment).map(
        (row) => styleOf(`${row.label} primary disabled`).color,
      ),
    );
    await expect(inks.size).toBe(4);
    await expect(styleOf("Danger primary disabled").color).not.toBe(
      styleOf("Default primary disabled").color,
    );

    // Disabled is visibly different from enabled in every variant, not merely
    // legible: the fill changes in all three, and secondary drops its accent edge.
    for (const variant of VARIANTS) {
      await expect(styleOf(`Danger ${variant} disabled`).backgroundColor).not.toBe(
        styleOf(`Danger ${variant}`).backgroundColor,
      );
    }
    await expect(styleOf("Danger secondary disabled").borderTopColor).not.toBe(
      styleOf("Danger secondary").borderTopColor,
    );
  },
};

//  Showcase stories

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <IconButton variant="primary" icon={<PlusIcon />} aria-label="Primary add" />
      <IconButton variant="secondary" icon={<EditIcon />} aria-label="Secondary edit" />
      <IconButton variant="tertiary" icon={<CloseIcon />} aria-label="Tertiary close" />
    </div>
  ),
};

export const AllSentiments: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Primary variant across sentiments */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span style={{ width: 100 }}>Primary:</span>
        <IconButton variant="primary" icon={<PlusIcon />} aria-label="Default" />
        <IconButton variant="primary" sentiment="danger" icon={<TrashIcon />} aria-label="Danger" />
        <IconButton
          variant="primary"
          sentiment="success"
          icon={<CheckIcon />}
          aria-label="Success"
        />
        <IconButton
          variant="primary"
          sentiment="warning"
          icon={<CloseIcon />}
          aria-label="Warning"
        />
        <IconButton variant="primary" sentiment="info" icon={<MailIcon />} aria-label="Info" />
      </div>
      {/* Secondary variant across sentiments */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span style={{ width: 100 }}>Secondary:</span>
        <IconButton variant="secondary" icon={<PlusIcon />} aria-label="Default" />
        <IconButton
          variant="secondary"
          sentiment="danger"
          icon={<TrashIcon />}
          aria-label="Danger"
        />
        <IconButton
          variant="secondary"
          sentiment="success"
          icon={<CheckIcon />}
          aria-label="Success"
        />
        <IconButton
          variant="secondary"
          sentiment="warning"
          icon={<CloseIcon />}
          aria-label="Warning"
        />
        <IconButton variant="secondary" sentiment="info" icon={<MailIcon />} aria-label="Info" />
      </div>
      {/* Tertiary variant across sentiments */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span style={{ width: 100 }}>Tertiary:</span>
        <IconButton variant="tertiary" icon={<PlusIcon />} aria-label="Default" />
        <IconButton
          variant="tertiary"
          sentiment="danger"
          icon={<TrashIcon />}
          aria-label="Danger"
        />
        <IconButton
          variant="tertiary"
          sentiment="success"
          icon={<CheckIcon />}
          aria-label="Success"
        />
        <IconButton
          variant="tertiary"
          sentiment="warning"
          icon={<CloseIcon />}
          aria-label="Warning"
        />
        <IconButton variant="tertiary" sentiment="info" icon={<MailIcon />} aria-label="Info" />
      </div>
      {/* All icon types */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span style={{ width: 100 }}>All icons:</span>
        <IconButton icon={<SearchIcon />} aria-label="Search" />
        <IconButton icon={<CloseIcon />} aria-label="Close" />
        <IconButton icon={<PlusIcon />} aria-label="Add" />
        <IconButton icon={<TrashIcon />} aria-label="Delete" />
        <IconButton icon={<CheckIcon />} aria-label="Check" />
        <IconButton icon={<EditIcon />} aria-label="Edit" />
        <IconButton icon={<MailIcon />} aria-label="Mail" />
        <IconButton icon={<LockIcon />} aria-label="Lock" />
      </div>
    </div>
  ),
};

/**
 * Restyled by redeclaring the actionable tokens. The `danger` sentiment reads
 * the status tokens instead, so it is unaffected.
 *
 * `--finra-actionable-accent-subtle` is what a disabled icon button fills with,
 * so a brand that redeclares it gets a disabled state in its own colour rather
 * than a leftover blue.
 *
 * ```css
 * .brand-region {
 *   --finra-actionable-accent: #7c3aed;
 *   --finra-actionable-accent-hover: #6d28d9;
 *   --finra-actionable-accent-subtle: #ede9fe;
 * }
 * ```
 */
export const Overrides: Story = {
  render: () => (
    <Stack gap="1.25rem">
      <Row>
        <span style={{ minInlineSize: "6rem" }}>Default</span>
        <IconButton icon={<PlusIcon />} aria-label="Add" />
        <IconButton icon={<TrashIcon />} aria-label="Delete" sentiment="danger" />
        <IconButton icon={<PlusIcon />} aria-label="Add disabled" disabled />
      </Row>
      <TokenScope
        tokens={{
          "--finra-actionable-accent": "#7c3aed",
          "--finra-actionable-accent-hover": "#6d28d9",
          "--finra-actionable-accent-active": "#5b21b6",
          "--finra-actionable-accent-subtle": "#ede9fe",
        }}>
        <span style={{ minInlineSize: "6rem" }}>Overridden</span>
        <IconButton icon={<PlusIcon />} aria-label="Add branded" />
        <IconButton icon={<TrashIcon />} aria-label="Delete branded" sentiment="danger" />
        <IconButton icon={<PlusIcon />} aria-label="Add branded disabled" disabled />
      </TokenScope>
    </Stack>
  ),
};

/** Dark-mode counterpart of `Default`, so the accessibility check covers dark contrast. */
export const DarkMode: Story = inDark(Default);

/**
 * Dark-mode counterpart of `DisabledSentiments`, which is the state most likely
 * to break: the disabled colours are the only ones a component picks for itself
 * rather than inheriting from its variant, and the sentiment ramps invert
 * between themes.
 */
export const DarkModeDisabled: Story = inDark(
  DisabledSentiments,
  "Every variant and sentiment, disabled beside enabled, in dark mode. The play function measures the same colours here, so a treatment that only holds in light fails.",
);
