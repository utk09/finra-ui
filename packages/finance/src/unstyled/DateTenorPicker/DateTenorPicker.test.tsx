import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import type { DateTenorParseResult } from "../../utils/dateTenorParse";
import { DateTenorPickerBase, type DateTenorPickerHandle } from "./DateTenorPicker";

// Deterministic "today": Thu 15 Jan 2026.
const REF = new Date(2026, 0, 15);

function iso(date: Date | null | undefined): string | null {
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function setup(props: React.ComponentProps<typeof DateTenorPickerBase> = {}) {
  const onChange = vi.fn();
  const utils = render(
    <DateTenorPickerBase
      aria-label="Value date"
      referenceDate={REF}
      onChange={onChange}
      {...props}
    />,
  );
  const input = screen.getByRole("combobox", { name: "Value date" });
  return { onChange, input, ...utils };
}

describe("DateTenorPickerBase", () => {
  it("renders a combobox with a placeholder", () => {
    setup();
    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).toHaveAttribute("placeholder");
  });

  it("commits a typed tenor on Enter", async () => {
    const user = userEvent.setup();
    const onParse = vi.fn();
    const { onChange, input } = setup({ onParse });

    await user.type(input, "3m");
    await user.keyboard("{Enter}");

    expect(onParse).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledTimes(1);
    const value = onChange.mock.calls[0][0];
    expect(value).toMatchObject({ mode: "tenor", tenor: "3M", display: "3M", input: "3m" });
    expect(iso(value.date)).toBe("2026-04-15");
    // Input normalises to the canonical display.
    expect(input).toHaveValue("3M");
  });

  it("commits a spot-relative expression", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup();

    await user.type(input, "Spot + 3M");
    await user.keyboard("{Enter}");

    const value = onChange.mock.calls[0][0];
    expect(value).toMatchObject({ mode: "spot-relative", tenor: "3M", display: "Spot + 3M" });
    expect(iso(value.date)).toBe("2026-04-15");
  });

  it("commits a calendar date via day click", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup();

    await user.click(input); // opens popup
    await user.click(screen.getByRole("gridcell", { name: "January 20, 2026" }));

    const value = onChange.mock.calls[0][0];
    expect(value).toMatchObject({ mode: "date" });
    expect(iso(value.date)).toBe("2026-01-20");
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("rejects unrecognised input via onInvalid without committing", async () => {
    const user = userEvent.setup();
    const onInvalid = vi.fn();
    const { onChange, input } = setup({ onInvalid });

    await user.type(input, "wat");
    await user.keyboard("{Enter}");

    expect(onInvalid).toHaveBeenCalledWith("unrecognized");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clears to null when focus leaves the field empty", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <>
        <DateTenorPickerBase aria-label="Value date" referenceDate={REF} onChange={onChange} />
        <button type="button">outside</button>
      </>,
    );
    const input = screen.getByRole("combobox");

    act(() => input.focus());
    await user.click(screen.getByRole("button", { name: "outside" }));

    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("opens on ArrowDown and closes on Escape (onOpen/onClose)", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onClose = vi.fn();
    const { input } = setup({ onOpen, onClose });

    act(() => input.focus());
    await user.keyboard("{ArrowDown}");
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("option", { name: "3M" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("selects a tenor suggestion by click", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup();

    await user.click(input);
    await user.click(screen.getByRole("option", { name: "6M" }));

    expect(onChange.mock.calls[0][0]).toMatchObject({ mode: "tenor", tenor: "6M" });
    expect(input).toHaveValue("6M");
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("navigates suggestions with arrows and commits the highlighted one on Enter", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup();

    act(() => input.focus());
    await user.keyboard("{ArrowDown}"); // open
    await user.keyboard("{ArrowDown}"); // highlight first option (ON)
    expect(screen.getByRole("option", { name: "ON" })).toHaveAttribute("aria-selected", "true");
    expect(input).toHaveAttribute("aria-activedescendant");

    await user.keyboard("{Enter}");
    expect(onChange.mock.calls[0][0]).toMatchObject({ tenor: "ON" });
  });

  it("opens the tenor list with Ctrl+Space", async () => {
    const user = userEvent.setup();
    const { input } = setup();

    act(() => input.focus());
    await user.keyboard("{Control>} {/Control}");

    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("option", { name: "ON" })).toHaveAttribute("aria-selected", "true");
  });

  it("fires onModeChange when the committed mode changes", async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    const { input } = setup({ onModeChange });

    await user.type(input, "3M");
    await user.keyboard("{Enter}");
    expect(onModeChange).toHaveBeenLastCalledWith("tenor");

    // The committed 3M lands in April, so the calendar reopens on April.
    await user.click(input);
    await user.click(screen.getByRole("gridcell", { name: "April 20, 2026" }));
    expect(onModeChange).toHaveBeenLastCalledWith("date");
  });

  it("applies the settlementEngine to the committed date", async () => {
    const user = userEvent.setup();
    const engine = vi.fn(() => new Date(2030, 0, 1));
    const { onChange, input } = setup({ settlementEngine: engine });

    await user.type(input, "3M");
    await user.keyboard("{Enter}");

    expect(engine).toHaveBeenCalled();
    expect(iso(onChange.mock.calls[0][0].date)).toBe("2030-01-01");
  });

  it("rejects when the settlementEngine returns null", async () => {
    const user = userEvent.setup();
    const onInvalid = vi.fn();
    const { onChange, input } = setup({ settlementEngine: () => null, onInvalid });

    await user.type(input, "3M");
    await user.keyboard("{Enter}");

    expect(onInvalid).toHaveBeenCalledWith("no-settlement");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables tenor suggestions listed in disabledTenors and rejects committing them", async () => {
    const user = userEvent.setup();
    const onInvalid = vi.fn();
    const { onChange, input } = setup({ disabledTenors: ["3M"], onInvalid });

    await user.click(input);
    const option = screen.getByRole("option", { name: "3M" });
    expect(option).toHaveAttribute("aria-disabled", "true");
    expect(option).toBeDisabled();

    await user.clear(input);
    await user.type(input, "3M");
    await user.keyboard("{Enter}");
    expect(onInvalid).toHaveBeenCalledWith("disabled-tenor");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("treats non-business days as disabled", async () => {
    const user = userEvent.setup();
    const onInvalid = vi.fn();
    const { onChange, input } = setup({
      calendar: { isBusinessDay: () => false },
      onInvalid,
    });

    await user.type(input, "3M");
    await user.keyboard("{Enter}");
    expect(onInvalid).toHaveBeenCalledWith("disabled-date");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("supports a replaceable parser (and falls back when it omits display/error)", async () => {
    const user = userEvent.setup();
    const parser = vi.fn((input: string): DateTenorParseResult =>
      input === "XX"
        ? { valid: true, mode: "tenor", date: new Date(2027, 5, 1), tenor: "XX", display: null }
        : { valid: false, mode: null, date: null, tenor: null, display: null },
    );
    const onInvalid = vi.fn();
    const { onChange, input } = setup({ parser, onInvalid });

    await user.type(input, "XX");
    await user.keyboard("{Enter}");
    // display was null → falls back to the raw input.
    expect(onChange.mock.calls[0][0]).toMatchObject({ tenor: "XX", display: "XX" });

    await user.clear(input);
    await user.type(input, "zz");
    await user.keyboard("{Enter}");
    // error was omitted → defaults to "unrecognized".
    expect(onInvalid).toHaveBeenLastCalledWith("unrecognized");
  });

  it("renders a controlled value's display and does not manage its own text", () => {
    const value = {
      input: "3M",
      display: "3M",
      mode: "tenor" as const,
      tenor: "3M",
      date: new Date(2026, 3, 15),
    };
    setup({ value });
    expect(screen.getByRole("combobox")).toHaveValue("3M");
  });

  it("initialises from defaultValue (uncontrolled)", () => {
    setup({
      defaultValue: {
        input: "6M",
        display: "6M",
        mode: "tenor",
        tenor: "6M",
        date: new Date(2026, 6, 15),
      },
    });
    expect(screen.getByRole("combobox")).toHaveValue("6M");
  });

  it("is inert when disabled", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup({ disabled: true });
    expect(input).toBeDisabled();
    await user.click(input);
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not open or accept input when readOnly", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup({ readOnly: true });

    act(() => input.focus());
    await user.keyboard("{ArrowDown}"); // keydown guard → no open
    expect(input).toHaveAttribute("aria-expanded", "false");

    await user.click(input); // onClick guard → no open
    expect(input).toHaveAttribute("aria-expanded", "false");

    await user.type(input, "3M"); // change guard → no value
    expect(input).toHaveValue("");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("exposes an imperative handle (focus/open/close/clear/getValue)", async () => {
    const ref = createRef<DateTenorPickerHandle>();
    const onChange = vi.fn();
    render(
      <DateTenorPickerBase
        aria-label="Value date"
        referenceDate={REF}
        ref={ref}
        onChange={onChange}
      />,
    );
    const input = screen.getByRole("combobox");

    act(() => ref.current?.focus());
    expect(input).toHaveFocus();

    act(() => ref.current?.open());
    expect(input).toHaveAttribute("aria-expanded", "true");

    act(() => ref.current?.close());
    expect(input).toHaveAttribute("aria-expanded", "false");

    expect(ref.current?.getValue()).toBeNull();
    act(() => ref.current?.clear());
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("renders optional adornment + indicator and toggles via them", async () => {
    const user = userEvent.setup();
    const { input } = setup({
      renderCalendarIcon: () => <span>cal</span>,
      renderIndicator: (open) => <span>{open ? "▲" : "▼"}</span>,
      tenorSectionTitle: "",
    });

    await user.click(screen.getByRole("button", { name: "Toggle date and tenor picker" }));
    expect(input).toHaveAttribute("aria-expanded", "true");
  });
});
