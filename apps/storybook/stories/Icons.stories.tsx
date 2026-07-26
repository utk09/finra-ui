import type { Meta, StoryObj } from "@storybook/react-vite";
import * as FinraIcons from "@utk09/finra-ui-icons/react";
import type { SVGProps } from "react";
import React from "react";

type IconComponent = (props: SVGProps<SVGSVGElement>) => React.JSX.Element;

interface IconsStoryArgs {
  size: number;
  strokeWidth: number;
}

const iconEntries = Object.entries(FinraIcons)
  .filter(([name, icon]) => name.endsWith("Icon") && typeof icon === "function")
  .sort(([a], [b]) => a.localeCompare(b)) as [string, IconComponent][];

const iconMap = new Map<string, IconComponent>(iconEntries);

// 8 Defined Icon Categories
const categories: Record<string, string[]> = {
  "1. Core Actions": [
    "CloseIcon",
    "CloseSmallIcon",
    "CopyIcon",
    "DashIcon",
    "DeleteIcon",
    "DownloadCloudIcon",
    "DownloadIcon",
    "EditIcon",
    "ExternalLinkIcon",
    "MinusIcon",
    "PauseIcon",
    "PlayIcon",
    "PlusIcon",
    "RefreshIcon",
    "SaveIcon",
    "ShareIcon",
    "SpinnerIcon",
    "StopIcon",
    "UploadCloudIcon",
    "UploadIcon",
  ],
  "2. Communication": ["BellIcon", "MailIcon", "MessageIcon", "SendIcon"],
  "3. Security / User": [
    "KeyIcon",
    "LockIcon",
    "ShieldIcon",
    "UnlockIcon",
    "UserIcon",
    "UsersIcon",
  ],
  "4. Status / Feedback": [
    "CheckIcon",
    "ErrorIcon",
    "HelpCircleIcon",
    "InfoIcon",
    "SuccessCircleIcon",
    "WarningIcon",
  ],
  "5. Navigation Essentials": [
    "ArrowDownIcon",
    "ArrowLeftIcon",
    "ArrowRightIcon",
    "ArrowUpIcon",
    "ChevronDownIcon",
    "ChevronLeftIcon",
    "ChevronRightIcon",
    "ChevronUpIcon",
    "HomeIcon",
    "MoreHorizontalIcon",
    "MoreVerticalIcon",
    "SettingsIcon",
  ],
  "6. Data, Forms, and Table UX": [
    "AlertTriangleIcon",
    "CalendarIcon",
    "CalendarRangeIcon",
    "CheckCircleIcon",
    "CheckSquareIcon",
    "CircleDotIcon",
    "ClockIcon",
    "ColumnsIcon",
    "EyeClosedIcon",
    "EyeIcon",
    "EyeOffIcon",
    "EyeOpenIcon",
    "FilterIcon",
    "FunnelOffIcon",
    "IndeterminateIcon",
    "MinusSquareIcon",
    "PinIcon",
    "SearchIcon",
    "SearchMinusIcon",
    "SearchPlusIcon",
    "SlidersIcon",
    "SortAscIcon",
    "SortDescIcon",
    "SortIcon",
    "XCircleIcon",
  ],
  "7. Finance-domain Pack": [
    "ActivityIcon",
    "AuditTrailIcon",
    "BankIcon",
    "BitcoinIcon",
    "CandlestickIcon",
    "ChartBarIcon",
    "ChartLineIcon",
    "ChartPieIcon",
    "ClipboardCheckIcon",
    "ClipboardXIcon",
    "CoinIcon",
    "CommoditiesIcon",
    "CreditCardIcon",
    "CreditIcon",
    "CryptoIcon",
    "DerivativesIcon",
    "DollarIcon",
    "EquitiesIcon",
    "EuroIcon",
    "FileCheckIcon",
    "FileWarningIcon",
    "FxIcon",
    "HistoryIcon",
    "PercentIcon",
    "PoundIcon",
    "RatesIcon",
    "ReceiptIcon",
    "ShieldAlertIcon",
    "ShieldCheckIcon",
    "StarIcon",
    "TargetIcon",
    "TimerIcon",
    "TrendingDownIcon",
    "TrendingUpIcon",
    "WalletIcon",
    "YenIcon",
  ],
  "8. Utility and Brand Completeness": [
    "CloudIcon",
    "CloudOffIcon",
    "DatabaseIcon",
    "DownloadFileIcon",
    "FileIcon",
    "FileTextIcon",
    "GridIcon",
    "ImageIcon",
    "ListIcon",
    "LogInIcon",
    "LogOutIcon",
    "MobileIcon",
    "MonitorIcon",
    "PanelLeftIcon",
    "PanelRightIcon",
    "PaperclipIcon",
    "PowerIcon",
    "PrinterIcon",
  ],
};

const meta: Meta<IconsStoryArgs> = {
  title: "Icons",
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: { type: "number", min: 12, max: 64, step: 2 },
    },
    strokeWidth: {
      control: { type: "number", min: 1, max: 3, step: 0.25 },
    },
  },
  args: {
    size: 24,
    strokeWidth: 1.5,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Render Helper for Icon Cards
function renderIconGrid(names: string[], size: number, strokeWidth: number) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: "0.75rem",
      }}>
      {names.map((name) => {
        const Icon = iconMap.get(name);
        if (!Icon) return null;

        return (
          <div
            key={name}
            style={{
              border: "1px solid #E2E8F0",
              borderRadius: "0.5rem",
              padding: "0.75rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem",
              textAlign: "center",
              background: "#FFFFFF",
            }}>
            <Icon width={size} height={size} strokeWidth={strokeWidth} aria-hidden="true" />
            <span style={{ fontSize: "0.75rem", lineHeight: 1.3 }}>{name}</span>
          </div>
        );
      })}
    </div>
  );
}

export const AllIcons: Story = {
  render: ({ size, strokeWidth }) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: "0.75rem",
      }}>
      {iconEntries.map(([name, Icon]) => (
        <div
          key={name}
          style={{
            border: "1px solid #E2E8F0",
            borderRadius: "0.5rem",
            padding: "0.75rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
            textAlign: "center",
            background: "#FFFFFF",
          }}>
          <Icon width={size} height={size} strokeWidth={strokeWidth} aria-hidden="true" />
          <span style={{ fontSize: "0.75rem", lineHeight: 1.3 }}>{name}</span>
        </div>
      ))}
    </div>
  ),
};

export const CategoryIcons: Story = {
  render: ({ size, strokeWidth }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {Object.entries(categories).map(([categoryName, iconNames]) => (
        <section key={categoryName}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
              borderBottom: "2px solid #E2E8F0",
              paddingBottom: "0.5rem",
            }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, color: "#0F172A" }}>
              {categoryName}
            </h3>
            <span
              style={{
                fontSize: "0.75rem",
                background: "#F1F5F9",
                color: "#475569",
                padding: "0.15rem 0.5rem",
                borderRadius: "1rem",
                fontWeight: 500,
              }}>
              {iconNames.length}
            </span>
          </div>
          {renderIconGrid(iconNames, size, strokeWidth)}
        </section>
      ))}
    </div>
  ),
};
