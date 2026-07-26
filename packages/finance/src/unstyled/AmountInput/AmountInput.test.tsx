import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { AmountInputBase, type AmountInputHandle } from "./AmountInput";

/** Pinned locale, so grouping assertions do not depend on the test machine. */
const EN = { locale: "en-US" };

function setup(props: React.ComponentProps<typeof AmountInputBase> = {}) {
  const onChange = vi.fn();
  render(<AmountInputBase aria-label="Amount" onChange={onChange} {...EN} {...props} />);
  const input = screen.getByRole("spinbutton", { name: "Amount" }) as HTMLInputElement;
  return { onChange, input };
}

describe("AmountInputBase — shorthand", () => {
  it.each([
    ["1.23M", 1_230_000, "1.23M"],
    ["10m", 10_000_000, "10M"],
    ["2bn", 2_000_000_000, "2B"],
    // Below the compact floor, and above it but not losslessly abbreviable.
    ["1e5", 100_000, "100,000"],
    ["1,500,123", 1_500_123, "1,500,123"],
    ["(2m)", -2_000_000, "-2M"],
  ])("resolves %s to %d and rests as %s", async (typed, expected, display) => {
    const user = userEvent.setup();
    const { onChange, input } = setup();

    await user.type(input, typed);
    await user.tab(); // blur commits

    expect(onChange).toHaveBeenLastCalledWith(expected);
    expect(input).toHaveValue(display);
  });

  it("commits on Enter as well as blur", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { input } = setup({ onCommit });

    await user.type(input, "4.1m");
    await user.keyboard("{Enter}");

    expect(onCommit).toHaveBeenCalledWith(4_100_000);
  });

  it("shows the expansion in full on Enter, and the formatted value only on blur", async () => {
    const user = userEvent.setup();
    const { input } = setup();

    await user.type(input, "10m");

    // Enter commits without moving focus, so the field stays in its editable
    // form - which is also the confirmation that the shorthand expanded.
    await user.keyboard("{Enter}");
    expect(input).toHaveValue("10000000");

    await user.tab();
    expect(input).toHaveValue("10M");
  });

  it("reports parse attempts while typing, before any commit", async () => {
    const user = userEvent.setup();
    const onParse = vi.fn();
    const onCommit = vi.fn();
    setup({ onParse, onCommit });

    await user.type(screen.getByRole("spinbutton"), "10m");

    expect(onParse).toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();
  });
});

describe("AmountInputBase — focus and blur display", () => {
  it("shows full digits on focus and the formatted value on blur", async () => {
    const user = userEvent.setup();
    const { input } = setup({ defaultValue: 1_230_000 });

    expect(input).toHaveValue("1.23M");

    await user.click(input);
    expect(input).toHaveValue("1230000");

    await user.tab();
    expect(input).toHaveValue("1.23M");
  });

  it("keeps the currency symbol on an abbreviated resting value", () => {
    const { input } = setup({ defaultValue: 1_230_000, currency: "USD" });
    expect(input).toHaveValue("$1.23M");
  });

  it("drops the currency symbol and trailing zeros while editing", async () => {
    const user = userEvent.setup();
    const { input } = setup({ defaultValue: 1500, currency: "USD" });

    expect(input).toHaveValue("$1,500.00");

    await user.click(input);
    expect(input).toHaveValue("1500");
  });

  it("selects the value on focus when asked", async () => {
    const user = userEvent.setup();
    const { input } = setup({ defaultValue: 5_000, selectOnFocus: true });

    await user.click(input);

    // Deferred a frame, so that it selects the editable text rather than the
    // formatted text it replaced.
    await waitFor(() => expect(input.selectionStart).toBe(0));
    expect(input.selectionEnd).toBe("5000".length);
  });
});

describe("AmountInputBase — stepping", () => {
  it("steps by the step prop on arrow keys", async () => {
    const user = userEvent.setup();
    const onTick = vi.fn();
    const { input } = setup({ defaultValue: 1_000_000, step: 1_000_000, onTick });

    input.focus();
    await user.keyboard("{ArrowUp}");

    expect(input).toHaveValue("2000000");
    expect(onTick).toHaveBeenLastCalledWith(2_000_000, 1);

    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(input).toHaveValue("0");
  });

  it("steps by ten steps with Shift, and by largeStep when given", async () => {
    const user = userEvent.setup();
    const { input } = setup({ defaultValue: 0, step: 1_000 });

    input.focus();
    await user.keyboard("{Shift>}{ArrowUp}{/Shift}");
    expect(input).toHaveValue("10000");

    await user.keyboard("{PageDown}");
    expect(input).toHaveValue("0");
  });

  it("honours an explicit largeStep", async () => {
    const user = userEvent.setup();
    const { input } = setup({ defaultValue: 0, step: 1_000, largeStep: 250_000 });

    input.focus();
    await user.keyboard("{PageUp}");
    expect(input).toHaveValue("250000");
  });

  it("steps from what is typed, not from the last commit", async () => {
    const user = userEvent.setup();
    const { input } = setup({ step: 1 });

    await user.type(input, "10m");
    await user.keyboard("{ArrowUp}");

    expect(input).toHaveValue("10000001");
  });

  it("keeps a fractional step from rounding itself away", async () => {
    const user = userEvent.setup();
    const { input } = setup({ defaultValue: 1, step: 0.25, currency: "JPY" });

    input.focus();
    await user.keyboard("{ArrowUp}");
    expect(input).toHaveValue("1.25");
  });

  it("clamps an increment to min and max", async () => {
    const user = userEvent.setup();
    const { input } = setup({ defaultValue: 95, step: 10, min: 0, max: 100 });

    input.focus();
    await user.keyboard("{ArrowUp}");
    expect(input).toHaveValue("100");

    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}");
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(input).toHaveValue("0");
  });
});

describe("AmountInputBase — validation and reverting", () => {
  it("reverts unparseable text on blur", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup({ defaultValue: 5_000 });

    await user.clear(input);
    await user.type(input, "10MM");
    await user.tab();

    expect(input).toHaveValue("5,000");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("reverts a value outside min, and says which bound failed", async () => {
    const user = userEvent.setup();
    const onValidate = vi.fn();
    const { input } = setup({ defaultValue: 5_000, min: 1_000, onValidate });

    await user.clear(input);
    await user.type(input, "500");
    await user.tab();

    expect(onValidate).toHaveBeenLastCalledWith({ valid: false, value: 500, error: "min" });
    expect(input).toHaveValue("5,000");
  });

  it("distinguishes max from min", async () => {
    const user = userEvent.setup();
    const onValidate = vi.fn();
    const { input } = setup({ defaultValue: 5_000, max: 10_000, onValidate });

    await user.clear(input);
    await user.type(input, "50k");
    await user.tab();

    expect(onValidate).toHaveBeenLastCalledWith({ valid: false, value: 50_000, error: "max" });
  });

  it("reverts on a rejecting custom validator", async () => {
    const user = userEvent.setup();
    const { input } = setup({ defaultValue: 100, validate: (v) => v % 100 === 0 });

    await user.clear(input);
    await user.type(input, "150");
    await user.tab();

    expect(input).toHaveValue("100");
  });

  it("reverts to the committed value on Escape", async () => {
    const user = userEvent.setup();
    const { input } = setup({ defaultValue: 2_000 });

    await user.click(input);
    await user.clear(input);
    await user.type(input, "9m");
    await user.keyboard("{Escape}");

    // Still focused, so the editable form is what comes back.
    expect(input).toHaveValue("2000");
  });

  it("commits null when cleared", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { onChange, input } = setup({ defaultValue: 2_000, onCommit });

    await user.clear(input);
    await user.tab();

    expect(input).toHaveValue("");
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(onCommit).toHaveBeenLastCalledWith(null);
  });

  it("rejects a negative when negatives are off", async () => {
    const user = userEvent.setup();
    const { input } = setup({ defaultValue: 100, allowNegative: false });

    await user.clear(input);
    await user.type(input, "-5");
    await user.tab();

    expect(input).toHaveValue("100");
  });
});

describe("AmountInputBase — configuration", () => {
  it("accepts consumer suffixes alongside the defaults", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup({ suffixes: { L: 5, Cr: 7 } });

    await user.type(input, "2.5Cr");
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(25_000_000);

    await user.clear(input);
    await user.type(input, "10k");
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(10_000);
  });

  it("round-trips through a comma decimal mark", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup({
      defaultValue: 1234.5,
      locale: "de-DE",
      decimalSeparator: ",",
    });

    await user.click(input);
    // The editable form must use the configured mark, or the parser will strip
    // it as grouping on the way back.
    expect(input).toHaveValue("1234,5");

    await user.tab();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("reports a currency code found in the text", async () => {
    const user = userEvent.setup();
    const onCurrencyChange = vi.fn();
    const { onChange, input } = setup({
      currency: "USD",
      currencyCodes: ["USD", "EUR"],
      onCurrencyChange,
    });

    await user.type(input, "EUR 5m");
    await user.tab();

    expect(onCurrencyChange).toHaveBeenCalledWith("EUR");
    expect(onChange).toHaveBeenLastCalledWith(5_000_000);
  });

  it("renders negatives in parentheses in accounting format", () => {
    const { input } = setup({ defaultValue: -1234.5, currency: "USD", format: "accounting" });
    expect(input).toHaveValue("($1,234.50)");
  });

  it("opts out of abbreviation with format=full", () => {
    const { input } = setup({ defaultValue: 2_500_000_000, format: "full" });
    expect(input).toHaveValue("2,500,000,000");
  });
});

describe("AmountInputBase — controlled, disabled, read-only", () => {
  it("follows a controlled value while unfocused", () => {
    const { rerender } = render(<AmountInputBase aria-label="Amount" {...EN} value={1_000} />);
    const input = screen.getByRole("spinbutton", { name: "Amount" });
    expect(input).toHaveValue("1,000");

    rerender(<AmountInputBase aria-label="Amount" {...EN} value={2_000} />);
    expect(input).toHaveValue("2,000");
  });

  it("does not overwrite a live edit when the parent re-renders", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<AmountInputBase aria-label="Amount" {...EN} value={1_000} />);
    const input = screen.getByRole("spinbutton", { name: "Amount" });

    await user.click(input);
    await user.clear(input);
    await user.type(input, "7m");

    rerender(<AmountInputBase aria-label="Amount" {...EN} value={1_000} />);
    expect(input).toHaveValue("7m");
  });

  it("ignores typing and stepping when read-only", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup({ defaultValue: 1_000, step: 100, readOnly: true });

    input.focus();
    await user.keyboard("{ArrowUp}");
    await user.type(input, "5");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("ignores keys when disabled", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup({ defaultValue: 1_000, step: 100, disabled: true });

    await user.type(input, "5");
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("AmountInputBase — accessibility and imperative handle", () => {
  it("exposes the canonical value and bounds to assistive tech", () => {
    const { input } = setup({ defaultValue: 1_230_000, min: 0, max: 5_000_000, currency: "USD" });

    expect(input).toHaveAttribute("aria-valuenow", "1230000");
    expect(input).toHaveAttribute("aria-valuemin", "0");
    expect(input).toHaveAttribute("aria-valuemax", "5000000");
    // Announced as the formatted amount, not the digits being edited.
    expect(input).toHaveAttribute("aria-valuetext", "$1.23M");
  });

  it("drives the field through its ref", async () => {
    const ref = createRef<AmountInputHandle>();
    const onChange = vi.fn();
    render(
      <AmountInputBase
        aria-label="Amount"
        {...EN}
        ref={ref}
        defaultValue={1_000}
        step={500}
        onChange={onChange}
      />,
    );
    const input = screen.getByRole("spinbutton", { name: "Amount" });

    act(() => {
      ref.current?.step(2);
      // Read before React has re-rendered: the handle must report the value it
      // just committed, not the one it last rendered.
      expect(ref.current?.getValue()).toBe(2_000);
    });
    expect(onChange).toHaveBeenLastCalledWith(2_000);

    act(() => ref.current?.focus());
    expect(input).toHaveFocus();
  });
});
