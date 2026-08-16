import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge, Input } from "@utk09/finra-ui";
import * as FinraIcons from "@utk09/finra-ui-icons/react";
import type React from "react";
import { type SVGProps, useMemo, useState } from "react";

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
  "2. Communication": [
    "BellIcon",
    "MailIcon",
    "MessageIcon",
    "SendIcon",
    "VolumeIcon",
    "VolumeOffIcon",
  ],
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
    docs: {
      description: {
        component: [
          "129 icons, shipped two ways from one source.",
          "",
          "`@utk09/finra-ui-icons` exports each icon as **plain data** - a name, a viewBox and a path list - with no framework attached. `@utk09/finra-ui-icons/react` exports the same set as React components. The data entry is what makes a future Web Component or server-rendered build possible without redrawing anything.",
          "",
          "```tsx",
          'import { SearchIcon, TrendingUpIcon } from "@utk09/finra-ui-icons/react";',
          "",
          "<Button startIcon={<SearchIcon />}>Search</Button>;",
          "```",
          "",
          "Every icon takes the full `SVGProps<SVGSVGElement>` surface, so `width`, `height`, `strokeWidth`, `className` and the rest pass straight through. Colour is **not** a prop: icons paint with `currentColor` and inherit from their container, which is what lets one icon work in a primary button, a danger badge and a dark-mode menu without variants.",
          "",
          "Icons are decorative by default. Pair one with a visible label, or give the *control* an `aria-label`. `IconButton` requires one.",
        ].join("\n"),
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: { type: "number", min: 12, max: 64, step: 2 },
      description: "Rendered width and height in px. Maps to the SVG `width`/`height` attributes.",
      table: { category: "Gallery controls", defaultValue: { summary: "24" } },
    },
    strokeWidth: {
      control: { type: "number", min: 1, max: 3, step: 0.25 },
      description:
        "Stroke weight. The set is drawn on a 24px grid at 1.5, so other sizes may want a nudge.",
      table: { category: "Gallery controls", defaultValue: { summary: "1.5" } },
    },
  },
  args: {
    size: 24,
    strokeWidth: 1.5,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * One icon tile.
 *
 * A real `<button>` rather than a styled div: the tile is clickable (it copies
 * the JSX import) so it has to be reachable by keyboard and announced as an
 * action. Colours come from tokens only - an earlier version hardcoded a white
 * background against `currentColor` icons, which rendered the entire gallery
 * white-on-white in dark mode.
 */
function IconTile({
  name,
  size,
  strokeWidth,
}: {
  name: string;
  size: number;
  strokeWidth: number;
}) {
  const [copied, setCopied] = useState(false);
  const Icon = iconMap.get(name);
  if (!Icon) return null;

  const copy = () => {
    void navigator.clipboard?.writeText(`<${name} />`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy <${name} />`}
      style={{
        border: "1px solid var(--finra-container-border)",
        borderRadius: "0.5rem",
        padding: "0.75rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.5rem",
        textAlign: "center",
        background: "var(--finra-container-background)",
        color: "var(--finra-container-foreground)",
        font: "inherit",
        cursor: "pointer",
      }}>
      <Icon width={size} height={size} strokeWidth={strokeWidth} aria-hidden="true" />
      <span style={{ fontSize: "0.75rem", lineHeight: 1.3, wordBreak: "break-word" }}>
        {copied ? "Copied" : name}
      </span>
    </button>
  );
}

function IconGrid({
  names,
  size,
  strokeWidth,
}: {
  names: string[];
  size: number;
  strokeWidth: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: "0.75rem",
      }}>
      {names.map((name) => (
        <IconTile key={name} name={name} size={size} strokeWidth={strokeWidth} />
      ))}
    </div>
  );
}

function SearchableGallery({ size, strokeWidth }: IconsStoryArgs) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return iconEntries.map(([name]) => name);
    return iconEntries.filter(([name]) => name.toLowerCase().includes(q)).map(([name]) => name);
  }, [query]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <Input
          aria-label="Filter icons by name"
          placeholder="Filter icons, e.g. chart"
          value={query}
          clearable
          onClear={() => setQuery("")}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Badge variant="secondary">
          {matches.length} of {iconEntries.length}
        </Badge>
      </div>
      {matches.length > 0 ? (
        <IconGrid names={matches} size={size} strokeWidth={strokeWidth} />
      ) : (
        <p style={{ color: "var(--finra-container-foreground)" }}>
          No icon name contains "{query}".
        </p>
      )}
    </div>
  );
}

export const AllIcons: Story = {
  name: "All icons",
  parameters: {
    docs: {
      description: {
        story:
          "The complete set, alphabetically. Filter by name, and click any tile to copy its JSX to the clipboard. Use the `size` and `strokeWidth` controls to check a weight before committing to it.",
      },
    },
  },
  render: ({ size, strokeWidth }) => <SearchableGallery size={size} strokeWidth={strokeWidth} />,
};

export const CategoryIcons: Story = {
  name: "By category",
  parameters: {
    docs: {
      description: {
        story:
          "The same 129 icons grouped by what they are for. Useful when you know the job but not the name. Every icon appears in exactly one group, so the counts sum to the full set.",
      },
    },
  },
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
              borderBottom: "2px solid var(--finra-container-border)",
              paddingBottom: "0.5rem",
            }}>
            <h3
              style={{
                margin: 0,
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "var(--finra-container-foreground)",
              }}>
              {categoryName}
            </h3>
            <Badge variant="secondary">{iconNames.length}</Badge>
          </div>
          <IconGrid names={iconNames} size={size} strokeWidth={strokeWidth} />
        </section>
      ))}
    </div>
  ),
};
