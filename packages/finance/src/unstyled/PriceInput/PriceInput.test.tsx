import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_PRICE_KEYMAP } from "../../utils/keymap";
import { PriceInputBase, type PriceInputHandle } from "./PriceInput";

/** Decimal opts with a clean 0.01 tick for readable assertions. */
const CENTS = { format: "decimal" as const, precision: 2, tickSize: 0.01 };

function setup(props: React.ComponentProps<typeof PriceInputBase> = {}) {
  const onChange = vi.fn();
  render(<PriceInputBase aria-label="Price" onChange={onChange} {...props} />);
  const input = screen.getByRole("spinbutton", { name: "Price" }) as HTMLInputElement;
  return { onChange, input };
}

describe("PriceInputBase", () => {
  it("renders a spinbutton and formats the initial value", () => {
    const { input } = setup({ ...CENTS, defaultValue: 1 });
    expect(input).toHaveValue("1.00");
    expect(input).toHaveAttribute("aria-valuenow", "1");
  });

  it("commits typed input on Enter (parse → format)", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const onParse = vi.fn();
    const { onChange, input } = setup({ ...CENTS, onCommit, onParse });

    await user.type(input, "12.5");
    await user.keyboard("{Enter}");

    expect(onParse).toHaveBeenCalled();
    expect(input).toHaveValue("12.50");
    expect(onChange.mock.calls[0][0]).toBeCloseTo(12.5, 6);
    expect(onCommit.mock.calls[0][0]).toBeCloseTo(12.5, 6);
  });

  it("is paste-tolerant (strips thousands/label noise) on commit", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup({ ...CENTS });

    await user.type(input, "1,234.50");
    await user.tab(); // blur commits

    expect(input).toHaveValue("1234.50");
    expect(onChange.mock.calls[0][0]).toBeCloseTo(1234.5, 6);
  });

  it("steps by one tick on arrow keys", async () => {
    const user = userEvent.setup();
    const onTick = vi.fn();
    const { input } = setup({ ...CENTS, defaultValue: 1, onTick });

    input.focus();
    await user.keyboard("{ArrowUp}");
    expect(input).toHaveValue("1.01");
    expect(onTick).toHaveBeenLastCalledWith(expect.closeTo(1.01, 6), 1);

    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(input).toHaveValue("0.99");
  });

  it("steps by ten ticks with Shift", async () => {
    const user = userEvent.setup();
    const { input } = setup({ ...CENTS, defaultValue: 1 });

    input.focus();
    await user.keyboard("{Shift>}{ArrowUp}{/Shift}");
    expect(input).toHaveValue("1.10");
  });

  it("steps bond prices in 32nds", async () => {
    const user = userEvent.setup();
    const { input } = setup({ format: "bond32", defaultValue: 101.5 });

    expect(input).toHaveValue("101-16");
    input.focus();
    await user.keyboard("{ArrowUp}");
    expect(input).toHaveValue("101-17");
  });

  it("reverts to the last committed value on Escape", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup({ ...CENTS, defaultValue: 1 });

    await user.clear(input);
    await user.type(input, "9.99");
    await user.keyboard("{Escape}");

    expect(input).toHaveValue("1.00");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clamps ticks to min/max", async () => {
    const user = userEvent.setup();
    const onTick = vi.fn();
    const { onChange, input } = setup({ ...CENTS, defaultValue: 0, min: 0, onTick });

    input.focus();
    await user.keyboard("{ArrowDown}");
    expect(input).toHaveValue("0.00");
    expect(onTick).toHaveBeenCalledWith(0, -1);
    // value unchanged → onChange not fired
    expect(onChange).not.toHaveBeenCalled();
  });

  it("rejects out-of-range commits via onValidate and reverts", async () => {
    const user = userEvent.setup();
    const onValidate = vi.fn();
    const { onChange, input } = setup({ ...CENTS, defaultValue: 10, max: 100, onValidate });

    await user.clear(input);
    await user.type(input, "150");
    await user.keyboard("{Enter}");

    expect(onValidate).toHaveBeenLastCalledWith({ valid: false, value: 150, error: "max" });
    expect(input).toHaveValue("10.00");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("rejects via a custom validator", async () => {
    const user = userEvent.setup();
    const onValidate = vi.fn();
    const { onChange, input } = setup({
      ...CENTS,
      defaultValue: 2,
      validate: (v) => (v % 2 === 0 ? true : "must be even"),
      onValidate,
    });

    await user.clear(input);
    await user.type(input, "3");
    await user.keyboard("{Enter}");

    expect(onValidate).toHaveBeenLastCalledWith({ valid: false, value: 3, error: "custom" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("takes format/precision/tick from instrument metadata", async () => {
    const user = userEvent.setup();
    const { input } = setup({ instrument: { format: "bond32" }, defaultValue: 101.5 });
    expect(input).toHaveValue("101-16");
    input.focus();
    await user.keyboard("{ArrowUp}");
    expect(input).toHaveValue("101-17");
  });

  it("reverts an unparseable commit without changing the value", async () => {
    const user = userEvent.setup();
    const onParse = vi.fn();
    const { onChange, input } = setup({ ...CENTS, defaultValue: 1, onParse });

    await user.clear(input);
    await user.type(input, "xyz");
    await user.keyboard("{Enter}");

    expect(onParse).toHaveBeenLastCalledWith(expect.objectContaining({ valid: false }));
    expect(input).toHaveValue("1.00"); // reverted to the last good display
    expect(onChange).not.toHaveBeenCalled();
  });

  it("ticks from zero when the field is empty", async () => {
    const user = userEvent.setup();
    const { input } = setup({ ...CENTS });
    input.focus();
    await user.keyboard("{ArrowUp}");
    expect(input).toHaveValue("0.01");
  });

  it("clears to null on an empty commit", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup({ ...CENTS, defaultValue: 5 });

    await user.clear(input);
    await user.keyboard("{Enter}");

    expect(input).toHaveValue("");
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("renders a controlled value and does not manage its own text", () => {
    setup({ format: "bond32", value: 101.5 });
    expect(screen.getByRole("spinbutton")).toHaveValue("101-16");
  });

  it("is inert when disabled / read-only", async () => {
    const user = userEvent.setup();
    const onTick = vi.fn();
    const { input } = setup({ ...CENTS, defaultValue: 1, readOnly: true, onTick });

    expect(input).toHaveAttribute("readonly");
    input.focus();
    await user.keyboard("{ArrowUp}");
    expect(input).toHaveValue("1.00");
    expect(onTick).not.toHaveBeenCalled();
  });

  it("exposes an imperative handle", () => {
    const ref = createRef<PriceInputHandle>();
    render(<PriceInputBase aria-label="Price" ref={ref} {...CENTS} defaultValue={1} />);
    const input = screen.getByRole("spinbutton") as HTMLInputElement;

    act(() => ref.current?.focus());
    expect(input).toHaveFocus();

    act(() => ref.current?.step(5));
    expect(input).toHaveValue("1.05");
    expect(ref.current?.getValue()).toBeCloseTo(1.05, 6);

    act(() => ref.current?.select());
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(input.value.length);
  });
});

// FX-style: 4 primary decimals + 1 precision digit, 0.00005 tick.
const FX = { primaryPrecision: 4, precisionDigits: 1, tickSize: 0.00005 };

describe("PriceInputBase v2 (engines)", () => {
  it("renders primary + precision digits at display precision", () => {
    render(<PriceInputBase aria-label="Price" {...FX} defaultValue={1.08345} />);
    expect(screen.getByRole("spinbutton")).toHaveValue("1.08345");
  });

  it("steps one tick on Arrow by default", async () => {
    const user = userEvent.setup();
    render(<PriceInputBase aria-label="Price" {...FX} defaultValue={1.08345} />);
    const input = screen.getByRole("spinbutton");
    input.focus();
    await user.keyboard("{ArrowUp}");
    expect(input).toHaveValue("1.08350");
  });

  it("steps a primary digit on Ctrl+Arrow by default", async () => {
    const user = userEvent.setup();
    render(<PriceInputBase aria-label="Price" {...FX} defaultValue={1.08345} />);
    const input = screen.getByRole("spinbutton");
    input.focus();
    await user.keyboard("{Control>}{ArrowUp}{/Control}");
    expect(input).toHaveValue("1.08355");
  });

  it("honours a consumer keymap rebinding Arrow to a primary-digit step", async () => {
    const user = userEvent.setup();
    const keymap = {
      ...DEFAULT_PRICE_KEYMAP,
      ArrowUp: {
        kind: "increment" as const,
        direction: 1 as const,
        action: { type: "primary" as const },
      },
    };
    render(<PriceInputBase aria-label="Price" {...FX} defaultValue={1.08345} keymap={keymap} />);
    const input = screen.getByRole("spinbutton");
    input.focus();
    await user.keyboard("{ArrowUp}");
    expect(input).toHaveValue("1.08355"); // primary (+0.0001), not tick (+0.00005)
  });

  it("rejects an off-tick commit when tickValidation='reject'", async () => {
    const user = userEvent.setup();
    const onValidate = vi.fn();
    const onChange = vi.fn();
    render(
      <PriceInputBase
        aria-label="Price"
        format="decimal"
        precision={2}
        tickSize={0.05}
        tickValidation="reject"
        defaultValue={1}
        onValidate={onValidate}
        onChange={onChange}
      />,
    );
    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "1.02");
    await user.keyboard("{Enter}");

    expect(onValidate).toHaveBeenLastCalledWith({ valid: false, value: 1.02, error: "tick" });
    expect(input).toHaveValue("1.00");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("snaps an off-tick commit when tickValidation='snap'", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <PriceInputBase
        aria-label="Price"
        format="decimal"
        precision={2}
        tickSize={0.05}
        tickValidation="snap"
        defaultValue={1}
        onChange={onChange}
      />,
    );
    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "1.07");
    await user.keyboard("{Enter}");

    expect(input).toHaveValue("1.05");
    expect(onChange.mock.calls[0][0]).toBeCloseTo(1.05, 6);
  });

  it("accepts an off-tick commit with tickValidation='warn'", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <PriceInputBase
        aria-label="Price"
        format="decimal"
        precision={2}
        tickSize={0.05}
        tickValidation="warn"
        defaultValue={1}
        onChange={onChange}
      />,
    );
    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "1.02");
    await user.keyboard("{Enter}");

    expect(input).toHaveValue("1.02");
    expect(onChange.mock.calls[0][0]).toBeCloseTo(1.02, 6);
  });

  it("leaves the value untouched on Left/Right (native caret)", async () => {
    const user = userEvent.setup();
    const onTick = vi.fn();
    render(
      <PriceInputBase
        aria-label="Price"
        format="decimal"
        precision={2}
        tickSize={0.01}
        defaultValue={1}
        onTick={onTick}
      />,
    );
    const input = screen.getByRole("spinbutton");
    input.focus();
    await user.keyboard("{ArrowLeft}{ArrowRight}");
    expect(input).toHaveValue("1.00");
    expect(onTick).not.toHaveBeenCalled();
  });

  it("applies an arbitrary increment action via the handle", () => {
    const ref = createRef<PriceInputHandle>();
    render(<PriceInputBase aria-label="Price" {...FX} defaultValue={1.08345} ref={ref} />);
    const input = screen.getByRole("spinbutton");
    act(() => ref.current?.increment({ type: "primary" }, 1));
    expect(input).toHaveValue("1.08355");
  });

  it("renders a digit-hierarchy overlay from segments", () => {
    render(
      <PriceInputBase
        aria-label="Price"
        {...FX}
        defaultValue={1.08345}
        renderDisplay={(segs) => segs.map((s, i) => <span key={i}>{s.text}</span>)}
      />,
    );
    expect(screen.getByText("0834")).toBeInTheDocument(); // primary frac
    expect(screen.getByText("5")).toBeInTheDocument(); // precision digit
  });

  it("selects the precision digit group via the handle", () => {
    const ref = createRef<PriceInputHandle>();
    render(<PriceInputBase aria-label="Price" {...FX} defaultValue={1.08345} ref={ref} />);
    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    act(() => ref.current?.selectGroup("precision"));
    // "1.08345" → precision "5" at [6, 7)
    expect(input.selectionStart).toBe(6);
    expect(input.selectionEnd).toBe(7);
  });

  it("renders FX big-figure / pips / fractional-pip zones", () => {
    render(
      <PriceInputBase
        aria-label="Price"
        {...FX}
        pipDigits={2}
        bigFigureDigits={2}
        defaultValue={1.23456}
        renderDisplay={(segs) => segs.map((s, i) => <span key={i}>{s.text}</span>)}
      />,
    );
    expect(screen.getByText("1.23")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  it("selects the pips group on focus (selectOnFocus)", async () => {
    render(
      <PriceInputBase
        aria-label="Price"
        {...FX}
        pipDigits={2}
        bigFigureDigits={2}
        selectOnFocus="pips"
        defaultValue={1.23456}
      />,
    );
    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    act(() => input.focus());
    // "1.23456": big-figure "1.23" [0,4), pips "45" [4,6)
    await waitFor(() => {
      expect(input.selectionStart).toBe(4);
      expect(input.selectionEnd).toBe(6);
    });
  });
});
