import { useState, useCallback } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ComboBox, type ComboBoxOption } from "@utk09/finra-ui";
import { fn, expect, userEvent, within } from "storybook/test";

const fruitOptions: ComboBoxOption[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "date", label: "Date" },
  { value: "elderberry", label: "Elderberry" },
  { value: "fig", label: "Fig" },
  { value: "grape", label: "Grape" },
  { value: "honeydew", label: "Honeydew" },
];

const currencyOptions: ComboBoxOption[] = [
  { value: "USDKRW", label: "USDKRW", group: "Major", favourite: true },
  { value: "EURUSD", label: "EURUSD", group: "Major", favourite: true },
  { value: "GBPUSD", label: "GBPUSD", group: "Major" },
  { value: "USDJPY", label: "USDJPY", group: "Major" },
  { value: "AUDUSD", label: "AUDUSD", group: "Minor" },
  { value: "NZDUSD", label: "NZDUSD", group: "Minor" },
  { value: "USDSGD", label: "USDSGD", group: "Minor" },
  { value: "USDCNH", label: "USDCNH", group: "Exotic" },
  { value: "USDINR", label: "USDINR", group: "Exotic" },
  { value: "USDMXN", label: "USDMXN", group: "Exotic" },
];

const meta: Meta<typeof ComboBox> = {
  title: "Components/ComboBox",
  component: ComboBox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    disabled: { control: "boolean" },
    loading: { control: "boolean" },
    multiple: { control: "boolean" },
    creatable: { control: "boolean" },
    fullWidth: { control: "boolean" },
  },
  args: {
    onChange: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ minInlineSize: 350 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Basic ───

export const Default: Story = {
  args: {
    options: fruitOptions,
    value: null,
    placeholder: "Select a fruit...",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("searchbox");
    await expect(input).toBeVisible();
    await userEvent.click(input);
    await expect(canvas.getByRole("listbox")).toBeVisible();
  },
};

export const WithValue: Story = {
  args: {
    options: fruitOptions,
    value: "cherry",
    placeholder: "Select a fruit...",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("searchbox");
    await expect(input).toHaveValue("Cherry");
  },
};

export const Disabled: Story = {
  args: {
    options: fruitOptions,
    value: "banana",
    placeholder: "Select a fruit...",
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("searchbox")).toBeDisabled();
  },
};

// ─── Typeahead ───

export const Typeahead: Story = {
  name: "Typeahead / Filtering",
  render: () => {
    const [value, setValue] = useState<string | null>(null);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <ComboBox
          options={fruitOptions}
          value={value}
          onChange={(v) => setValue(v as string)}
          placeholder="Start typing to filter..."
        />
        <p style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}>
          Selected: {value ?? "none"}
        </p>
      </div>
    );
  },
};

// ─── Multi-select ───

export const MultiSelect: Story = {
  render: () => {
    const [values, setValues] = useState<string[]>(["apple", "cherry"]);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <ComboBox
          options={fruitOptions}
          value={values}
          onChange={(v) => setValues(v as string[])}
          multiple
          placeholder="Pick fruits..."
        />
        <p style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}>
          Selected: {values.join(", ") || "none"}
        </p>
      </div>
    );
  },
};

// ─── Groups & Favourites ───

export const GroupsAndFavourites: Story = {
  name: "Groups & Favourites",
  render: () => {
    const [value, setValue] = useState<string | null>(null);

    return (
      <ComboBox
        options={currencyOptions}
        value={value}
        onChange={(v) => setValue(v as string)}
        placeholder="Select currency pair..."
      />
    );
  },
};

// ─── Creatable ───

export const Creatable: Story = {
  render: () => {
    const [options, setOptions] = useState(fruitOptions);
    const [value, setValue] = useState<string | null>(null);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <ComboBox
          options={options}
          value={value}
          onChange={(v) => setValue(v as string)}
          creatable
          onCreateOption={(label) => {
            const newOpt = { value: label.toLowerCase(), label };
            setOptions((prev) => [...prev, newOpt]);
            setValue(newOpt.value);
          }}
          placeholder="Select or create..."
        />
        <p style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}>
          Selected: {value ?? "none"} | Options: {options.length}
        </p>
      </div>
    );
  },
};

// ─── Loading / Async ───

export const Loading: Story = {
  args: {
    options: [],
    value: null,
    loading: true,
    placeholder: "Loading options...",
  },
};

export const AsyncSearch: Story = {
  render: () => {
    const [options, setOptions] = useState<ComboBoxOption[]>([]);
    const [value, setValue] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLoadOptions = useCallback((input: string) => {
      if (!input) {
        setOptions([]);
        return;
      }
      setLoading(true);
      setError(null);
      // Simulate async fetch
      setTimeout(() => {
        const results = currencyOptions.filter((o) =>
          o.label.toLowerCase().includes(input.toLowerCase()),
        );
        if (results.length === 0) {
          setError(`No currencies matching "${input}"`);
        }
        setOptions(results);
        setLoading(false);
      }, 600);
    }, []);

    return (
      <ComboBox
        options={options}
        value={value}
        onChange={(v) => setValue(v as string)}
        onLoadOptions={handleLoadOptions}
        loading={loading}
        placeholder="Search currencies..."
        noOptionsMessage="Type to search currencies"
        footer={
          error ? (
            <span style={{ color: "var(--color-danger-500)", fontSize: "0.75rem" }}>{error}</span>
          ) : undefined
        }
      />
    );
  },
};

// ─── Header & Footer ───

export const HeaderAndFooter: Story = {
  name: "Header & Footer",
  render: () => {
    const [value, setValue] = useState<string | null>(null);

    return (
      <ComboBox
        options={fruitOptions}
        value={value}
        onChange={(v) => setValue(v as string)}
        placeholder="Select a fruit..."
        header={
          <span style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}>
            {fruitOptions.length} options available
          </span>
        }
        footer={
          <span style={{ fontSize: "0.75rem", color: "var(--color-neutral-400)" }}>
            Use arrow keys to navigate
          </span>
        }
      />
    );
  },
};

// ─── Currency Selection (full example) ───

export const CurrencySelection: Story = {
  name: "Currency Selection (Full Example)",
  render: () => {
    const allCurrencies = currencyOptions;
    const [options, setOptions] = useState(allCurrencies);
    const [value, setValue] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLoadOptions = useCallback(
      (input: string) => {
        if (!input) {
          setOptions(allCurrencies);
          setError(null);
          return;
        }
        setLoading(true);
        setError(null);
        // Simulate async currency search
        setTimeout(() => {
          const results = allCurrencies.filter((o) =>
            o.label.toLowerCase().includes(input.toLowerCase()),
          );
          if (results.length === 0) {
            setError(`No currencies matching "${input}"`);
          }
          setOptions(results);
          setLoading(false);
        }, 400);
      },
      [allCurrencies],
    );

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <ComboBox
          options={options}
          value={value}
          onChange={(v) => setValue(v as string)}
          onLoadOptions={handleLoadOptions}
          loading={loading}
          placeholder="Search currency pairs (e.g. USDK)..."
          noOptionsMessage="Type to search currencies"
          header={
            <span style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}>
              {options.length} currencies available
            </span>
          }
          footer={
            error ? (
              <span style={{ color: "var(--color-danger-500)", fontSize: "0.75rem" }}>{error}</span>
            ) : (
              <span style={{ fontSize: "0.75rem", color: "var(--color-neutral-400)" }}>
                Favourites shown first
              </span>
            )
          }
        />
        <p style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}>
          Selected: {value ?? "none"}
        </p>
      </div>
    );
  },
};

// ─── Custom Create Label ───

export const CustomCreateLabel: Story = {
  render: () => {
    const [options, setOptions] = useState(fruitOptions);
    const [value, setValue] = useState<string | null>(null);

    return (
      <ComboBox
        options={options}
        value={value}
        onChange={(v) => setValue(v as string)}
        creatable
        formatCreateLabel={(val) => `+ Add "${val}" as new fruit`}
        onCreateOption={(label) => {
          const newOpt = { value: label.toLowerCase(), label };
          setOptions((prev) => [...prev, newOpt]);
          setValue(newOpt.value);
        }}
        placeholder="Select or create a fruit..."
      />
    );
  },
};

// ─── FullWidth ───

export const FullWidth: Story = {
  decorators: [
    (Story) => (
      <div style={{ minInlineSize: 500 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    options: fruitOptions,
    value: null,
    placeholder: "Full width ComboBox...",
    fullWidth: true,
  },
};

// ─── Showcase ───

export const AllStates: Story = {
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div style={{ minInlineSize: 400 }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <p style={{ fontSize: "0.75rem", marginBlockEnd: "0.25rem" }}>Default (single)</p>
        <ComboBox options={fruitOptions} value={null} placeholder="Select a fruit..." />
      </div>
      <div>
        <p style={{ fontSize: "0.75rem", marginBlockEnd: "0.25rem" }}>With selected value</p>
        <ComboBox options={fruitOptions} value="banana" placeholder="Select a fruit..." />
      </div>
      <div>
        <p style={{ fontSize: "0.75rem", marginBlockEnd: "0.25rem" }}>Multi-select with pills</p>
        <ComboBox
          options={fruitOptions}
          value={["apple", "cherry", "grape"]}
          multiple
          placeholder="Pick fruits..."
        />
      </div>
      <div>
        <p style={{ fontSize: "0.75rem", marginBlockEnd: "0.25rem" }}>Disabled</p>
        <ComboBox options={fruitOptions} value="banana" disabled placeholder="Select a fruit..." />
      </div>
      <div>
        <p style={{ fontSize: "0.75rem", marginBlockEnd: "0.25rem" }}>Loading</p>
        <ComboBox options={[]} value={null} loading placeholder="Loading..." />
      </div>
    </div>
  ),
};
