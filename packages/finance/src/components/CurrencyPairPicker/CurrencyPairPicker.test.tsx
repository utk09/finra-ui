import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import type {
  CurrencyPair,
  CurrencyPairPickerHandle,
} from "../../unstyled/CurrencyPairPicker/CurrencyPairPicker";
import { CurrencyPairPicker } from "./CurrencyPairPicker";

const GBPUSD: CurrencyPair = {
  id: "GBPUSD",
  baseCurrency: "GBP",
  quoteCurrency: "USD",
  displayName: "Sterling / Dollar",
  assetClass: "G10",
  settlementStyle: "Deliverable",
  pricing: { primaryPrecision: 4, precisionDigits: 1, tickSize: 0.00005 },
};

const USDKRW: CurrencyPair = {
  id: "USDKRW",
  baseCurrency: "USD",
  quoteCurrency: "KRW",
  displayName: "Dollar / Won",
  settlementStyle: "NDF",
  requiresTenor: true,
};

const RUBUSD: CurrencyPair = {
  id: "RUBUSD",
  baseCurrency: "RUB",
  quoteCurrency: "USD",
  tradable: false,
  restrictionReason: "Sanctioned",
};

const PAIRS = [GBPUSD, USDKRW, RUBUSD];

describe("CurrencyPairPicker (styled)", () => {
  it("renders the data-finra-ui root, shell and combobox", () => {
    render(<CurrencyPairPicker aria-label="Pair" pairs={PAIRS} />);

    expect(screen.getByTestId("currency-pair-picker")).toBeInTheDocument();
    // The shell is addressable separately because the listbox is portalled out
    // of the root and anchors to the shell instead.
    expect(screen.getByTestId("currency-pair-picker-control")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Pair" })).toBeInTheDocument();
  });

  it("commits a typed pair through the styled wrapper", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CurrencyPairPicker aria-label="Pair" pairs={PAIRS} onChange={onChange} />);

    const input = screen.getByRole("combobox");
    await user.type(input, "gbp/usd");
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: "GBPUSD" }));
    expect(input).toHaveValue("GBP/USD");
  });

  it("portals the listbox out of the root", async () => {
    const user = userEvent.setup();
    render(<CurrencyPairPicker aria-label="Pair" pairs={PAIRS} />);

    await user.click(screen.getByRole("combobox"));

    const listbox = screen.getByRole("listbox");
    const root = screen.getByTestId("currency-pair-picker");
    // Escaping the root is the whole point - an inline panel is clipped by an
    // ancestor overflow/z-index/transform context.
    expect(within(root).queryByRole("listbox")).not.toBeInTheDocument();
    expect(listbox).toBeInTheDocument();
  });

  it("labels badges so they can be themed without a render prop", async () => {
    const user = userEvent.setup();
    render(<CurrencyPairPicker aria-label="Pair" pairs={PAIRS} />);

    await user.click(screen.getByRole("combobox"));

    const badges = screen.getAllByTestId("currency-pair-badge");
    expect(badges.map((b) => b.textContent)).toEqual(
      expect.arrayContaining(["Deliverable", "G10", "NDF", "Restricted"]),
    );
  });

  it("lets a consumer replace badge content while keeping the chrome", async () => {
    const user = userEvent.setup();
    render(
      <CurrencyPairPicker
        aria-label="Pair"
        pairs={PAIRS}
        renderBadge={(badge) => badge.slice(0, 1)}
      />,
    );

    await user.click(screen.getByRole("combobox"));

    const badges = screen.getAllByTestId("currency-pair-badge");
    expect(badges.map((b) => b.textContent)).toEqual(expect.arrayContaining(["D", "G", "N", "R"]));
  });

  it("renders the decorative star without nesting an interactive control", async () => {
    const user = userEvent.setup();
    render(<CurrencyPairPicker aria-label="Pair" pairs={PAIRS} defaultFavourites={["GBPUSD"]} />);

    await user.click(screen.getByRole("combobox"));

    const favourited = screen.getByRole("option", { name: /GBP\/USD.*favourite/ });
    expect(within(favourited).getByText("★")).toBeInTheDocument();
    expect(within(screen.getByRole("listbox")).queryByRole("button")).toBeNull();
  });

  it("marks an untradable pair disabled and keeps its reason announced", async () => {
    const user = userEvent.setup();
    render(<CurrencyPairPicker aria-label="Pair" pairs={PAIRS} />);

    await user.click(screen.getByRole("combobox"));

    const restricted = screen.getByRole("option", { name: /RUB\/USD/ });
    expect(restricted).toHaveAttribute("aria-disabled", "true");
    expect(restricted.getAttribute("aria-label")).toContain("Sanctioned");
  });

  it("forwards the imperative handle", () => {
    const ref = createRef<CurrencyPairPickerHandle>();
    render(<CurrencyPairPicker aria-label="Pair" pairs={PAIRS} ref={ref} defaultValue="USDKRW" />);

    expect(ref.current?.getValue()).toBe("USDKRW");
    ref.current?.focus();
    expect(screen.getByRole("combobox")).toHaveFocus();
  });

  it("keeps the generic parameter, so a richer pair survives to onChange", async () => {
    interface DeskPair extends CurrencyPair {
      deskCode: string;
    }
    const deskPairs: DeskPair[] = [{ ...GBPUSD, deskCode: "LDN-FX-1" }];
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <CurrencyPairPicker<DeskPair> aria-label="Pair" pairs={deskPairs} onChange={onChange} />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: /GBP\/USD/ }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ deskCode: "LDN-FX-1" }));
  });

  it("applies variant / validation / fullWidth / disabled / className", () => {
    render(
      <CurrencyPairPicker
        aria-label="Pair"
        pairs={PAIRS}
        variant="secondary"
        validationStatus="error"
        fullWidth
        disabled
        className="desk-pair"
      />,
    );

    const root = screen.getByTestId("currency-pair-picker");
    expect(root.className).toMatch(/variantSecondary/);
    expect(root.className).toMatch(/statusError/);
    expect(root.className).toMatch(/fullWidth/);
    expect(root.className).toMatch(/disabled/);
    expect(root.className).toContain("desk-pair");
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("applies the tertiary variant and the remaining validation statuses", () => {
    const { rerender } = render(
      <CurrencyPairPicker
        aria-label="Pair"
        pairs={PAIRS}
        variant="tertiary"
        validationStatus="warning"
      />,
    );
    let root = screen.getByTestId("currency-pair-picker");
    expect(root.className).toMatch(/variantTertiary/);
    expect(root.className).toMatch(/statusWarning/);

    rerender(<CurrencyPairPicker aria-label="Pair" pairs={PAIRS} validationStatus="success" />);
    root = screen.getByTestId("currency-pair-picker");
    expect(root.className).toMatch(/statusSuccess/);
  });

  it("drops the star entirely when favourites are switched off", async () => {
    const user = userEvent.setup();
    render(<CurrencyPairPicker aria-label="Pair" pairs={PAIRS} showFavourites={false} />);

    await user.click(screen.getByRole("combobox"));

    // No renderer is passed down at all, so there is no decorative glyph to
    // hit-test - not merely a hidden one.
    expect(screen.queryByText("☆")).not.toBeInTheDocument();
    expect(screen.queryByText("★")).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Favourites" })).not.toBeInTheDocument();
  });

  it("accepts a provider and renders what it returns", async () => {
    const user = userEvent.setup();
    render(
      <CurrencyPairPicker
        aria-label="Pair"
        debounceMs={0}
        provider={{
          search: () => Promise.resolve(PAIRS),
          getById: (id) => Promise.resolve(PAIRS.find((p) => p.id === id) ?? null),
        }}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(3));
  });
});
