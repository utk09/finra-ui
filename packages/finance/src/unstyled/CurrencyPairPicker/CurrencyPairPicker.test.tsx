import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import type { InstrumentProvider } from "../../logic/instrumentSearch";
import {
  type CurrencyPair,
  CurrencyPairPickerBase,
  type CurrencyPairPickerHandle,
} from "./CurrencyPairPicker";

const GBPUSD: CurrencyPair = {
  id: "GBPUSD",
  baseCurrency: "GBP",
  quoteCurrency: "USD",
  displayName: "Sterling / Dollar",
  assetClass: "G10",
  settlementStyle: "Deliverable",
  pricing: { primaryPrecision: 4, precisionDigits: 1, tickSize: 0.00005 },
};

const EURUSD: CurrencyPair = {
  id: "EURUSD",
  baseCurrency: "EUR",
  quoteCurrency: "USD",
  displayName: "Euro / Dollar",
  assetClass: "G10",
};

const USDKRW: CurrencyPair = {
  id: "USDKRW",
  baseCurrency: "USD",
  quoteCurrency: "KRW",
  displayName: "Dollar / Won",
  settlementStyle: "NDF",
  requiresTenor: true,
  settlementCurrency: "USD",
  fixing: { source: "EMTA", time: "15:30 Seoul" },
};

const RUBUSD: CurrencyPair = {
  id: "RUBUSD",
  baseCurrency: "RUB",
  quoteCurrency: "USD",
  tradable: false,
  restrictionReason: "Sanctioned",
};

const PAIRS = [GBPUSD, EURUSD, USDKRW, RUBUSD];

function setup(props: Partial<React.ComponentProps<typeof CurrencyPairPickerBase>> = {}) {
  const onChange = vi.fn();
  const utils = render(
    <CurrencyPairPickerBase aria-label="Pair" pairs={PAIRS} onChange={onChange} {...props} />,
  );
  const input = screen.getByRole("combobox", { name: "Pair" });
  return { onChange, input, user: userEvent.setup(), ...utils };
}

/** Options in render order - the same order the roving highlight walks. */
const optionNames = (): string[] =>
  screen.getAllByRole("option").map((el) => el.getAttribute("aria-label") ?? "");

describe("CurrencyPairPickerBase - structure", () => {
  it("puts role=combobox on the input, not a wrapper", () => {
    const { input } = setup();
    expect(input.tagName).toBe("INPUT");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).toHaveAttribute("aria-haspopup", "listbox");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("opens on click and lists every pair", async () => {
    const { input, user } = setup();
    await user.click(input);

    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(4);
  });

  it("wires aria-controls to the listbox only while open", async () => {
    const { input, user } = setup();
    expect(input).not.toHaveAttribute("aria-controls");

    await user.click(input);
    const listbox = screen.getByRole("listbox");
    expect(input.getAttribute("aria-controls")).toBe(listbox.id);
  });

  it("has no interactive descendant inside an option", async () => {
    const { input, user } = setup({ renderFavourite: (on) => (on ? "★" : "☆") });
    await user.click(input);

    for (const option of screen.getAllByRole("option")) {
      // axe `nested-interactive`: a role="option" may own no interactive
      // descendant, which is why the star is a decorative span.
      expect(within(option).queryByRole("button")).not.toBeInTheDocument();
      expect(within(option).queryByRole("link")).not.toBeInTheDocument();
      expect(within(option).queryByRole("checkbox")).not.toBeInTheDocument();
      expect(within(option).queryByRole("textbox")).not.toBeInTheDocument();
    }
  });

  it("announces the result count in a live region", async () => {
    const { input, user } = setup();
    await user.click(input);
    expect(screen.getByRole("status")).toHaveTextContent("4 pairs available");
  });
});

describe("CurrencyPairPickerBase - value", () => {
  it("emits the whole pair, not just the id", async () => {
    const { input, user, onChange } = setup();
    await user.click(input);
    await user.click(screen.getByRole("option", { name: /GBP\/USD/ }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const emitted = onChange.mock.calls[0][0] as CurrencyPair;
    // The carried metadata is the point: it seeds PriceInput downstream.
    expect(emitted.id).toBe("GBPUSD");
    expect(emitted.pricing).toEqual({
      primaryPrecision: 4,
      precisionDigits: 1,
      tickSize: 0.00005,
    });
  });

  it("accepts a controlled id and renders it as a formatted pair", () => {
    setup({ value: "USDKRW" });
    expect(screen.getByRole("combobox")).toHaveValue("USD/KRW");
  });

  it("honours displaySeparator", () => {
    setup({ value: "GBPUSD", displaySeparator: "" });
    expect(screen.getByRole("combobox")).toHaveValue("GBPUSD");
  });

  it("does not move a controlled value on its own", async () => {
    const { input, user, onChange } = setup({ value: "EURUSD" });
    await user.click(input);
    await user.click(screen.getByRole("option", { name: /GBP\/USD/ }));

    // The selection is reported, but a controlled consumer decides whether it
    // sticks - they may reject it. Showing GBP/USD while `value` still says
    // EURUSD is the exact failure controlled components exist to prevent.
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: "GBPUSD" }));
    expect(input).toHaveValue("EUR/USD");
  });

  it("follows a controlled value the consumer does accept", async () => {
    const { rerender } = render(
      <CurrencyPairPickerBase aria-label="Pair" pairs={PAIRS} value="EURUSD" />,
    );
    const user = userEvent.setup();
    const input = screen.getByRole("combobox", { name: "Pair" });

    await user.click(input);
    await user.click(screen.getByRole("option", { name: /GBP\/USD/ }));
    rerender(<CurrencyPairPickerBase aria-label="Pair" pairs={PAIRS} value="GBPUSD" />);

    expect(input).toHaveValue("GBP/USD");
  });

  it("reverts typed text when a controlled consumer ignores the commit", async () => {
    const { input, user } = setup({ value: "EURUSD" });

    await user.clear(input);
    await user.type(input, "GBP/USD");
    await user.keyboard("{Enter}");

    expect(input).toHaveValue("EUR/USD");
  });

  it("clears to null", async () => {
    const ref = createRef<CurrencyPairPickerHandle>();
    const onChange = vi.fn();
    render(
      <CurrencyPairPickerBase
        ref={ref}
        aria-label="Pair"
        pairs={PAIRS}
        defaultValue="GBPUSD"
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("combobox")).toHaveValue("GBP/USD");

    act(() => ref.current?.clear());
    expect(onChange).toHaveBeenCalledWith(null);
    expect(screen.getByRole("combobox")).toHaveValue("");
  });
});

describe("CurrencyPairPickerBase - typed input", () => {
  it("accepts any separator spelling of the same pair", async () => {
    for (const typed of ["GBPUSD", "GBP/USD", "gbp usd", "GBP,USD"]) {
      const onChange = vi.fn();
      const { unmount } = render(
        <CurrencyPairPickerBase aria-label="Pair" pairs={PAIRS} onChange={onChange} />,
      );
      const user = userEvent.setup();
      const input = screen.getByRole("combobox", { name: "Pair" });

      await user.click(input);
      await user.type(input, typed);
      await user.keyboard("{Enter}");

      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: "GBPUSD" }));
      unmount();
    }
  });

  it("filters as the user types", async () => {
    const { input, user } = setup();
    await user.click(input);
    await user.type(input, "eur");

    const names = optionNames();
    expect(names).toHaveLength(1);
    expect(names[0]).toContain("EUR/USD");
  });

  it("reports a well-formed but unknown pair through onCommitUnknown", async () => {
    const onCommitUnknown = vi.fn();
    const { input, user, onChange } = setup({ onCommitUnknown });

    await user.click(input);
    await user.type(input, "GBP/JPY");
    await user.keyboard("{Enter}");

    expect(onCommitUnknown).toHaveBeenCalledWith({ baseCurrency: "GBP", quoteCurrency: "JPY" });
    // Never surfaced as a metadata-less pair on the main callback.
    expect(onChange).not.toHaveBeenCalled();
  });

  it("rejects an unknown pair when the consumer has not opted in", async () => {
    const onInvalid = vi.fn();
    const { input, user, onChange } = setup({ onInvalid, defaultValue: "GBPUSD" });

    await user.clear(input);
    await user.type(input, "GBP/JPY");
    await user.keyboard("{Enter}");

    expect(onInvalid).toHaveBeenCalledWith("unknown-code");
    expect(onChange).not.toHaveBeenCalled();
    // Reverted to the committed value rather than left in a broken state.
    expect(input).toHaveValue("GBP/USD");
  });

  it("surfaces the specific parse error", async () => {
    const onInvalid = vi.fn();
    const { input, user } = setup({ onInvalid });

    await user.click(input);
    await user.type(input, "GBP/GBP");
    await user.keyboard("{Enter}");

    expect(onInvalid).toHaveBeenCalledWith("same-currency");
  });

  it("refuses to commit an untradable pair", async () => {
    const onInvalid = vi.fn();
    const { input, user, onChange } = setup({ onInvalid });

    await user.click(input);
    await user.type(input, "RUBUSD");
    await user.keyboard("{Enter}");

    expect(onInvalid).toHaveBeenCalledWith("not-tradable");
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("CurrencyPairPickerBase - one pair, several instruments", () => {
  // USDINR onshore and USDINR NDF are the same currency pair and two different
  // tradable instruments: different fixing, different settlement, different
  // price. They share base/quote and must carry distinct ids.
  const ONSHORE: CurrencyPair = {
    id: "USDINR.ONSHORE",
    baseCurrency: "USD",
    quoteCurrency: "INR",
    displayName: "Dollar / Rupee (onshore)",
    settlementStyle: "Deliverable",
  };
  const NDF: CurrencyPair = {
    id: "USDINR.NDF",
    baseCurrency: "USD",
    quoteCurrency: "INR",
    displayName: "Dollar / Rupee (NDF)",
    settlementStyle: "NDF",
    requiresTenor: true,
  };
  const BOTH = [ONSHORE, NDF];

  it("lists both, because identity is the id and not the symbol", async () => {
    const { input, user } = setup({ pairs: BOTH });
    await user.click(input);

    expect(screen.getAllByRole("option")).toHaveLength(2);
    expect(optionNames()[0]).toContain("Deliverable");
    expect(optionNames()[1]).toContain("NDF");
  });

  it("matches both on the shared symbol, and picking one emits that one", async () => {
    const { input, user, onChange } = setup({ pairs: BOTH });
    await user.click(input);
    await user.type(input, "usdinr");

    expect(screen.getAllByRole("option")).toHaveLength(2);
    await user.click(screen.getByRole("option", { name: /NDF/ }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: "USDINR.NDF" }));
  });

  it("refuses to guess when the typed symbol names two instruments", async () => {
    const onInvalid = vi.fn();
    const { input, user, onChange } = setup({ pairs: BOTH, onInvalid });

    await user.click(input);
    await user.type(input, "USD/INR");
    await user.keyboard("{Enter}");

    expect(onInvalid).toHaveBeenCalledWith("ambiguous");
    expect(onChange).not.toHaveBeenCalled();
    // The list stays open and filtered, so the two rows *are* the choice.
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("option")).toHaveLength(2);
    expect(input).toHaveValue("USD/INR");
  });

  it("still commits a typed symbol that names exactly one instrument", async () => {
    const { input, user, onChange } = setup({ pairs: [NDF, GBPUSD] });

    await user.click(input);
    await user.type(input, "usdinr");
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: "USDINR.NDF" }));
  });

  it("warns in development when two instruments share an id", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    setup({ pairs: [ONSHORE, { ...NDF, id: "USDINR.ONSHORE" }] });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("duplicate pair id"));
    warn.mockRestore();
  });
});

describe("CurrencyPairPickerBase - keyboard", () => {
  it("opens on ArrowDown and highlights the first row", async () => {
    const { input, user } = setup();
    input.focus();
    await user.keyboard("{ArrowDown}");

    expect(input).toHaveAttribute("aria-expanded", "true");
    const first = screen.getAllByRole("option")[0];
    expect(input.getAttribute("aria-activedescendant")).toBe(first.id);
  });

  it("opens on ArrowUp at the last row, not the second to last", async () => {
    const { input, user } = setup();
    input.focus();
    await user.keyboard("{ArrowUp}");

    // Entering a list backwards has to land on the end - the off-by-one that
    // was fixed in the shared roving helper. RUBUSD is last but untradable, so
    // "the end" is the last *selectable* row.
    const last = screen.getByRole("option", { name: /USD\/KRW/ });
    expect(input.getAttribute("aria-activedescendant")).toBe(last.id);
  });

  it("Alt+ArrowDown opens without activating a row", async () => {
    const { input, user } = setup();
    input.focus();
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");

    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(input).not.toHaveAttribute("aria-activedescendant");
  });

  it("skips untradable rows while roving", async () => {
    const { input, user } = setup({ pairs: [RUBUSD, GBPUSD] });
    input.focus();
    await user.keyboard("{ArrowDown}");

    const highlighted = screen.getByRole("option", { name: /GBP\/USD/ });
    expect(input.getAttribute("aria-activedescendant")).toBe(highlighted.id);
  });

  it("scrolls the highlighted row into view while roving", async () => {
    const { input, user } = setup();
    input.focus();
    await user.keyboard("{ArrowDown}"); // open, highlighting the first row

    // Focus stays on the input under aria-activedescendant, so the browser
    // never scrolls the listbox and the library has to.
    const scrolls = new Map<string, ReturnType<typeof vi.fn>>();
    for (const option of screen.getAllByRole("option")) {
      const spy = vi.fn();
      option.scrollIntoView = spy;
      scrolls.set(option.id, spy);
    }
    const scrolledFor = (id: string | null): ReturnType<typeof vi.fn> | undefined =>
      scrolls.get(id ?? "");

    await user.keyboard("{ArrowDown}");
    const second = input.getAttribute("aria-activedescendant");
    expect(scrolledFor(second)).toHaveBeenCalledWith({ block: "nearest" });

    await user.keyboard("{ArrowUp}");
    const first = input.getAttribute("aria-activedescendant");
    expect(first).not.toBe(second);
    expect(scrolledFor(first)).toHaveBeenCalledWith({ block: "nearest" });
  });

  it("selects the highlighted row on Enter", async () => {
    const { input, user, onChange } = setup();
    input.focus();
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: "GBPUSD" }));
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("Home and End jump to the selectable edges", async () => {
    const { input, user } = setup();
    input.focus();
    await user.keyboard("{ArrowDown}{End}");
    expect(input.getAttribute("aria-activedescendant")).toBe(
      screen.getByRole("option", { name: /USD\/KRW/ }).id,
    );

    await user.keyboard("{Home}");
    expect(input.getAttribute("aria-activedescendant")).toBe(
      screen.getByRole("option", { name: /GBP\/USD/ }).id,
    );
  });

  it("Escape reverts and closes", async () => {
    const { input, user, onChange } = setup({ defaultValue: "GBPUSD" });
    await user.clear(input);
    await user.type(input, "EUR");
    await user.keyboard("{Escape}");

    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).toHaveValue("GBP/USD");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Tab closes without swallowing the focus move", async () => {
    render(
      <>
        <CurrencyPairPickerBase aria-label="Pair" pairs={PAIRS} />
        <button type="button">after</button>
      </>,
    );
    const user = userEvent.setup();
    const input = screen.getByRole("combobox", { name: "Pair" });

    await user.click(input);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.tab();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
  });
});

describe("CurrencyPairPickerBase - favourites and recents", () => {
  it("pins favourites into their own section", async () => {
    const { input, user } = setup({ defaultFavourites: ["USDKRW"] });
    await user.click(input);

    expect(screen.getByRole("group", { name: "Favourites" })).toBeInTheDocument();
    // Favourites are lifted out, so the pinned pair leads the flat order.
    expect(optionNames()[0]).toContain("USD/KRW");
  });

  it("toggles a favourite with Ctrl+D, the only keyboard route", async () => {
    const onFavouriteChange = vi.fn();
    const { input, user } = setup({ onFavouriteChange });

    input.focus();
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Control>}d{/Control}");

    expect(onFavouriteChange).toHaveBeenCalledWith("GBPUSD", true, ["GBPUSD"]);
  });

  it("announces favourite state on the option's own name", async () => {
    const { input, user } = setup({ defaultFavourites: ["GBPUSD"] });
    await user.click(input);

    expect(screen.getByRole("option", { name: /GBP\/USD.*favourite/ })).toBeInTheDocument();
  });

  it("proposes recents after a selection instead of storing them", async () => {
    const onRecentsChange = vi.fn();
    const { input, user } = setup({ onRecentsChange });

    await user.click(input);
    await user.click(screen.getByRole("option", { name: /EUR\/USD/ }));

    expect(onRecentsChange).toHaveBeenCalledWith(["EURUSD"]);
  });

  it("caps the recents section and demotes the overflow", async () => {
    const { input, user } = setup({
      defaultRecents: ["GBPUSD", "EURUSD", "USDKRW"],
      maxRecents: 2,
    });
    await user.click(input);

    const recentGroup = screen.getByRole("group", { name: "Recent" });
    expect(within(recentGroup).getAllByRole("option")).toHaveLength(2);
    // The trimmed one falls back into results rather than disappearing.
    expect(screen.getAllByRole("option")).toHaveLength(4);
  });

  it("hides both sections when disabled", async () => {
    const { input, user } = setup({
      defaultFavourites: ["GBPUSD"],
      defaultRecents: ["EURUSD"],
      showFavourites: false,
      showRecents: false,
    });
    await user.click(input);

    expect(screen.queryByRole("group", { name: "Favourites" })).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Recent" })).not.toBeInTheDocument();
  });

  it("un-favourites on a second Ctrl+D", async () => {
    const onFavouriteChange = vi.fn();
    const { input, user } = setup({ onFavouriteChange, defaultFavourites: ["GBPUSD"] });

    // Favourites are lifted to the top, so the first row is the pinned one.
    input.focus();
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Control>}d{/Control}");

    expect(onFavouriteChange).toHaveBeenCalledWith("GBPUSD", false, []);
    expect(screen.queryByRole("group", { name: "Favourites" })).not.toBeInTheDocument();
  });

  it("toggles a favourite from the star without selecting the row", async () => {
    const onFavouriteChange = vi.fn();
    const { input, user, onChange } = setup({
      onFavouriteChange,
      renderFavourite: (on) => (on ? "★" : "☆"),
    });
    await user.click(input);

    // The star is a decorative span, so the row's single pointer handler has to
    // hit-test it. Pressing it must read as "favourite", never as "select".
    const option = screen.getByRole("option", { name: /GBP\/USD/ });
    fireEvent.mouseDown(within(option).getByText("☆"));

    expect(onFavouriteChange).toHaveBeenCalledWith("GBPUSD", true, ["GBPUSD"]);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("ignores the star hit-test when favourites are off", async () => {
    const onFavouriteChange = vi.fn();
    const { input, user, onChange } = setup({
      onFavouriteChange,
      showFavourites: false,
      renderFavourite: (on) => (on ? "★" : "☆"),
    });
    await user.click(input);

    // No star is rendered at all, so the whole row selects.
    const option = screen.getByRole("option", { name: /GBP\/USD/ });
    expect(within(option).queryByText("☆")).not.toBeInTheDocument();
    fireEvent.mouseDown(option);

    expect(onFavouriteChange).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: "GBPUSD" }));
  });

  it("moves an existing recent to the front instead of duplicating it", async () => {
    const onRecentsChange = vi.fn();
    const { input, user } = setup({
      defaultRecents: ["GBPUSD", "EURUSD"],
      onRecentsChange,
    });
    await user.click(input);
    await user.click(screen.getByRole("option", { name: /EUR\/USD/ }));

    expect(onRecentsChange).toHaveBeenCalledWith(["EURUSD", "GBPUSD"]);
  });

  it("does not move a controlled favourites list on its own", async () => {
    const onFavouriteChange = vi.fn();
    const { input, user } = setup({ favourites: [], onFavouriteChange });

    input.focus();
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Control>}d{/Control}");

    // Same contract as a controlled `value`: the toggle is proposed, and the
    // consumer decides whether it sticks.
    expect(onFavouriteChange).toHaveBeenCalledWith("GBPUSD", true, ["GBPUSD"]);
    expect(screen.queryByRole("group", { name: "Favourites" })).not.toBeInTheDocument();
  });

  it("does not move a controlled recents list on its own", async () => {
    const onRecentsChange = vi.fn();
    const { input, user } = setup({ recents: [], onRecentsChange });

    await user.click(input);
    await user.click(screen.getByRole("option", { name: /EUR\/USD/ }));

    expect(onRecentsChange).toHaveBeenCalledWith(["EURUSD"]);
    expect(screen.queryByRole("group", { name: "Recent" })).not.toBeInTheDocument();
  });

  it("ignores Ctrl+D with no row highlighted", async () => {
    const onFavouriteChange = vi.fn();
    const { input, user } = setup({ onFavouriteChange });

    // Alt+ArrowDown opens without activating a row, so there is nothing to
    // favourite and the chord must be a no-op rather than picking a default.
    input.focus();
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await user.keyboard("{Control>}d{/Control}");

    expect(onFavouriteChange).not.toHaveBeenCalled();
  });
});

describe("CurrencyPairPickerBase - badges", () => {
  it("derives badges from the model rather than a parallel list", async () => {
    const { input, user } = setup();
    await user.click(input);

    // settlementStyle, assetClass and tradable === false each contribute.
    expect(screen.getByRole("option", { name: /USD\/KRW.*NDF/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /GBP\/USD.*Deliverable, G10/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /RUB\/USD.*Restricted/ })).toBeInTheDocument();
  });

  it("puts the restriction reason on the accessible name", async () => {
    const { input, user } = setup();
    await user.click(input);

    const restricted = screen.getByRole("option", { name: /RUB\/USD/ });
    expect(restricted).toHaveAttribute("aria-disabled", "true");
    expect(restricted.getAttribute("aria-label")).toContain("Sanctioned");
  });

  it("takes a replacement ranker", async () => {
    // Desks rank on liquidity or franchise flow, none of which is knowable
    // here. Reverse order is enough to prove the seam is honoured.
    const { input, user } = setup({
      rankPairs: (_query, candidates) =>
        [...candidates].reverse().map((pair) => ({ pair, tier: null })),
    });
    await user.click(input);

    expect(optionNames()[0]).toContain("RUB/USD");
  });

  it("takes an override resolver", async () => {
    const { input, user } = setup({ getBadges: (pair) => (pair.requiresTenor ? ["Tenor"] : []) });
    await user.click(input);

    expect(screen.getByRole("option", { name: /USD\/KRW.*Tenor/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /GBP\/USD/ }).getAttribute("aria-label")).not.toMatch(
      /Deliverable/,
    );
  });

  it("takes a badge renderer without losing the accessible name", async () => {
    const { input, user } = setup({ renderBadge: (badge) => `[${badge}]` });
    await user.click(input);

    expect(screen.getByText("[NDF]")).toBeInTheDocument();
    // The badges are aria-hidden decoration; the name still carries the words,
    // so a renderer cannot accidentally mute them for a screen reader.
    expect(screen.getByRole("option", { name: /USD\/KRW.*NDF/ })).toBeInTheDocument();
  });
});

describe("CurrencyPairPickerBase - option renderer", () => {
  it("hands the renderer the pair and its state, and owns the row itself", async () => {
    const seen: [string, boolean, boolean][] = [];
    const { input, user, onChange } = setup({
      defaultValue: "EURUSD",
      defaultFavourites: ["GBPUSD"],
      renderOption: (pair, state) => {
        seen.push([pair.id, state.isSelected, state.isFavourite]);
        return <span>{pair.id}</span>;
      },
    });
    await user.click(input);

    expect(seen).toContainEqual(["EURUSD", true, false]);
    expect(seen).toContainEqual(["GBPUSD", false, true]);
    // The default chrome is replaced wholesale, but the row stays an option and
    // stays selectable - the renderer supplies content, not behaviour.
    expect(screen.getByText("USDKRW")).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: /GBP\/USD/ }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: "GBPUSD" }));
  });

  it("reports selectability so a renderer can style a restricted row", async () => {
    const { input, user } = setup({
      renderOption: (pair, state) => (
        <span>{state.isSelectable ? pair.id : `${pair.id} (no)`}</span>
      ),
    });
    await user.click(input);

    expect(screen.getByText("RUBUSD (no)")).toBeInTheDocument();
    expect(screen.getByText("GBPUSD")).toBeInTheDocument();
  });
});

describe("CurrencyPairPickerBase - commit and focus", () => {
  it("refuses to select an untradable row by pointer", async () => {
    const onInvalid = vi.fn();
    const { input, user, onChange } = setup({ onInvalid });
    await user.click(input);
    await user.click(screen.getByRole("option", { name: /RUB\/USD/ }));

    // The keyboard route already skips untradable rows; the pointer can still
    // reach one, so the rejection has to live in the selection path itself.
    expect(onInvalid).toHaveBeenCalledWith("not-tradable");
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("commits emptied text as a cleared value", async () => {
    const { input, user, onChange } = setup({ defaultValue: "GBPUSD" });

    await user.clear(input);
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledWith(null);
    expect(input).toHaveValue("");
  });

  it("commits typed text when focus leaves the picker", async () => {
    const onChange = vi.fn();
    render(
      <>
        <CurrencyPairPickerBase aria-label="Pair" pairs={PAIRS} onChange={onChange} />
        <button type="button">after</button>
      </>,
    );
    const user = userEvent.setup();
    const input = screen.getByRole("combobox", { name: "Pair" });

    await user.click(input);
    await user.type(input, "eurusd");
    fireEvent.blur(input, { relatedTarget: screen.getByRole("button", { name: "after" }) });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: "EURUSD" }));
  });

  it("does not commit when focus only moves inside the control", async () => {
    const { input, user, onChange } = setup({ renderIndicator: () => "chevron" });
    await user.click(input);
    await user.type(input, "eurusd");

    // Reaching for the indicator is still working on the same field. Treating
    // it as a blur-commit would fire onChange behind a click the user has not
    // finished making.
    fireEvent.blur(input, { relatedTarget: screen.getByText("chevron") });

    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue("eurusd");
  });

  it("survives the list shrinking under a highlighted row", async () => {
    const onChange = vi.fn();
    const onFavouriteChange = vi.fn();
    const { rerender } = render(
      <CurrencyPairPickerBase
        aria-label="Pair"
        pairs={PAIRS}
        onChange={onChange}
        onFavouriteChange={onFavouriteChange}
      />,
    );
    const user = userEvent.setup();
    const input = screen.getByRole("combobox", { name: "Pair" });

    input.focus();
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(input.getAttribute("aria-activedescendant")).toBe(
      screen.getByRole("option", { name: /USD\/KRW/ }).id,
    );

    // A live pair list can shrink under the user - a desk feed retiring an
    // instrument mid-session. The highlight index outlives the row it named.
    rerender(
      <CurrencyPairPickerBase
        aria-label="Pair"
        pairs={[GBPUSD]}
        onChange={onChange}
        onFavouriteChange={onFavouriteChange}
      />,
    );

    await user.keyboard("{Control>}d{/Control}");
    await user.keyboard("{Enter}");

    // Neither acts on a row that is no longer there, and neither throws.
    expect(onFavouriteChange).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("opens with an empty message when given neither pairs nor provider", async () => {
    const user = userEvent.setup();
    render(<CurrencyPairPickerBase aria-label="Pair" noOptionsMessage="No pairs" />);

    await user.click(screen.getByRole("combobox", { name: "Pair" }));
    expect(screen.getByText("No pairs")).toBeInTheDocument();
  });
});

describe("CurrencyPairPickerBase - disabled and readOnly", () => {
  it("stays shut and inert while readOnly", async () => {
    const ref = createRef<CurrencyPairPickerHandle>();
    const onChange = vi.fn();
    render(
      <CurrencyPairPickerBase
        ref={ref}
        aria-label="Pair"
        pairs={PAIRS}
        defaultValue="GBPUSD"
        onChange={onChange}
        readOnly
      />,
    );
    const user = userEvent.setup();
    const input = screen.getByRole("combobox", { name: "Pair" });

    await user.click(input);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    input.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    // The imperative handle is the one route that bypasses the pointer and key
    // guards, so it needs its own refusal rather than relying on them.
    act(() => ref.current?.open());
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    // readOnly on the input stops typing, but not every change event comes from
    // a keystroke - autofill and IME can drive one - so the handler guards too.
    fireEvent.change(input, { target: { value: "EURUSD" } });
    expect(input).toHaveValue("GBP/USD");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("stays shut and inert while disabled", () => {
    const ref = createRef<CurrencyPairPickerHandle>();
    const onChange = vi.fn();
    render(
      <CurrencyPairPickerBase
        ref={ref}
        aria-label="Pair"
        pairs={PAIRS}
        defaultValue="GBPUSD"
        onChange={onChange}
        disabled
      />,
    );
    const input = screen.getByRole("combobox", { name: "Pair" });

    act(() => ref.current?.open());
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "EURUSD" } });
    expect(input).toHaveValue("GBP/USD");
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("CurrencyPairPickerBase - async provider", () => {
  const makeProvider = (
    overrides: Partial<InstrumentProvider<CurrencyPair>> = {},
  ): InstrumentProvider<CurrencyPair> => ({
    search: vi.fn((query: string) =>
      Promise.resolve(
        PAIRS.filter((p) => p.id.includes(query.toUpperCase()) || query.trim() === ""),
      ),
    ),
    getById: vi.fn((id: string) => Promise.resolve(PAIRS.find((p) => p.id === id) ?? null)),
    ...overrides,
  });

  it("searches through the provider and renders the response", async () => {
    const provider = makeProvider();
    const user = userEvent.setup();
    render(<CurrencyPairPickerBase aria-label="Pair" provider={provider} debounceMs={0} />);
    const input = screen.getByRole("combobox", { name: "Pair" });

    await user.click(input);
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(4));

    await user.type(input, "EUR");
    await waitFor(() => {
      const names = optionNames();
      expect(names).toHaveLength(1);
      expect(names[0]).toContain("EUR/USD");
    });
  });

  it("resolves a controlled id it has never seen via getById", async () => {
    const provider = makeProvider();
    render(<CurrencyPairPickerBase aria-label="Pair" provider={provider} value="USDKRW" />);

    // Renders the raw id first, then upgrades once the lookup lands.
    await waitFor(() => expect(screen.getByRole("combobox")).toHaveValue("USD/KRW"));
    expect(provider.getById).toHaveBeenCalledWith("USDKRW");
  });

  it("leaves the raw id visible when the lookup finds nothing", async () => {
    const provider = makeProvider({ getById: () => Promise.resolve(null) });
    render(<CurrencyPairPickerBase aria-label="Pair" provider={provider} value="ZZZAAA" />);

    await waitFor(() => expect(screen.getByRole("combobox")).toHaveValue("ZZZAAA"));
  });

  it("keeps favourites visible even when the response omits them", async () => {
    // The provider's default list contains only EURUSD, but GBPUSD is a
    // favourite - it must still appear, or the pinned section is a lie.
    const provider = makeProvider({
      search: () => Promise.resolve([EURUSD]),
      getFavourites: () => Promise.resolve([GBPUSD]),
    });
    const user = userEvent.setup();
    render(<CurrencyPairPickerBase aria-label="Pair" provider={provider} debounceMs={0} />);

    await user.click(screen.getByRole("combobox", { name: "Pair" }));
    await waitFor(() => {
      expect(screen.getByRole("group", { name: "Favourites" })).toBeInTheDocument();
    });
    expect(optionNames()[0]).toContain("GBP/USD");
  });

  it("shows the provider error", async () => {
    const provider = makeProvider({ search: () => Promise.reject(new Error("desk offline")) });
    const user = userEvent.setup();
    render(<CurrencyPairPickerBase aria-label="Pair" provider={provider} debounceMs={0} />);

    await user.click(screen.getByRole("combobox", { name: "Pair" }));
    expect(await screen.findByText("desk offline")).toBeInTheDocument();
  });

  it("marks the input busy from the keystroke, not from the request", async () => {
    const provider = makeProvider();
    const user = userEvent.setup();
    render(<CurrencyPairPickerBase aria-label="Pair" provider={provider} debounceMs={5000} />);
    const input = screen.getByRole("combobox", { name: "Pair" });

    // Opening searches immediately, so the list settles and busy clears.
    await user.click(input);
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(4));
    expect(input).not.toHaveAttribute("aria-busy");

    await user.type(input, "g");

    // The request has NOT been sent - a 5s debounce is still running, and the
    // provider has only ever been called once - but the state already knows the
    // visible list does not answer what was typed.
    expect(provider.search).toHaveBeenCalledTimes(1);
    expect(input).toHaveAttribute("aria-busy", "true");
  });

  it("stays idle in static mode", async () => {
    const user = userEvent.setup();
    render(<CurrencyPairPickerBase aria-label="Pair" pairs={PAIRS} />);
    const input = screen.getByRole("combobox", { name: "Pair" });

    await user.click(input);
    await user.type(input, "gbp");

    // No provider, so nothing is ever busy and filtering is entirely local.
    expect(input).not.toHaveAttribute("aria-busy");
    expect(optionNames()[0]).toContain("GBP/USD");
  });

  it("seeds the Recent section from getRecent", async () => {
    const provider = makeProvider({
      search: () => Promise.resolve([EURUSD]),
      getRecent: () => Promise.resolve([USDKRW]),
    });
    const user = userEvent.setup();
    render(<CurrencyPairPickerBase aria-label="Pair" provider={provider} debounceMs={0} />);

    await user.click(screen.getByRole("combobox", { name: "Pair" }));
    await waitFor(() => {
      expect(screen.getByRole("group", { name: "Recent" })).toBeInTheDocument();
    });
    // Absent from the search response, so only the union with the cache puts it
    // on screen at all.
    expect(optionNames()[0]).toContain("USD/KRW");
  });

  it("does not duplicate a pinned pair the response already carries", async () => {
    const provider = makeProvider({
      search: () => Promise.resolve([GBPUSD, EURUSD]),
      getFavourites: () => Promise.resolve([GBPUSD]),
    });
    const user = userEvent.setup();
    render(<CurrencyPairPickerBase aria-label="Pair" provider={provider} debounceMs={0} />);

    await user.click(screen.getByRole("combobox", { name: "Pair" }));
    await waitFor(() => {
      expect(screen.getByRole("group", { name: "Favourites" })).toBeInTheDocument();
    });
    // Two rows, not three: GBPUSD is lifted into Favourites, never doubled.
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("stops injecting pinned pairs when the sections are switched off", async () => {
    const provider = makeProvider({
      search: () => Promise.resolve([EURUSD]),
      getFavourites: () => Promise.resolve([GBPUSD]),
    });
    const user = userEvent.setup();
    render(
      <CurrencyPairPickerBase
        aria-label="Pair"
        provider={provider}
        debounceMs={0}
        showFavourites={false}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Pair" }));
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(1));
    // Turning the section off must also stop the union adding the row further
    // down the list, or hiding the section would just move it.
    expect(optionNames()[0]).toContain("EUR/USD");
  });

  it("drops a pinned id it has never resolved to a pair", async () => {
    const provider = makeProvider({ search: () => Promise.resolve([EURUSD]) });
    const user = userEvent.setup();
    render(
      <CurrencyPairPickerBase
        aria-label="Pair"
        provider={provider}
        debounceMs={0}
        defaultFavourites={["ZZZAAA"]}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Pair" }));
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(1));
    // A stored favourite the provider no longer knows must not become a phantom
    // row the user can highlight but not price.
    expect(optionNames()[0]).toContain("EUR/USD");
  });

  it("keeps recents out of the pool when the section is switched off", async () => {
    const provider = makeProvider({
      search: () => Promise.resolve([EURUSD]),
      getRecent: () => Promise.resolve([GBPUSD]),
    });
    const user = userEvent.setup();
    render(
      <CurrencyPairPickerBase
        aria-label="Pair"
        provider={provider}
        debounceMs={0}
        showRecents={false}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Pair" }));
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(1));
    expect(optionNames()[0]).toContain("EUR/USD");
  });

  it("survives a failed personalisation lookup", async () => {
    const provider = makeProvider({
      getFavourites: () => Promise.reject(new Error("no profile")),
      getRecent: () => Promise.resolve([USDKRW]),
    });
    const user = userEvent.setup();
    render(<CurrencyPairPickerBase aria-label="Pair" provider={provider} debounceMs={0} />);

    await user.click(screen.getByRole("combobox", { name: "Pair" }));
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(4));
    // Personalisation is optional. Losing it costs the pinned sections and
    // nothing else - the picker is still a working picker.
    expect(screen.queryByRole("group", { name: "Favourites" })).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Recent" })).not.toBeInTheDocument();
  });

  it("leaves the raw id visible when getById rejects", async () => {
    const getById = vi.fn(() => Promise.reject(new Error("lookup down")));
    const provider = makeProvider({ getById });
    render(<CurrencyPairPickerBase aria-label="Pair" provider={provider} value="USDKRW" />);

    await waitFor(() => expect(getById).toHaveBeenCalledWith("USDKRW"));
    // A failed resolution degrades to the id; it must never throw at render.
    expect(screen.getByRole("combobox")).toHaveValue("USDKRW");
  });

  it("ignores a personalisation response that lands after unmount", async () => {
    let settle: (pairs: readonly CurrencyPair[]) => void = () => undefined;
    const provider = makeProvider({
      getFavourites: () =>
        new Promise<readonly CurrencyPair[]>((resolve) => {
          settle = resolve;
        }),
    });
    const { unmount } = render(<CurrencyPairPickerBase aria-label="Pair" provider={provider} />);
    unmount();

    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await act(async () => {
      settle([GBPUSD]);
    });
    // Resolving into an unmounted tree is a no-op, not a setState warning.
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it("cancels the pending search when the listbox closes", async () => {
    const provider = makeProvider();
    const user = userEvent.setup();
    render(<CurrencyPairPickerBase aria-label="Pair" provider={provider} debounceMs={5000} />);
    const input = screen.getByRole("combobox", { name: "Pair" });

    await user.click(input);
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(4));

    await user.type(input, "eur");
    expect(input).toHaveAttribute("aria-busy", "true");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    // Nothing further will be asked for, so leaving the field marked busy would
    // strand a screen reader on a request that is never coming.
    expect(input).not.toHaveAttribute("aria-busy");
  });
});

describe("CurrencyPairPickerBase - imperative handle", () => {
  it("announces open and close once each, not once per call", () => {
    const ref = createRef<CurrencyPairPickerHandle>();
    const onOpen = vi.fn();
    const onClose = vi.fn();
    render(
      <CurrencyPairPickerBase
        ref={ref}
        aria-label="Pair"
        pairs={PAIRS}
        onOpen={onOpen}
        onClose={onClose}
      />,
    );

    act(() => ref.current?.open());
    act(() => ref.current?.open());
    expect(onOpen).toHaveBeenCalledTimes(1);

    act(() => ref.current?.close());
    act(() => ref.current?.close());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("exposes focus / open / close / getValue", async () => {
    const ref = createRef<CurrencyPairPickerHandle>();
    render(
      <CurrencyPairPickerBase ref={ref} aria-label="Pair" pairs={PAIRS} defaultValue="EURUSD" />,
    );

    expect(ref.current?.getValue()).toBe("EURUSD");

    act(() => ref.current?.focus());
    expect(screen.getByRole("combobox")).toHaveFocus();

    act(() => ref.current?.open());
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    act(() => ref.current?.close());
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
