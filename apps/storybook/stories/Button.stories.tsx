import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, type ButtonSentiment } from "@utk09/finra-ui";
import { ButtonBase } from "@utk09/finra-ui/unstyled";
import { expect, fn, userEvent, within } from "storybook/test";

import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  EditIcon,
  MailIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "./_icons";
import { forwardsTo, inDark, NATIVE, Row, Stack, TokenScope } from "./_shared";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
    // `ButtonProps extends ButtonBaseProps`, and docgen does not follow
    // `extends` across modules. Without this the base's own props are absent.
    docs: {
      inheritsFrom: ButtonBase,
      forwardsTo: forwardsTo("button", "button element"),
    },
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
    fullWidth: {
      control: "boolean",
    },
    children: {
      control: "text",
      description:
        "Button label. Keep it a verb phrase naming the action; an icon alone needs `IconButton` and an `aria-label` instead.",
      table: { category: NATIVE, type: { summary: "ReactNode" } },
    },
    disabled: {
      control: "boolean",
      description:
        "Native disabled state. A disabled button is not focusable and fires no events, so it cannot explain itself; prefer leaving it enabled and reporting why on activation.",
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
const SENTIMENT_ROWS: { label: string; sentiment?: ButtonSentiment }[] = [
  { label: "Default" },
  { label: "Danger", sentiment: "danger" },
  { label: "Success", sentiment: "success" },
  { label: "Warning", sentiment: "warning" },
  { label: "Info", sentiment: "info" },
];

const VARIANTS = ["primary", "secondary", "tertiary"] as const;

//  Variant stories

export const Primary: Story = {
  args: {
    children: "Primary Button",
    variant: "primary",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Primary Button" });
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute("type", "button");
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Secondary: Story = {
  args: {
    children: "Secondary Button",
    variant: "secondary",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Secondary Button" });
    await expect(button).toBeVisible();
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Tertiary: Story = {
  args: {
    children: "Tertiary Button",
    variant: "tertiary",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Tertiary Button" });
    await expect(button).toBeVisible();
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

//  Sentiment stories

export const Danger: Story = {
  args: {
    children: "Delete",
    sentiment: "danger",
  },
};

export const Success: Story = {
  args: {
    children: "Approve",
    sentiment: "success",
  },
};

export const Warning: Story = {
  args: {
    children: "Caution",
    sentiment: "warning",
  },
};

//  State stories

export const Disabled: Story = {
  args: {
    children: "Disabled Button",
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Disabled Button" });
    await expect(button).toBeDisabled();
  },
};

/**
 * Disabled beside enabled, for every variant and sentiment.
 *
 * A disabled button keeps its meaning and loses its emphasis. The fill drops to
 * the sentiment's own subtle wash, the label keeps the sentiment's accent, and
 * the border goes to the inert neutral edge, so a disabled Delete still reads as
 * destructive and nothing that can be operated looks like this.
 *
 * The label is never dimmed with an opacity, which would composite the text down
 * along with the fill: white on a half-strength accent renders 2.14:1. Every
 * pair here measures 4.75:1 or better in both themes.
 */
export const DisabledSentiments: Story = {
  render: () => (
    <Stack gap="0.75rem">
      {SENTIMENT_ROWS.map(({ label, sentiment }) => (
        <Row key={label}>
          <span style={{ minInlineSize: "5rem" }}>{label}</span>
          {VARIANTS.flatMap((variant) => [
            <Button key={variant} variant={variant} sentiment={sentiment}>
              {`${label} ${variant}`}
            </Button>,
            <Button
              key={`${variant} disabled`}
              variant={variant}
              sentiment={sentiment}
              disabled>{`${label} ${variant} disabled`}</Button>,
          ])}
        </Row>
      ))}
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const styleOf = (name: string) => getComputedStyle(canvas.getByRole("button", { name }));

    // The sentiment survives being disabled. A flat neutral treatment paints all
    // four labels the same colour, which is what this row catches.
    const inks = new Set(
      SENTIMENT_ROWS.filter((row) => row.sentiment).map(
        (row) => styleOf(`${row.label} primary disabled`).color,
      ),
    );
    await expect(inks.size).toBe(4);
    await expect(styleOf("Danger primary disabled").color).not.toBe(
      styleOf("Default primary disabled").color,
    );

    // And disabled is visibly different from enabled rather than merely legible:
    // the fill changes in all three variants, and secondary drops its accent
    // edge for the inert one.
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

export const FullWidth: Story = {
  args: {
    children: "Full Width Button",
    fullWidth: true,
  },
};

//  Icon stories

export const WithStartIcon: Story = {
  args: {
    children: "Search",
    startIcon: <SearchIcon />,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Search" });
    await expect(button).toBeVisible();
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const WithEndIcon: Story = {
  args: {
    children: "Next",
    endIcon: <ChevronRightIcon />,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Next" });
    await expect(button).toBeVisible();
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const WithBothIcons: Story = {
  args: {
    children: "Navigate",
    startIcon: <ChevronLeftIcon />,
    endIcon: <ChevronRightIcon />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Navigate" });
    await expect(button).toBeVisible();
  },
};

export const IconVariations: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Primary variant with icons */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ width: 100 }}>Primary:</span>
        <Button variant="primary" startIcon={<SearchIcon />}>
          Search
        </Button>
        <Button variant="primary" startIcon={<PlusIcon />}>
          Add
        </Button>
        <Button variant="primary" endIcon={<ChevronRightIcon />}>
          Next
        </Button>
        <Button variant="primary" startIcon={<MailIcon />} endIcon={<ChevronRightIcon />}>
          Send
        </Button>
      </div>
      {/* Secondary variant with icons */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ width: 100 }}>Secondary:</span>
        <Button variant="secondary" startIcon={<EditIcon />}>
          Edit
        </Button>
        <Button variant="secondary" startIcon={<TrashIcon />} sentiment="danger">
          Delete
        </Button>
        <Button variant="secondary" startIcon={<CheckIcon />} sentiment="success">
          Approve
        </Button>
      </div>
      {/* Tertiary variant with icons */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ width: 100 }}>Tertiary:</span>
        <Button variant="tertiary" startIcon={<CloseIcon />}>
          Cancel
        </Button>
        <Button variant="tertiary" startIcon={<SearchIcon />}>
          Search
        </Button>
        <Button variant="tertiary" endIcon={<ChevronRightIcon />}>
          More
        </Button>
      </div>
      {/* Sentiment variants with icons */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ width: 100 }}>Sentiments:</span>
        <Button sentiment="danger" startIcon={<TrashIcon />}>
          Delete
        </Button>
        <Button sentiment="success" startIcon={<CheckIcon />}>
          Approve
        </Button>
        <Button sentiment="warning" startIcon={<CloseIcon />}>
          Caution
        </Button>
        <Button sentiment="info" startIcon={<MailIcon />}>
          Info
        </Button>
      </div>
    </div>
  ),
};

//  Showcase stories

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="tertiary">Tertiary</Button>
    </div>
  ),
};

export const AllSentiments: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span style={{ width: 80 }}>Default:</span>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="tertiary">Tertiary</Button>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span style={{ width: 80 }}>Danger:</span>
        <Button variant="primary" sentiment="danger">
          Primary
        </Button>
        <Button variant="secondary" sentiment="danger">
          Secondary
        </Button>
        <Button variant="tertiary" sentiment="danger">
          Tertiary
        </Button>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span style={{ width: 80 }}>Success:</span>
        <Button variant="primary" sentiment="success">
          Primary
        </Button>
        <Button variant="secondary" sentiment="success">
          Secondary
        </Button>
        <Button variant="tertiary" sentiment="success">
          Tertiary
        </Button>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span style={{ width: 80 }}>Warning:</span>
        <Button variant="primary" sentiment="warning">
          Primary
        </Button>
        <Button variant="secondary" sentiment="warning">
          Secondary
        </Button>
        <Button variant="tertiary" sentiment="warning">
          Tertiary
        </Button>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span style={{ width: 80 }}>Info:</span>
        <Button variant="primary" sentiment="info">
          Primary
        </Button>
        <Button variant="secondary" sentiment="info">
          Secondary
        </Button>
        <Button variant="tertiary" sentiment="info">
          Tertiary
        </Button>
      </div>
    </div>
  ),
};

export const WithAccessibility: Story = {
  args: {
    children: "Accessible Button",
    "aria-label": "Save document",
    "aria-pressed": false,
  },
};

/**
 * Restyling without a class name. The wrapper redeclares the actionable tokens
 * and every button inside follows, hover, active and disabled states included.
 * The `danger` sentiment reads the status tokens instead, so it is unaffected.
 *
 * `--finra-actionable-accent-subtle` is what a disabled button fills with, so a
 * brand that redeclares it gets a disabled state in its own colour rather than a
 * leftover blue.
 *
 * ```css
 * .brand-region {
 *   --finra-actionable-accent: #7c3aed;
 *   --finra-actionable-accent-hover: #6d28d9;
 *   --finra-actionable-accent-active: #5b21b6;
 *   --finra-actionable-accent-subtle: #ede9fe;
 * }
 * ```
 */
export const Overrides: Story = {
  render: () => (
    <Stack gap="1.25rem">
      <Row>
        <span style={{ minInlineSize: "6rem" }}>Default</span>
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button sentiment="danger">Danger</Button>
        <Button disabled>Disabled</Button>
      </Row>
      <TokenScope
        tokens={{
          "--finra-actionable-accent": "#7c3aed",
          "--finra-actionable-accent-hover": "#6d28d9",
          "--finra-actionable-accent-active": "#5b21b6",
          "--finra-actionable-accent-subtle": "#ede9fe",
        }}>
        <span style={{ minInlineSize: "6rem" }}>Overridden</span>
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button sentiment="danger">Danger</Button>
        <Button disabled>Disabled branded</Button>
      </TokenScope>
    </Stack>
  ),
};

/** Dark-mode counterpart of `Primary`, so the accessibility check covers dark contrast. */
export const DarkMode: Story = inDark(Primary);

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
