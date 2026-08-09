import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";

import type { DateTenorParseResult } from "../../utils/dateTenorParse";
import {
  DateTenorPickerBase,
  type DateTenorPickerHandle,
  type DateTenorValue,
} from "./DateTenorPicker";

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
    await user.click(screen.getByLabelText("January 20, 2026"));

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
    expect(input.getAttribute("aria-activedescendant")).toBe(
      screen.getByRole("option", { name: "ON" }).id,
    );

    await user.keyboard("{Enter}");
    expect(onChange.mock.calls[0][0]).toMatchObject({ tenor: "ON" });
  });

  it("scrolls the highlighted tenor into view while arrowing", async () => {
    const user = userEvent.setup();
    const { input } = setup();

    act(() => input.focus());
    await user.keyboard("{ArrowDown}"); // open

    // Focus stays on the input under aria-activedescendant, so the browser
    // never scrolls the tenor grid and the library has to. The popup caps its
    // height with --finra-popup-max-block-size, so anything past the fold is
    // invisible without this.
    const scrolls = screen.getAllByRole("option").map((option) => {
      const spy = vi.fn();
      option.scrollIntoView = spy;
      return spy;
    });

    await user.keyboard("{ArrowDown}"); // highlight the first tenor (ON)
    expect(scrolls[0]).toHaveBeenCalledWith({ block: "nearest" });

    await user.keyboard("{ArrowDown}"); // TN
    expect(scrolls[1]).toHaveBeenCalledWith({ block: "nearest" });

    await user.keyboard("{ArrowUp}"); // back to ON
    expect(scrolls[0]).toHaveBeenCalledTimes(2);
    expect(scrolls[2]).not.toHaveBeenCalled();
  });

  it("opens the tenor list with Ctrl+Space", async () => {
    const user = userEvent.setup();
    const { input } = setup();

    act(() => input.focus());
    await user.keyboard("{Control>} {/Control}");

    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(input.getAttribute("aria-activedescendant")).toBe(
      screen.getByRole("option", { name: "ON" }).id,
    );
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
    await user.click(screen.getByLabelText("April 20, 2026"));
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
    const parser = vi.fn(
      (input: string): DateTenorParseResult =>
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

  it("applies calendar.adjust with the configured convention", async () => {
    const user = userEvent.setup();
    const rolled = new Date(2026, 3, 16);
    const adjust = vi.fn(() => rolled);
    const { onChange, input } = setup({
      calendar: { adjust },
      adjustmentConvention: "following",
    });

    await user.type(input, "3M");
    await user.keyboard("{Enter}");

    // adjust receives the settled preview (3M from REF = 2026-04-15) + convention.
    expect(adjust).toHaveBeenCalledWith(new Date(2026, 3, 15), "following");
    expect(onChange.mock.calls[0][0].date).toEqual(rolled);
  });

  it("does not adjust when convention is 'none' or adjust is absent", async () => {
    const user = userEvent.setup();
    const adjust = vi.fn(() => new Date(2030, 0, 1));
    const { onChange, input } = setup({ calendar: { adjust }, adjustmentConvention: "none" });

    await user.type(input, "3M");
    await user.keyboard("{Enter}");

    expect(adjust).not.toHaveBeenCalled();
    expect(onChange.mock.calls[0][0].date).toEqual(new Date(2026, 3, 15));
  });

  it("tags the committed value with its standard tenor, or null for a broken date", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup({});

    await user.type(input, "3M");
    await user.keyboard("{Enter}");
    expect(onChange.mock.calls[0][0].standardTenor).toBe("3M");

    await user.clear(input);
    await user.type(input, "2027-07-13"); // arbitrary → broken date
    await user.keyboard("{Enter}");
    expect(onChange.mock.calls.at(-1)?.[0]).toMatchObject({ mode: "date", standardTenor: null });
  });

  it("shows the resolved date (custom format) and mode indicator", async () => {
    const user = userEvent.setup();
    const { input } = setup({
      showResolvedDate: true,
      resolvedDateFormat: (d) => `res:${d.getMonth() + 1}`,
      renderModeIndicator: (m) => <span>mode:{m}</span>,
    });

    await user.type(input, "3M");
    await user.keyboard("{Enter}");
    // 3M from REF (15 Jan 2026) = 15 Apr 2026 → month 4.
    expect(screen.getByText("res:4")).toBeInTheDocument();
    expect(screen.getByText("mode:tenor")).toBeInTheDocument();
  });

  it("treats a tenor resolving past maxDate as disabled", async () => {
    const user = userEvent.setup();
    const onInvalid = vi.fn();
    // REF is 15 Jan 2026, so 3M lands 15 Apr - beyond the cap - while 1M does not.
    const { onChange, input } = setup({ maxDate: new Date(2026, 1, 28), onInvalid });

    await user.click(input);
    expect(screen.getByRole("option", { name: "3M" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("option", { name: "1M" })).toBeEnabled();

    await user.type(input, "3M");
    await user.keyboard("{Enter}");
    expect(onInvalid).toHaveBeenCalledWith("disabled-date");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("honours a disabledDates predicate and minDate", async () => {
    const user = userEvent.setup();
    const onInvalid = vi.fn();
    const { onChange, input } = setup({
      minDate: new Date(2026, 0, 1),
      disabledDates: (date) => date.getMonth() === 3,
      onInvalid,
    });

    // 3M lands in April, which the predicate rejects.
    await user.type(input, "3M");
    await user.keyboard("{Enter}");
    expect(onInvalid).toHaveBeenCalledWith("disabled-date");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("rejects a calendar day whose settlement lands on a disabled date", async () => {
    const user = userEvent.setup();
    const onInvalid = vi.fn();
    const { onChange, input } = setup({
      settlementEngine: () => new Date(2030, 0, 1),
      maxDate: new Date(2029, 11, 31),
      onInvalid,
    });

    await user.click(input);
    // The day itself is inside the bounds and clickable; only what it settles
    // to is not. The check has to run after settlement, not before it.
    await user.click(screen.getByLabelText("January 20, 2026"));

    expect(onInvalid).toHaveBeenCalledWith("disabled-date");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("marks the committed tenor as selected, not the merely highlighted one", async () => {
    const user = userEvent.setup();
    const { input } = setup({
      defaultValue: {
        input: "6M",
        display: "6M",
        mode: "tenor",
        tenor: "6M",
        date: new Date(2026, 6, 15),
      },
    });

    act(() => input.focus());
    await user.keyboard("{ArrowDown}"); // open
    await user.keyboard("{ArrowDown}"); // highlight the first option (ON)

    // The highlight is already carried by aria-activedescendant. Reusing
    // aria-selected for it announces an option as chosen when Enter has not
    // been pressed, and leaves the actual value unannounced when the list
    // reopens.
    expect(input.getAttribute("aria-activedescendant")).toBe(
      screen.getByRole("option", { name: "ON" }).id,
    );
    expect(screen.getByRole("option", { name: "ON" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("option", { name: "6M" })).toHaveAttribute("aria-selected", "true");
  });

  it("classes the highlight and the committed tenor independently", async () => {
    const user = userEvent.setup();
    const { input } = setup({
      classNames: { tenor: "t", tenorHighlighted: "t-hi", tenorSelected: "t-sel" },
      defaultValue: {
        input: "ON",
        display: "ON",
        mode: "tenor",
        tenor: "ON",
        date: new Date(2026, 0, 16),
      },
    });

    act(() => input.focus());
    await user.keyboard("{ArrowDown}"); // open
    await user.keyboard("{ArrowDown}"); // highlight ON, which is also committed

    // Both states on one row - a sighted user needs the same two facts the
    // ARIA now carries, and they must not collapse into one look.
    const committed = screen.getByRole("option", { name: "ON" });
    expect(committed).toHaveClass("t", "t-hi", "t-sel");

    await user.keyboard("{ArrowDown}"); // move the highlight off it
    expect(screen.getByRole("option", { name: "ON" })).toHaveClass("t-sel");
    expect(screen.getByRole("option", { name: "ON" })).not.toHaveClass("t-hi");
    expect(screen.getByRole("option", { name: "TN" })).toHaveClass("t-hi");
    expect(screen.getByRole("option", { name: "TN" })).not.toHaveClass("t-sel");
  });

  it("walks the suggestions back up with ArrowUp", async () => {
    const user = userEvent.setup();
    const { input } = setup();

    act(() => input.focus());
    await user.keyboard("{ArrowUp}");
    // ArrowUp does not open - only ArrowDown and Ctrl+Space do.
    expect(input).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{ArrowDown}"); // open
    await user.keyboard("{ArrowDown}"); // ON
    await user.keyboard("{ArrowDown}"); // TN
    expect(input.getAttribute("aria-activedescendant")).toBe(
      screen.getByRole("option", { name: "TN" }).id,
    );

    await user.keyboard("{ArrowUp}");
    expect(input.getAttribute("aria-activedescendant")).toBe(
      screen.getByRole("option", { name: "ON" }).id,
    );
  });

  it("does not commit a disabled suggestion reached by keyboard", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup({ disabledTenors: ["ON"] });

    act(() => input.focus());
    await user.keyboard("{ArrowDown}"); // open
    await user.keyboard("{ArrowDown}"); // highlights ON, which is disabled
    expect(input.getAttribute("aria-activedescendant")).toBe(
      screen.getByRole("option", { name: "ON" }).id,
    );

    await user.keyboard("{Enter}");
    // The pointer route is blocked by the disabled button; roving reaches the
    // row anyway, so the refusal has to live in the selection itself.
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveAttribute("aria-expanded", "true");
  });

  it("roves harmlessly with no suggestions to walk", async () => {
    const ref = createRef<DateTenorPickerHandle>();
    const user = userEvent.setup();
    render(
      <DateTenorPickerBase
        aria-label="Value date"
        referenceDate={REF}
        ref={ref}
        tenorOptions={[]}
      />,
    );
    const input = screen.getByRole("combobox", { name: "Value date" });

    act(() => ref.current?.open());
    act(() => input.focus());
    await user.keyboard("{ArrowDown}");

    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(input).not.toHaveAttribute("aria-activedescendant");
  });

  it("does not commit when focus moves into the popup", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup();

    await user.click(input);
    await user.type(input, "3M");
    // Reaching for a suggestion is not "leaving the field" - the option's own
    // click is what commits, and a blur-commit first would race it.
    fireEvent.blur(input, { relatedTarget: screen.getByRole("option", { name: "6M" }) });

    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveAttribute("aria-expanded", "true");
  });

  it("toggles shut through the adornment it opened with", async () => {
    const user = userEvent.setup();
    const { input } = setup({ renderCalendarIcon: () => <span>cal</span> });
    const toggle = screen.getByRole("button", { name: "Toggle date and tenor picker" });

    await user.click(toggle);
    expect(input).toHaveAttribute("aria-expanded", "true");
    await user.click(toggle);
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("refuses every route into the popup while readOnly", async () => {
    const ref = createRef<DateTenorPickerHandle>();
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DateTenorPickerBase
        aria-label="Value date"
        referenceDate={REF}
        ref={ref}
        onChange={onChange}
        renderCalendarIcon={() => <span>cal</span>}
        readOnly
      />,
    );
    const input = screen.getByRole("combobox", { name: "Value date" });

    // The adornment is not itself disabled while readOnly, so the toggle has to
    // refuse on its own.
    await user.click(screen.getByRole("button", { name: "Toggle date and tenor picker" }));
    expect(input).toHaveAttribute("aria-expanded", "false");

    act(() => ref.current?.open());
    expect(input).toHaveAttribute("aria-expanded", "false");

    // readOnly stops typing, but autofill and IME can still drive a change
    // event, so the handler guards rather than trusting the DOM.
    fireEvent.change(input, { target: { value: "3M" } });
    expect(input).toHaveValue("");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("ignores a programmatic change while disabled", () => {
    const onChange = vi.fn();
    const { input } = setup({ disabled: true, onChange });

    fireEvent.change(input, { target: { value: "3M" } });
    expect(input).toHaveValue("");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("takes a named resolved-date format, or reuses the input format", async () => {
    const user = userEvent.setup();
    const { input, rerender } = setup({ showResolvedDate: true, resolvedDateFormat: "DD/MM/YYYY" });

    await user.type(input, "3M");
    await user.keyboard("{Enter}");
    expect(screen.getByText("15/04/2026")).toBeInTheDocument();

    // Without its own format the resolved date follows `dateFormat`, so the two
    // readings of the same date never disagree on layout.
    rerender(
      <DateTenorPickerBase
        aria-label="Value date"
        referenceDate={REF}
        showResolvedDate
        dateFormat="DD-MM-YYYY"
        defaultValue={{
          input: "3M",
          display: "3M",
          mode: "tenor",
          tenor: "3M",
          date: new Date(2026, 3, 15),
        }}
      />,
    );
    expect(screen.getByText("15-04-2026")).toBeInTheDocument();
  });

  it("announces open and close once each, however often it is asked", async () => {
    const ref = createRef<DateTenorPickerHandle>();
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onClose = vi.fn();
    render(
      <DateTenorPickerBase
        aria-label="Value date"
        referenceDate={REF}
        ref={ref}
        onOpen={onOpen}
        onClose={onClose}
      />,
    );
    const input = screen.getByRole("combobox", { name: "Value date" });

    // Escape on a closed popup is the user's "get me out of here" - it must
    // reach the surrounding dialog or form rather than being swallowed here.
    act(() => input.focus());
    await user.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();

    act(() => ref.current?.open());
    act(() => ref.current?.open());
    expect(onOpen).toHaveBeenCalledTimes(1);

    act(() => ref.current?.close());
    act(() => ref.current?.close());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("falls back to today when no referenceDate is given", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DateTenorPickerBase aria-label="Value date" onChange={onChange} />);
    const input = screen.getByRole("combobox", { name: "Value date" });

    await user.type(input, "3M");
    await user.keyboard("{Enter}");

    // Anchored on the real today, so 3M still resolves and still reads back as
    // the standard tenor it was typed as.
    expect(onChange.mock.calls[0][0]).toMatchObject({ tenor: "3M", standardTenor: "3M" });
  });

  it("renders the broken-date indicator only for broken dates", async () => {
    const user = userEvent.setup();
    const { input } = setup({
      renderBrokenIndicator: (broken) => <span>{broken ? "BROKEN" : "STD"}</span>,
    });

    await user.type(input, "2027-07-13"); // not a standard tenor
    await user.keyboard("{Enter}");
    expect(screen.getByText("BROKEN")).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "2026-04-15"); // == 3M from REF → standard
    await user.keyboard("{Enter}");
    expect(screen.getByText("STD")).toBeInTheDocument();
  });
});

describe("DateTenorPickerBase - display stays tied to the committed value", () => {
  /** A parent that only ever accepts 3M, holding its own value. */
  function Controlled() {
    const [value, setValue] = useState<DateTenorValue | null>(null);
    return (
      <DateTenorPickerBase
        aria-label="Value date"
        referenceDate={REF}
        value={value}
        onChange={(next) => {
          if (next?.tenor !== "3M") return;
          setValue(next);
        }}
      />
    );
  }

  it("redraws the held value when a controlled parent declines a picked tenor", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByRole("combobox", { name: "Value date" });

    await user.click(input);
    await user.click(screen.getByRole("option", { name: "6M" }));

    // The parent kept null. Leaving 6M on screen would report a value date the
    // application never accepted.
    await waitFor(() => expect(input).toHaveValue(""));
  });

  it("redraws the held value when a controlled parent declines typed text", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByRole("combobox", { name: "Value date" });

    await user.type(input, "6M{Enter}");

    await waitFor(() => expect(input).toHaveValue(""));
  });

  it("still shows a value the controlled parent accepts", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByRole("combobox", { name: "Value date" });

    await user.type(input, "3M{Enter}");

    await waitFor(() => expect(input).toHaveValue("3M"));
  });
});
