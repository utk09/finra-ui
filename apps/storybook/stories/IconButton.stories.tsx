import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconButton } from "@utk09/finra-ui";
import { fn, expect, userEvent, within } from "storybook/test";
import {
  SearchIcon,
  CloseIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  EditIcon,
  MailIcon,
  LockIcon,
} from "./_icons";

const meta: Meta<typeof IconButton> = {
  title: "Components/IconButton",
  component: IconButton,
  parameters: {
    layout: "centered",
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
    },
  },
  args: {
    onClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Variant stories ───

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

// ─── Sentiment stories ───

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

// ─── State stories ───

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

// ─── Showcase stories ───

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
