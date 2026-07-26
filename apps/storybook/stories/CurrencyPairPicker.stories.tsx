import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  type CurrencyPair,
  CurrencyPairPicker,
  DateTenorPicker,
  type InstrumentProvider,
  PriceInput,
} from "@utk09/finra-ui-finance";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

/**
 * A small book covering every axis the model has to carry: deliverable G10,
 * a non-deliverable that needs a tenor, a metal, a crypto pair whose codes are
 * not ISO alpha-3, a synthetic built from legs, and a restricted pair.
 */
const pairs: CurrencyPair[] = [
  {
    id: "EURUSD",
    baseCurrency: "EUR",
    quoteCurrency: "USD",
    displayName: "Euro / US Dollar",
    aliases: ["Fiber"],
    assetClass: "G10",
    settlementStyle: "Deliverable",
    pricing: { primaryPrecision: 4, precisionDigits: 1, tickSize: 0.00005 },
  },
  {
    id: "GBPUSD",
    baseCurrency: "GBP",
    quoteCurrency: "USD",
    displayName: "Sterling / US Dollar",
    aliases: ["Cable"],
    assetClass: "G10",
    settlementStyle: "Deliverable",
    pricing: { primaryPrecision: 4, precisionDigits: 1, tickSize: 0.00005 },
  },
  {
    id: "USDJPY",
    baseCurrency: "USD",
    quoteCurrency: "JPY",
    displayName: "US Dollar / Japanese Yen",
    assetClass: "G10",
    settlementStyle: "Deliverable",
    pricing: { primaryPrecision: 2, precisionDigits: 1, tickSize: 0.005 },
  },
  {
    id: "USDKRW",
    baseCurrency: "USD",
    quoteCurrency: "KRW",
    displayName: "US Dollar / Korean Won",
    assetClass: "EM",
    settlementStyle: "NDF",
    // Carried, never enforced: the picker will happily emit this with no tenor.
    requiresTenor: true,
    settlementCurrency: "USD",
    fixing: { source: "EMTA", time: "15:30 Seoul" },
    pricing: { primaryPrecision: 2, tickSize: 0.01 },
  },
  {
    id: "XAUUSD",
    baseCurrency: "XAU",
    quoteCurrency: "USD",
    displayName: "Gold / US Dollar",
    assetClass: "Metal",
    quotationUnit: "per troy ounce",
    pricing: { primaryPrecision: 2, tickSize: 0.01 },
  },
  {
    id: "BTCUSDT",
    baseCurrency: "BTC",
    quoteCurrency: "USDT",
    displayName: "Bitcoin / Tether",
    assetClass: "Crypto",
    pricing: { primaryPrecision: 2, tickSize: 0.5 },
  },
  {
    id: "EURJPY",
    baseCurrency: "EUR",
    quoteCurrency: "JPY",
    displayName: "Euro / Japanese Yen",
    assetClass: "G10",
    settlementStyle: "Synthetic",
    legs: [{ pairId: "EURUSD" }, { pairId: "USDJPY" }],
    pricing: { primaryPrecision: 2, precisionDigits: 1, tickSize: 0.005 },
  },
  {
    id: "USDRUB",
    baseCurrency: "USD",
    quoteCurrency: "RUB",
    displayName: "US Dollar / Russian Rouble",
    assetClass: "EM",
    tradable: false,
    restrictionReason: "Sanctioned - not tradable",
  },
];

const meta: Meta<typeof CurrencyPairPicker> = {
  title: "Finance/CurrencyPairPicker",
  component: CurrencyPairPicker,
  parameters: {
    layout: "centered",
  },
  // The favourite star is decorative (click it, or Ctrl+D), so options contain
  // no nested interactive controls and the a11y gate applies.
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary"],
      table: { defaultValue: { summary: "primary" } },
    },
    validationStatus: {
      control: "select",
      options: [undefined, "error", "warning", "success"],
    },
    displaySeparator: { control: "text", table: { defaultValue: { summary: "/" } } },
    showFavourites: { control: "boolean", table: { defaultValue: { summary: "true" } } },
    showRecents: { control: "boolean", table: { defaultValue: { summary: "true" } } },
    maxRecents: { control: "number", table: { defaultValue: { summary: "5" } } },
    fullWidth: { control: "boolean", table: { defaultValue: { summary: "false" } } },
    disabled: { control: "boolean", table: { defaultValue: { summary: "false" } } },
  },
  args: {
    "aria-label": "Currency pair",
    pairs,
    onChange: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ minInlineSize: 320 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Badges derive from the model - settlement style, asset class, tradability. */
export const Default: Story = {};

/** A committed pair renders canonically, whatever separator was typed. */
export const WithValue: Story = {
  args: { value: "GBPUSD" },
};

/**
 * Every spelling of the same pair resolves to one canonical identity:
 * `GBPUSD`, `GBP/USD`, `GBP\USD`, `GBP,USD`, `GBP USD`. Display formatting is a
 * separate, render-time concern.
 */
export const FlexibleInput: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Currency pair" });
    await userEvent.type(input, "gbp usd");
    await userEvent.keyboard("{Enter}");
    await expect(input).toHaveValue("GBP/USD");
  },
};

/** Search by code, by either leg, by alias (`Cable`), or by currency name. */
export const SearchByAlias: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("combobox", { name: "Currency pair" }), "cable");
    // Portalled, so it is not inside the story canvas.
    const listbox = await within(document.body).findByRole("listbox");
    await expect(within(listbox).getAllByRole("option")).toHaveLength(1);
  },
};

/** Favourites pin to the top; toggle with the star or `Ctrl+D`. */
export const Favourites: Story = {
  render: (args) => {
    const [favourites, setFavourites] = useState<string[]>(["GBPUSD", "USDJPY"]);
    return (
      <CurrencyPairPicker
        {...args}
        favourites={favourites}
        onFavouriteChange={(_id, _active, next) => setFavourites(next)}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("combobox", { name: "Currency pair" }));
    const body = within(document.body);
    await expect(await body.findByRole("group", { name: "Favourites" })).toBeInTheDocument();
  },
};

/**
 * Recents are proposed, not stored: the component reports the new list and the
 * consumer decides whether a selection counts.
 */
export const Recents: Story = {
  render: (args) => {
    const [recents, setRecents] = useState<string[]>(["USDJPY", "XAUUSD"]);
    return <CurrencyPairPicker {...args} recents={recents} onRecentsChange={setRecents} />;
  },
};

/** A restricted pair renders disabled, with its reason on the accessible name. */
export const RestrictedPair: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("combobox", { name: "Currency pair" }));
    const option = await within(document.body).findByRole("option", { name: /USD\/RUB/ });
    await expect(option).toHaveAttribute("aria-disabled", "true");
  },
};

/**
 * **One currency pair, several tradable instruments.**
 *
 * USDINR trades both onshore (deliverable, RBI reference rate) and as an NDF
 * (cash-settled in USD, tenor required). Same base and quote, different fixing,
 * settlement and price - so they are two instruments, and `id` is the
 * *instrument* key. Give each its own; `baseCurrency + quoteCurrency` names only
 * the pair.
 *
 * Typing `USDINR` therefore names two things. Rather than pick one, the picker
 * reports `ambiguous` and leaves the list open and filtered, so the two rows are
 * the choice. Selecting a row is unambiguous and commits normally.
 */
export const OnePairSeveralInstruments: Story = {
  args: {
    pairs: [
      {
        id: "USDINR.ONSHORE",
        baseCurrency: "USD",
        quoteCurrency: "INR",
        displayName: "US Dollar / Indian Rupee - onshore",
        assetClass: "EM",
        settlementStyle: "Deliverable",
        fixing: { source: "RBI", time: "13:30 Mumbai" },
        pricing: { primaryPrecision: 4, tickSize: 0.0025 },
      },
      {
        id: "USDINR.NDF",
        baseCurrency: "USD",
        quoteCurrency: "INR",
        displayName: "US Dollar / Indian Rupee - NDF",
        assetClass: "EM",
        settlementStyle: "NDF",
        requiresTenor: true,
        settlementCurrency: "USD",
        fixing: { source: "EMTA", time: "12:30 Mumbai" },
        pricing: { primaryPrecision: 4, tickSize: 0.0025 },
      },
    ],
  },
  render: (args) => {
    const [status, setStatus] = useState<string>("");
    return (
      <div style={{ display: "grid", gap: "0.5rem" }}>
        <CurrencyPairPicker
          {...args}
          onChange={(pair) => setStatus(pair ? `Selected ${pair.id}` : "")}
          onInvalid={(reason) =>
            setStatus(
              reason === "ambiguous"
                ? "USDINR names two instruments - pick one from the list."
                : `Rejected: ${reason}`,
            )
          }
        />
        {/*
          Deliberately not a live region: the picker already owns one for its
          result count, and two competing regions in one control announce over
          each other.
        */}
        <p style={{ margin: 0, minBlockSize: "1.5em" }}>{status}</p>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Currency pair" });

    // The shared symbol matches both instruments.
    await userEvent.type(input, "usdinr");
    const body = within(document.body);
    await expect(within(await body.findByRole("listbox")).getAllByRole("option")).toHaveLength(2);

    // Committing it would be a guess, so it is refused - and the list stays up.
    await userEvent.keyboard("{Enter}");
    await expect(await canvas.findByText(/names two instruments/)).toBeInTheDocument();
    await expect(input).toHaveAttribute("aria-expanded", "true");

    // Picking a row is unambiguous.
    await userEvent.click(await body.findByRole("option", { name: /NDF/ }));
    await expect(await canvas.findByText("Selected USDINR.NDF")).toBeInTheDocument();
  },
};

/** Badge derivation is replaceable - here, only what the desk cares about. */
export const CustomBadges: Story = {
  args: {
    getBadges: (pair) => {
      const badges: string[] = [];
      if (pair.requiresTenor) badges.push("Tenor required");
      if (pair.legs?.length) badges.push(`${pair.legs.length} legs`);
      if (pair.quotationUnit) badges.push(pair.quotationUnit);
      return badges;
    },
  },
};

/** No separator on display - the trader's own shorthand. */
export const NoSeparator: Story = {
  args: { displaySeparator: "", value: "EURUSD" },
};

/**
 * Backed by a provider instead of a static list: debounced, with loading, empty
 * and error states, and a stale-response guard so a slow answer to an old query
 * can never overwrite a newer one.
 */
export const AsyncProvider: Story = {
  render: (args) => {
    const provider: InstrumentProvider<CurrencyPair> = {
      search: (query) =>
        new Promise((resolve) => {
          setTimeout(() => {
            const needle = query
              .trim()
              .toUpperCase()
              .replace(/[^A-Z0-9]/g, "");
            resolve(
              needle
                ? pairs.filter(
                    (p) =>
                      p.id.includes(needle) ||
                      (p.displayName ?? "").toUpperCase().includes(query.trim().toUpperCase()),
                  )
                : pairs.slice(0, 4),
            );
          }, 400);
        }),
      getById: (id) => Promise.resolve(pairs.find((p) => p.id === id) ?? null),
      getFavourites: () => Promise.resolve([pairs[1]]),
    };
    return <CurrencyPairPicker {...args} pairs={undefined} provider={provider} debounceMs={250} />;
  },
};

/**
 * **Composition - the part the picker deliberately does not do for you.**
 *
 * Selecting an NDF emits `requiresTenor: true` and a `pricing` block. Neither is
 * enforced here: refusing to encode "an NDF must have a tenor" is the point,
 * because that is desk workflow, not component behaviour. Honouring it is three
 * lines in the consumer - shown below, so the obligation is documented rather
 * than left implicit.
 *
 * Pick `USD/KRW` to see the tenor field appear and the price field re-precision.
 */
export const ComposedTicket: Story = {
  parameters: { layout: "padded" },
  render: (args) => {
    const [pair, setPair] = useState<CurrencyPair | null>(null);

    return (
      <div style={{ display: "grid", gap: "1rem", maxInlineSize: 420 }}>
        <CurrencyPairPicker {...args} onChange={setPair} />

        {/* The picker carries `requiresTenor`; the ticket is what acts on it. */}
        {pair?.requiresTenor ? (
          <DateTenorPicker aria-label="Fixing date" showResolvedDate showModeIndicator />
        ) : null}

        {/* `pricing` is a PriceInstrument, so it drops straight into PriceInput. */}
        {pair ? <PriceInput aria-label="Rate" instrument={pair.pricing} digitHierarchy /> : null}

        {pair ? (
          <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.25rem 1rem" }}>
            <dt>Canonical id</dt>
            <dd>{pair.id}</dd>
            {pair.settlementCurrency ? (
              <>
                <dt>Settles in</dt>
                <dd>{pair.settlementCurrency}</dd>
              </>
            ) : null}
            {pair.fixing?.source ? (
              <>
                <dt>Fixing</dt>
                <dd>
                  {pair.fixing.source} {pair.fixing.time}
                </dd>
              </>
            ) : null}
            {pair.legs?.length ? (
              <>
                <dt>Legs</dt>
                <dd>{pair.legs.map((leg) => leg.pairId).join(" × ")}</dd>
              </>
            ) : null}
          </dl>
        ) : null}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Currency pair" });

    await userEvent.type(input, "usdkrw");
    await userEvent.keyboard("{Enter}");

    // The NDF asks for a tenor; a deliverable pair would not.
    await waitFor(async () => {
      await expect(canvas.getByRole("combobox", { name: "Fixing date" })).toBeInTheDocument();
    });
    await expect(canvas.getByRole("spinbutton", { name: "Rate" })).toBeInTheDocument();
  },
};
