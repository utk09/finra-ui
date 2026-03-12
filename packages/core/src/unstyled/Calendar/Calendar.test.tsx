import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CalendarBase, getCalendarDays } from "./Calendar";

// Fixed "today" to avoid flaky tests
const TODAY = new Date(2026, 2, 15); // March 15, 2026 (Sunday)

describe("CalendarBase", () => {
  //  Rendering

  it("renders a calendar grid with month/year title", () => {
    render(<CalendarBase today={TODAY} />);
    expect(screen.getByText("March 2026")).toBeInTheDocument();
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("forwards ref to root div", () => {
    const ref = vi.fn();
    render(<CalendarBase ref={ref} today={TODAY} />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });

  it("renders weekday headers for Monday-start (default)", () => {
    render(<CalendarBase today={TODAY} />);
    const columnHeaders = screen.getAllByRole("columnheader");
    expect(columnHeaders).toHaveLength(7);
    expect(columnHeaders[0]).toHaveTextContent("Mo");
    expect(columnHeaders[6]).toHaveTextContent("Su");
    // Check aria-label for full day name
    expect(columnHeaders[0]).toHaveAttribute("aria-label", "Monday");
    expect(columnHeaders[6]).toHaveAttribute("aria-label", "Sunday");
  });

  it("renders weekday headers for Sunday-start", () => {
    render(<CalendarBase today={TODAY} weekStartsOn={0} />);
    const columnHeaders = screen.getAllByRole("columnheader");
    expect(columnHeaders[0]).toHaveTextContent("Su");
    expect(columnHeaders[6]).toHaveTextContent("Sa");
    expect(columnHeaders[0]).toHaveAttribute("aria-label", "Sunday");
    expect(columnHeaders[6]).toHaveAttribute("aria-label", "Saturday");
  });

  it("renders 42 day buttons (6 rows x 7 columns)", () => {
    render(<CalendarBase today={TODAY} />);
    const gridcells = screen.getAllByRole("gridcell");
    expect(gridcells).toHaveLength(42);
  });

  it("renders 7 rows including the weekday header row", () => {
    render(<CalendarBase today={TODAY} />);
    const rows = screen.getAllByRole("row");
    // 1 weekday header row + 6 day rows = 7
    expect(rows).toHaveLength(7);
  });

  //  Value / Selected day

  it("marks the selected day with aria-selected", () => {
    const value = new Date(2026, 2, 20); // March 20
    render(<CalendarBase value={value} today={TODAY} />);
    const selected = screen.getByLabelText("March 20, 2026");
    expect(selected).toHaveAttribute("aria-selected", "true");
  });

  it("does not mark non-selected days with aria-selected", () => {
    const value = new Date(2026, 2, 20);
    render(<CalendarBase value={value} today={TODAY} />);
    const otherDay = screen.getByLabelText("March 19, 2026");
    expect(otherDay).not.toHaveAttribute("aria-selected");
  });

  //  Today override

  it("uses today override for initial month display", () => {
    const customToday = new Date(2025, 0, 10); // Jan 10, 2025
    render(<CalendarBase today={customToday} />);
    expect(screen.getByText("January 2025")).toBeInTheDocument();
  });

  it("shows today's date based on value when provided", () => {
    const value = new Date(2026, 5, 10); // June 10, 2026
    render(<CalendarBase value={value} today={TODAY} />);
    expect(screen.getByText("June 2026")).toBeInTheDocument();
  });

  //  Navigation

  it("navigates to previous month", async () => {
    const user = userEvent.setup();
    render(<CalendarBase today={TODAY} />);
    expect(screen.getByText("March 2026")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Previous month"));
    expect(screen.getByText("February 2026")).toBeInTheDocument();
  });

  it("navigates to next month", async () => {
    const user = userEvent.setup();
    render(<CalendarBase today={TODAY} />);

    await user.click(screen.getByLabelText("Next month"));
    expect(screen.getByText("April 2026")).toBeInTheDocument();
  });

  it("renders default nav icons when renderNavPrev/renderNavNext not provided", () => {
    render(<CalendarBase today={TODAY} />);
    // Default: unicode triangles
    expect(screen.getByLabelText("Previous month")).toHaveTextContent("\u25C0");
    expect(screen.getByLabelText("Next month")).toHaveTextContent("\u25B6");
  });

  it("renders custom nav icons when renderNavPrev/renderNavNext provided", () => {
    render(
      <CalendarBase
        today={TODAY}
        renderNavPrev={() => <span>Prev</span>}
        renderNavNext={() => <span>Next</span>}
      />,
    );
    expect(screen.getByText("Prev")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  //  Controlled month

  it("displays controlled month", () => {
    const month = new Date(2025, 11, 1); // December 2025
    render(<CalendarBase month={month} today={TODAY} />);
    expect(screen.getByText("December 2025")).toBeInTheDocument();
  });

  it("calls onMonthChange when navigating with controlled month", async () => {
    const onMonthChange = vi.fn();
    const user = userEvent.setup();
    const month = new Date(2026, 2, 1);
    render(<CalendarBase month={month} onMonthChange={onMonthChange} today={TODAY} />);

    await user.click(screen.getByLabelText("Next month"));
    expect(onMonthChange).toHaveBeenCalledWith(new Date(2026, 3, 1));
  });

  it("syncs internal month when controlled month changes", () => {
    const { rerender } = render(<CalendarBase month={new Date(2026, 0, 1)} today={TODAY} />);
    expect(screen.getByText("January 2026")).toBeInTheDocument();

    rerender(<CalendarBase month={new Date(2026, 5, 1)} today={TODAY} />);
    expect(screen.getByText("June 2026")).toBeInTheDocument();
  });

  //  Day selection

  it("calls onSelect when clicking an enabled day", () => {
    const onSelect = vi.fn();
    render(<CalendarBase onSelect={onSelect} today={TODAY} />);

    fireEvent.mouseDown(screen.getByLabelText("March 20, 2026"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    const selectedDate = onSelect.mock.calls[0][0] as Date;
    expect(selectedDate.getDate()).toBe(20);
    expect(selectedDate.getMonth()).toBe(2);
  });

  it("does not call onSelect when clicking a disabled day", () => {
    const onSelect = vi.fn();
    // Disable March 20
    render(
      <CalendarBase onSelect={onSelect} today={TODAY} disabledDates={[new Date(2026, 2, 20)]} />,
    );

    fireEvent.mouseDown(screen.getByLabelText("March 20, 2026"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("does not call onSelect when clicking an outside-month day", () => {
    const onSelect = vi.fn();
    // Outside-month days are disabled, so onSelect should not fire
    render(<CalendarBase onSelect={onSelect} today={TODAY} />);

    // First few days in the grid may be from February (outside month)
    // For March 2026 starting Monday, Feb 23 is shown
    const outsideDay = screen.getByLabelText("February 23, 2026");
    fireEvent.mouseDown(outsideDay);
    expect(onSelect).not.toHaveBeenCalled();
  });

  //  Disabled days

  it("disables days before min date", () => {
    const min = new Date(2026, 2, 10); // March 10
    render(<CalendarBase min={min} today={TODAY} />);

    const day5 = screen.getByLabelText("March 5, 2026");
    expect(day5).toBeDisabled();
    expect(day5).toHaveAttribute("aria-disabled", "true");

    const day10 = screen.getByLabelText("March 10, 2026");
    expect(day10).not.toBeDisabled();
  });

  it("disables days after max date", () => {
    const max = new Date(2026, 2, 20); // March 20
    render(<CalendarBase max={max} today={TODAY} />);

    const day25 = screen.getByLabelText("March 25, 2026");
    expect(day25).toBeDisabled();

    const day20 = screen.getByLabelText("March 20, 2026");
    expect(day20).not.toBeDisabled();
  });

  it("disables days from disabledDates array", () => {
    const disabled = [new Date(2026, 2, 12), new Date(2026, 2, 18)];
    render(<CalendarBase disabledDates={disabled} today={TODAY} />);

    expect(screen.getByLabelText("March 12, 2026")).toBeDisabled();
    expect(screen.getByLabelText("March 18, 2026")).toBeDisabled();
    expect(screen.getByLabelText("March 13, 2026")).not.toBeDisabled();
  });

  it("disables days from disabledDates function", () => {
    // Disable weekends
    const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
    render(<CalendarBase disabledDates={isWeekend} today={TODAY} />);

    // March 14 = Saturday, March 15 = Sunday
    expect(screen.getByLabelText("March 14, 2026")).toBeDisabled();
    expect(screen.getByLabelText("March 15, 2026")).toBeDisabled();
    // March 16 = Monday
    expect(screen.getByLabelText("March 16, 2026")).not.toBeDisabled();
  });

  //  Footer

  it("renders footer when provided", () => {
    render(<CalendarBase today={TODAY} footer={<button type="button">Today</button>} />);
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("does not render footer container when footer is not provided", () => {
    render(<CalendarBase today={TODAY} />);
    expect(screen.queryByText("Today")).not.toBeInTheDocument();
  });

  //  Keyboard navigation

  describe("keyboard navigation", () => {
    function getFocusedDay(): HTMLElement {
      const cells = screen.getAllByRole("gridcell");
      return cells.find((el) => el.getAttribute("tabindex") === "0")!;
    }

    it("moves focus right with ArrowRight", () => {
      render(<CalendarBase today={TODAY} />);
      const grid = screen.getByRole("grid");
      grid.focus();

      const focusedBtn = getFocusedDay();
      expect(focusedBtn).toBeTruthy();
      focusedBtn.focus();

      const initialLabel = focusedBtn.getAttribute("aria-label");
      fireEvent.keyDown(grid, { key: "ArrowRight" });

      const newFocused = getFocusedDay();
      expect(newFocused.getAttribute("aria-label")).not.toBe(initialLabel);
    });

    it("moves focus left with ArrowLeft", () => {
      const value = new Date(2026, 2, 18);
      render(<CalendarBase value={value} today={TODAY} />);
      const grid = screen.getByRole("grid");
      grid.focus();
      getFocusedDay().focus();

      fireEvent.keyDown(grid, { key: "ArrowLeft" });

      const newFocused = getFocusedDay();
      expect(newFocused).toHaveAttribute("aria-label", "March 17, 2026");
    });

    it("moves focus down with ArrowDown (7 days)", () => {
      const value = new Date(2026, 2, 10);
      render(<CalendarBase value={value} today={TODAY} />);
      const grid = screen.getByRole("grid");
      grid.focus();
      getFocusedDay().focus();

      fireEvent.keyDown(grid, { key: "ArrowDown" });

      const newFocused = getFocusedDay();
      expect(newFocused).toHaveAttribute("aria-label", "March 17, 2026");
    });

    it("moves focus up with ArrowUp (7 days)", () => {
      const value = new Date(2026, 2, 25);
      render(<CalendarBase value={value} today={TODAY} />);
      const grid = screen.getByRole("grid");
      grid.focus();
      getFocusedDay().focus();

      fireEvent.keyDown(grid, { key: "ArrowUp" });

      const newFocused = getFocusedDay();
      expect(newFocused).toHaveAttribute("aria-label", "March 18, 2026");
    });

    it("selects day on Enter key", () => {
      const onSelect = vi.fn();
      const value = new Date(2026, 2, 15);
      render(<CalendarBase value={value} onSelect={onSelect} today={TODAY} />);
      const grid = screen.getByRole("grid");
      grid.focus();

      fireEvent.keyDown(grid, { key: "Enter" });
      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it("selects day on Space key", () => {
      const onSelect = vi.fn();
      const value = new Date(2026, 2, 15);
      render(<CalendarBase value={value} onSelect={onSelect} today={TODAY} />);
      const grid = screen.getByRole("grid");
      grid.focus();

      fireEvent.keyDown(grid, { key: " " });
      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it("does not select disabled day on Enter", () => {
      const onSelect = vi.fn();
      // Select a disabled day (March 10 is disabled via min)
      render(<CalendarBase onSelect={onSelect} min={new Date(2026, 2, 16)} today={TODAY} />);
      const grid = screen.getByRole("grid");
      grid.focus();

      // Focused index defaults to today (March 15) which is before min, so disabled
      fireEvent.keyDown(grid, { key: "Enter" });
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("navigates to next month with PageDown", () => {
      render(<CalendarBase today={TODAY} />);
      const grid = screen.getByRole("grid");
      grid.focus();

      fireEvent.keyDown(grid, { key: "PageDown" });
      expect(screen.getByText("April 2026")).toBeInTheDocument();
    });

    it("navigates to previous month with PageUp", () => {
      render(<CalendarBase today={TODAY} />);
      const grid = screen.getByRole("grid");
      grid.focus();

      fireEvent.keyDown(grid, { key: "PageUp" });
      expect(screen.getByText("February 2026")).toBeInTheDocument();
    });

    it("navigates to previous month when ArrowUp goes past start of grid", () => {
      // March 2026 (Monday start): March 1 is a Sunday, so it's at index 6.
      // ArrowUp from index 6 goes to 6-7 = -1, triggering goToPrevMonth.
      const value = new Date(2026, 2, 1);
      render(<CalendarBase value={value} today={TODAY} />);
      const grid = screen.getByRole("grid");
      grid.focus();

      fireEvent.keyDown(grid, { key: "ArrowUp" });
      expect(screen.getByText("February 2026")).toBeInTheDocument();
    });

    it("navigates to next month when ArrowDown goes past end of grid", () => {
      // Value at the end of the month, in the last row
      const value = new Date(2026, 2, 31);
      render(<CalendarBase value={value} today={TODAY} />);
      const grid = screen.getByRole("grid");
      grid.focus();

      // ArrowDown from the last row should go past index 42
      fireEvent.keyDown(grid, { key: "ArrowDown" });
      expect(screen.getByText("April 2026")).toBeInTheDocument();
    });

    it("navigates to next month when ArrowRight goes past end of grid", () => {
      const value = new Date(2026, 2, 31);
      render(<CalendarBase value={value} today={TODAY} />);
      const grid = screen.getByRole("grid");
      grid.focus();

      // Press ArrowRight enough times from March 31 to go past index 41
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(grid, { key: "ArrowRight" });
      }
      expect(screen.getByText("April 2026")).toBeInTheDocument();
    });

    it("ignores unhandled keys", () => {
      render(<CalendarBase today={TODAY} />);
      const grid = screen.getByRole("grid");
      grid.focus();

      // Pressing an unhandled key should not change anything
      const title = screen.getByText("March 2026");
      fireEvent.keyDown(grid, { key: "a" });
      expect(title).toBeInTheDocument();
    });
  });

  //  Focus management

  it("focuses selected day when grid has focus", () => {
    const value = new Date(2026, 2, 20);
    render(<CalendarBase value={value} today={TODAY} />);
    const grid = screen.getByRole("grid");

    // Focus the grid — the selected day button should receive focus
    grid.focus();
    const selectedBtn = screen.getByLabelText("March 20, 2026");
    // The button with the selected day should have tabindex=0
    expect(selectedBtn).toHaveAttribute("tabindex", "0");
  });

  it("focuses today when no value is selected", () => {
    render(<CalendarBase today={TODAY} />);
    const grid = screen.getByRole("grid");
    grid.focus();

    const todayBtn = screen.getByLabelText("March 15, 2026");
    expect(todayBtn).toHaveAttribute("tabindex", "0");
  });

  it("focuses first day of month when no value and today is not in month", () => {
    // Navigate to a month that doesn't contain today
    const month = new Date(2026, 5, 1); // June 2026
    render(<CalendarBase month={month} today={TODAY} />);
    const grid = screen.getByRole("grid");
    grid.focus();

    const firstDayBtn = screen.getByLabelText("June 1, 2026");
    expect(firstDayBtn).toHaveAttribute("tabindex", "0");
  });

  //  classNames prop

  it("applies classNames to elements", () => {
    const classNames = {
      root: "custom-root",
      header: "custom-header",
      navButton: "custom-nav",
      title: "custom-title",
      grid: "custom-grid",
      row: "custom-row",
      day: "custom-day",
      footer: "custom-footer",
    };
    render(<CalendarBase today={TODAY} classNames={classNames} footer={<span>Footer</span>} />);
    const grid = screen.getByRole("grid");
    expect(grid).toHaveClass("custom-grid");
  });

  //  aria-label on grid

  it("has aria-label on grid matching month/year", () => {
    render(<CalendarBase today={TODAY} />);
    expect(screen.getByRole("grid")).toHaveAttribute("aria-label", "March 2026");
  });

  //  aria-live on title

  it("has aria-live on month/year title", () => {
    render(<CalendarBase today={TODAY} />);
    expect(screen.getByText("March 2026")).toHaveAttribute("aria-live", "polite");
  });
});

//  getCalendarDays helper

describe("getCalendarDays", () => {
  const today = new Date(2026, 2, 15);

  it("returns 42 days", () => {
    const days = getCalendarDays(2026, 2, 1, null, today);
    expect(days).toHaveLength(42);
  });

  it("marks current month days correctly", () => {
    const days = getCalendarDays(2026, 2, 1, null, today);
    const marchDays = days.filter((d) => d.isCurrentMonth);
    expect(marchDays).toHaveLength(31); // March has 31 days
  });

  it("marks today correctly", () => {
    const days = getCalendarDays(2026, 2, 1, null, today);
    const todayDay = days.find((d) => d.isToday && d.isCurrentMonth);
    expect(todayDay).toBeDefined();
    expect(todayDay!.date.getDate()).toBe(15);
  });

  it("marks selected day correctly", () => {
    const value = new Date(2026, 2, 20);
    const days = getCalendarDays(2026, 2, 1, value, today);
    const selected = days.find((d) => d.isSelected);
    expect(selected).toBeDefined();
    expect(selected!.date.getDate()).toBe(20);
  });

  it("marks outside-month days as disabled", () => {
    const days = getCalendarDays(2026, 2, 1, null, today);
    const outsideDays = days.filter((d) => !d.isCurrentMonth);
    outsideDays.forEach((d) => {
      expect(d.isDisabled).toBe(true);
    });
  });

  it("marks days before min as disabled", () => {
    const min = new Date(2026, 2, 10);
    const days = getCalendarDays(2026, 2, 1, null, today, min);
    const march5 = days.find((d) => d.isCurrentMonth && d.date.getDate() === 5);
    expect(march5!.isDisabled).toBe(true);
    const march10 = days.find((d) => d.isCurrentMonth && d.date.getDate() === 10);
    expect(march10!.isDisabled).toBe(false);
  });

  it("marks days after max as disabled", () => {
    const max = new Date(2026, 2, 20);
    const days = getCalendarDays(2026, 2, 1, null, today, undefined, max);
    const march25 = days.find((d) => d.isCurrentMonth && d.date.getDate() === 25);
    expect(march25!.isDisabled).toBe(true);
    const march20 = days.find((d) => d.isCurrentMonth && d.date.getDate() === 20);
    expect(march20!.isDisabled).toBe(false);
  });

  it("marks days in disabledDates array as disabled", () => {
    const disabled = [new Date(2026, 2, 12)];
    const days = getCalendarDays(2026, 2, 1, null, today, undefined, undefined, disabled);
    const march12 = days.find((d) => d.isCurrentMonth && d.date.getDate() === 12);
    expect(march12!.isDisabled).toBe(true);
  });

  it("marks days from disabledDates function as disabled", () => {
    const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
    const days = getCalendarDays(2026, 2, 1, null, today, undefined, undefined, isWeekend);
    // March 14 = Saturday
    const march14 = days.find((d) => d.isCurrentMonth && d.date.getDate() === 14);
    expect(march14!.isDisabled).toBe(true);
    // March 16 = Monday
    const march16 = days.find((d) => d.isCurrentMonth && d.date.getDate() === 16);
    expect(march16!.isDisabled).toBe(false);
  });

  it("handles weekStartsOn=0 (Sunday)", () => {
    const days = getCalendarDays(2026, 2, 0, null, today);
    // With Sunday start, the first day of the grid is March 1 (Sunday)
    // Actually, March 1, 2026 is a Sunday, so the first day in the grid IS March 1
    expect(days[0].date.getDate()).toBe(1);
    expect(days[0].date.getMonth()).toBe(2); // March
  });

  it("handles value=null", () => {
    const days = getCalendarDays(2026, 2, 1, null, today);
    const selected = days.filter((d) => d.isSelected);
    expect(selected).toHaveLength(0);
  });

  it("handles value=undefined", () => {
    const days = getCalendarDays(2026, 2, 1, undefined, today);
    const selected = days.filter((d) => d.isSelected);
    expect(selected).toHaveLength(0);
  });

  it("both min and max provided", () => {
    const min = new Date(2026, 2, 10);
    const max = new Date(2026, 2, 20);
    const days = getCalendarDays(2026, 2, 1, null, today, min, max);
    const march5 = days.find((d) => d.isCurrentMonth && d.date.getDate() === 5);
    expect(march5!.isDisabled).toBe(true);
    const march25 = days.find((d) => d.isCurrentMonth && d.date.getDate() === 25);
    expect(march25!.isDisabled).toBe(true);
    const march15 = days.find((d) => d.isCurrentMonth && d.date.getDate() === 15);
    expect(march15!.isDisabled).toBe(false);
  });
});
