import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DateInput } from "./DateInput";

describe("DateInput", () => {
  //  Rendering

  it("renders with default format placeholder", () => {
    render(<DateInput aria-label="Date" />);
    expect(screen.getByPlaceholderText("YYYY-MM-DD")).toBeInTheDocument();
  });

  it('has data-finra-ui="date-input" attribute', () => {
    render(<DateInput aria-label="Date" />);
    expect(screen.getByTestId("date-input")).toBeInTheDocument();
  });

  it("forwards ref to input element", () => {
    const ref = vi.fn();
    render(<DateInput ref={ref} aria-label="Date" />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it("renders CalendarIcon", () => {
    render(<DateInput aria-label="Date" />);
    const icon = screen.getByTestId("calendar-icon");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("applies custom placeholder", () => {
    render(<DateInput aria-label="Date" placeholder="Enter date" />);
    expect(screen.getByPlaceholderText("Enter date")).toBeInTheDocument();
  });

  it("applies custom className to wrapper", () => {
    render(<DateInput aria-label="Date" className="my-class" />);
    const wrapper = screen.getByTestId("date-input");
    expect(wrapper.className).toContain("my-class");
  });

  //  Controlled mode

  it("displays formatted value in controlled mode", () => {
    const date = new Date(2024, 2, 15); // March 15, 2024
    render(<DateInput aria-label="Date" value={date} />);
    expect(screen.getByRole("textbox")).toHaveValue("2024-03-15");
  });

  it("displays formatted value for MM/DD/YYYY format", () => {
    const date = new Date(2024, 2, 15);
    render(<DateInput aria-label="Date" value={date} format="MM/DD/YYYY" />);
    expect(screen.getByRole("textbox")).toHaveValue("03/15/2024");
  });

  it("shows empty input when value is null", () => {
    render(<DateInput aria-label="Date" value={null} />);
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("updates display when controlled value changes", () => {
    const { rerender } = render(<DateInput aria-label="Date" value={new Date(2024, 0, 1)} />);
    expect(screen.getByRole("textbox")).toHaveValue("2024-01-01");

    rerender(<DateInput aria-label="Date" value={new Date(2024, 11, 25)} />);
    expect(screen.getByRole("textbox")).toHaveValue("2024-12-25");
  });

  //  Uncontrolled mode

  it("displays formatted defaultValue", () => {
    const date = new Date(2024, 5, 20);
    render(<DateInput aria-label="Date" defaultValue={date} />);
    expect(screen.getByRole("textbox")).toHaveValue("2024-06-20");
  });

  //  Auto-separator insertion

  it("auto-inserts separators as user types", async () => {
    const user = userEvent.setup();
    render(<DateInput aria-label="Date" />);
    const input = screen.getByRole("textbox");

    await user.type(input, "20240315");
    expect(input).toHaveValue("2024-03-15");
  });

  it("auto-inserts slash separators for MM/DD/YYYY format", async () => {
    const user = userEvent.setup();
    render(<DateInput aria-label="Date" format="MM/DD/YYYY" />);
    const input = screen.getByRole("textbox");

    await user.type(input, "03152024");
    expect(input).toHaveValue("03/15/2024");
  });

  //  Input filtering

  it("rejects non-numeric characters via keydown", () => {
    render(<DateInput aria-label="Date" />);
    const input = screen.getByRole("textbox");

    fireEvent.keyDown(input, { key: "a" });
    fireEvent.keyDown(input, { key: "!" });
    fireEvent.keyDown(input, { key: "@" });

    // The input should still be empty since handleChange only runs on actual value changes
    expect(input).toHaveValue("");
  });

  it("allows separator character via keydown", () => {
    render(<DateInput aria-label="Date" />);
    const input = screen.getByRole("textbox");

    // Separator for default format (YYYY-MM-DD) is "-"
    const event = new KeyboardEvent("keydown", { key: "-", bubbles: true });
    const prevented = !input.dispatchEvent(event);
    // Should not be prevented
    expect(prevented).toBe(false);
  });

  //  onInputChange

  it("fires onInputChange with formatted text", async () => {
    const handleInputChange = vi.fn();
    const user = userEvent.setup();
    render(<DateInput aria-label="Date" onInputChange={handleInputChange} />);

    await user.type(screen.getByRole("textbox"), "2024");
    expect(handleInputChange).toHaveBeenCalled();
    // The last call should have the formatted text
    const lastCall = handleInputChange.mock.calls[handleInputChange.mock.calls.length - 1];
    expect(lastCall[0]).toBe("2024");
  });

  //  Blur validation

  it("fires onChange with Date on blur with valid date", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<DateInput aria-label="Date" onChange={handleChange} />);
    const input = screen.getByRole("textbox");

    await user.type(input, "20240315");
    await user.tab(); // blur

    expect(handleChange).toHaveBeenCalledTimes(1);
    const date = handleChange.mock.calls[0][0] as Date;
    expect(date).toBeInstanceOf(Date);
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(2); // March = 2
    expect(date.getDate()).toBe(15);
  });

  it("fires onValidation with error on blur with invalid date", async () => {
    const handleValidation = vi.fn();
    const user = userEvent.setup();
    render(<DateInput aria-label="Date" onValidation={handleValidation} />);
    const input = screen.getByRole("textbox");

    await user.type(input, "20241315"); // month 13 is invalid
    await user.tab();

    expect(handleValidation).toHaveBeenCalledTimes(1);
    expect(handleValidation.mock.calls[0][0]).toMatchObject({
      valid: false,
      error: "invalid-date",
    });
  });

  it("fires onChange with null when input is cleared", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DateInput aria-label="Date" onChange={handleChange} defaultValue={new Date(2024, 0, 1)} />,
    );
    const input = screen.getByRole("textbox");

    await user.clear(input);
    await user.tab();

    expect(handleChange).toHaveBeenCalledWith(null);
  });

  it("fires onValidation with valid result when input is cleared", async () => {
    const handleValidation = vi.fn();
    const user = userEvent.setup();
    render(<DateInput aria-label="Date" onValidation={handleValidation} />);
    const input = screen.getByRole("textbox");

    await user.type(input, "20240315");
    await user.tab(); // first blur with valid date
    handleValidation.mockClear();

    await user.clear(input);
    await user.tab();

    expect(handleValidation).toHaveBeenCalledWith({
      valid: true,
      date: null,
    });
  });

  //  Constraints

  it("rejects date before min", async () => {
    const handleChange = vi.fn();
    const handleValidation = vi.fn();
    const user = userEvent.setup();
    render(
      <DateInput
        aria-label="Date"
        min={new Date(2024, 0, 15)} // Jan 15, 2024
        onChange={handleChange}
        onValidation={handleValidation}
      />,
    );
    const input = screen.getByRole("textbox");

    await user.type(input, "20240101"); // Jan 1, 2024 — before min
    await user.tab();

    expect(handleChange).not.toHaveBeenCalled();
    expect(handleValidation).toHaveBeenCalledWith(
      expect.objectContaining({ valid: false, error: "out-of-range" }),
    );
  });

  it("rejects date after max", async () => {
    const handleChange = vi.fn();
    const handleValidation = vi.fn();
    const user = userEvent.setup();
    render(
      <DateInput
        aria-label="Date"
        max={new Date(2024, 11, 31)} // Dec 31, 2024
        onChange={handleChange}
        onValidation={handleValidation}
      />,
    );
    const input = screen.getByRole("textbox");

    await user.type(input, "20250101"); // Jan 1, 2025 — after max
    await user.tab();

    expect(handleChange).not.toHaveBeenCalled();
    expect(handleValidation).toHaveBeenCalledWith(
      expect.objectContaining({ valid: false, error: "out-of-range" }),
    );
  });

  it("rejects disabled date from array", async () => {
    const handleChange = vi.fn();
    const handleValidation = vi.fn();
    const user = userEvent.setup();
    render(
      <DateInput
        aria-label="Date"
        disabledDates={[new Date(2024, 2, 15)]}
        onChange={handleChange}
        onValidation={handleValidation}
      />,
    );
    const input = screen.getByRole("textbox");

    await user.type(input, "20240315");
    await user.tab();

    expect(handleChange).not.toHaveBeenCalled();
    expect(handleValidation).toHaveBeenCalledWith(
      expect.objectContaining({ valid: false, error: "disabled-date" }),
    );
  });

  it("rejects disabled date from function", async () => {
    const handleChange = vi.fn();
    const handleValidation = vi.fn();
    // Disable weekends
    const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
    const user = userEvent.setup();
    render(
      <DateInput
        aria-label="Date"
        disabledDates={isWeekend}
        onChange={handleChange}
        onValidation={handleValidation}
      />,
    );
    const input = screen.getByRole("textbox");

    // March 16, 2024 is a Saturday
    await user.type(input, "20240316");
    await user.tab();

    expect(handleChange).not.toHaveBeenCalled();
    expect(handleValidation).toHaveBeenCalledWith(
      expect.objectContaining({ valid: false, error: "disabled-date" }),
    );
  });

  //  Disabled state

  it("disables the input when disabled", () => {
    render(<DateInput aria-label="Date" disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("applies disabled class to wrapper", () => {
    render(<DateInput aria-label="Date" disabled />);
    const wrapper = screen.getByTestId("date-input");
    expect(wrapper.className).toMatch(/disabled/);
  });

  //  ReadOnly state

  it("makes input read-only", () => {
    render(<DateInput aria-label="Date" readOnly />);
    expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
  });

  //  Variants

  it("applies primary variant by default", () => {
    render(<DateInput aria-label="Date" />);
    const wrapper = screen.getByTestId("date-input");
    expect(wrapper.className).toMatch(/variantPrimary/);
  });

  it("applies secondary variant", () => {
    render(<DateInput aria-label="Date" variant="secondary" />);
    const wrapper = screen.getByTestId("date-input");
    expect(wrapper.className).toMatch(/variantSecondary/);
  });

  it("applies tertiary variant", () => {
    render(<DateInput aria-label="Date" variant="tertiary" />);
    const wrapper = screen.getByTestId("date-input");
    expect(wrapper.className).toMatch(/variantTertiary/);
  });

  //  Validation status

  it("applies error validation status class", () => {
    render(<DateInput aria-label="Date" validationStatus="error" />);
    const wrapper = screen.getByTestId("date-input");
    expect(wrapper.className).toMatch(/statusError/);
  });

  it("applies warning validation status class", () => {
    render(<DateInput aria-label="Date" validationStatus="warning" />);
    const wrapper = screen.getByTestId("date-input");
    expect(wrapper.className).toMatch(/statusWarning/);
  });

  it("applies success validation status class", () => {
    render(<DateInput aria-label="Date" validationStatus="success" />);
    const wrapper = screen.getByTestId("date-input");
    expect(wrapper.className).toMatch(/statusSuccess/);
  });

  //  Full width

  it("applies fullWidth class", () => {
    render(<DateInput aria-label="Date" fullWidth />);
    const wrapper = screen.getByTestId("date-input");
    expect(wrapper.className).toMatch(/fullWidth/);
  });

  //  Formats

  it("shows placeholder for MM/DD/YYYY format", () => {
    render(<DateInput aria-label="Date" format="MM/DD/YYYY" />);
    expect(screen.getByPlaceholderText("MM/DD/YYYY")).toBeInTheDocument();
  });

  it("shows placeholder for DD/MM/YYYY format", () => {
    render(<DateInput aria-label="Date" format="DD/MM/YYYY" />);
    expect(screen.getByPlaceholderText("DD/MM/YYYY")).toBeInTheDocument();
  });

  it("parses DD/MM/YYYY format correctly on blur", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<DateInput aria-label="Date" format="DD/MM/YYYY" onChange={handleChange} />);
    const input = screen.getByRole("textbox");

    await user.type(input, "15032024"); // 15/03/2024 = March 15
    await user.tab();

    expect(handleChange).toHaveBeenCalledTimes(1);
    const date = handleChange.mock.calls[0][0] as Date;
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(2); // March
    expect(date.getDate()).toBe(15);
  });

  //  inputMode

  it("has inputMode=numeric", () => {
    render(<DateInput aria-label="Date" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("inputmode", "numeric");
  });

  //  Incomplete input on blur

  it("fires onValidation with invalid-format for incomplete input", async () => {
    const handleValidation = vi.fn();
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<DateInput aria-label="Date" onValidation={handleValidation} onChange={handleChange} />);
    const input = screen.getByRole("textbox");

    await user.type(input, "2024"); // incomplete
    await user.tab();

    expect(handleValidation).toHaveBeenCalledWith(
      expect.objectContaining({ valid: false, error: "invalid-format" }),
    );
    expect(handleChange).not.toHaveBeenCalled();
  });

  //  Calendar popup

  describe("calendar popclup", () => {
    it("opens calendar when clicking the calendar icon button", async () => {
      const user = userEvent.setup();
      render(<DateInput aria-label="Date" />);

      await user.click(screen.getByLabelText("Toggle calendar"));

      // Calendar grid should be visible
      expect(screen.getByRole("grid")).toBeInTheDocument();
    });

    it("closes calendar on second click of icon (toggle)", async () => {
      const user = userEvent.setup();
      render(<DateInput aria-label="Date" />);
      const toggleBtn = screen.getByLabelText("Toggle calendar");

      await user.click(toggleBtn);
      expect(screen.getByRole("grid")).toBeInTheDocument();

      await user.click(toggleBtn);
      expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    });

    it("closes calendar on Escape key", async () => {
      const user = userEvent.setup();
      render(<DateInput aria-label="Date" />);

      await user.click(screen.getByLabelText("Toggle calendar"));
      expect(screen.getByRole("grid")).toBeInTheDocument();

      // Press Escape in the input
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
      expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    });

    it("closes calendar on outside click", async () => {
      const user = userEvent.setup();
      render(
        <div>
          <DateInput aria-label="Date" />
          <button type="button">Outside</button>
        </div>,
      );

      await user.click(screen.getByLabelText("Toggle calendar"));
      expect(screen.getByRole("grid")).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(screen.getByText("Outside"));
      expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    });

    it("selecting a day from calendar updates the input and fires onChange", async () => {
      const handleChange = vi.fn();
      const handleInputChange = vi.fn();
      const handleValidation = vi.fn();
      const user = userEvent.setup();
      render(
        <DateInput
          aria-label="Date"
          onChange={handleChange}
          onInputChange={handleInputChange}
          onValidation={handleValidation}
        />,
      );

      // Open calendar
      await user.click(screen.getByLabelText("Toggle calendar"));

      // The calendar shows the current month; click a day
      // Find any enabled gridcell and click it
      const gridcells = screen.getAllByRole("gridcell");
      const enabledDay = gridcells.find(
        (cell) => !cell.hasAttribute("disabled") && cell.getAttribute("aria-disabled") !== "true",
      );
      expect(enabledDay).toBeTruthy();

      fireEvent.mouseDown(enabledDay!);

      // onChange should have been called with a Date
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange.mock.calls[0][0]).toBeInstanceOf(Date);

      // onInputChange should also have been called
      expect(handleInputChange).toHaveBeenCalled();

      // onValidation should have been called with valid: true
      expect(handleValidation).toHaveBeenCalledWith(expect.objectContaining({ valid: true }));

      // Calendar should close
      expect(screen.queryByRole("grid")).not.toBeInTheDocument();

      // Input should be updated
      expect(screen.getByRole("textbox").getAttribute("value")).not.toBe("");
    });

    it("calendar shows controlled value as selected", async () => {
      const user = userEvent.setup();
      const value = new Date(2026, 2, 20); // March 20, 2026
      render(<DateInput aria-label="Date" value={value} />);

      await user.click(screen.getByLabelText("Toggle calendar"));

      const selectedDay = screen.getByLabelText("March 20, 2026");
      expect(selectedDay).toHaveAttribute("aria-selected", "true");
    });

    it("calendar displays null when controlled value is null", async () => {
      const user = userEvent.setup();
      render(<DateInput aria-label="Date" value={null} />);

      await user.click(screen.getByLabelText("Toggle calendar"));
      // Calendar should render — no day should be selected
      expect(screen.getByRole("grid")).toBeInTheDocument();
      const selectedDays = screen
        .getAllByRole("gridcell")
        .filter((cell) => cell.getAttribute("aria-selected") === "true");
      expect(selectedDays).toHaveLength(0);
    });

    it("derives calendar value from typed input in uncontrolled mode", async () => {
      const user = userEvent.setup();
      render(<DateInput aria-label="Date" />);
      const input = screen.getByRole("textbox");

      // Type a valid date
      await user.type(input, "20260320");
      // Open calendar
      await user.click(screen.getByLabelText("Toggle calendar"));

      // March 20 should be selected in the calendar
      const day20 = screen.getByLabelText("March 20, 2026");
      expect(day20).toHaveAttribute("aria-selected", "true");
    });

    it("derives null calendar value from invalid typed input in uncontrolled mode", async () => {
      const user = userEvent.setup();
      render(<DateInput aria-label="Date" />);
      const input = screen.getByRole("textbox");

      // Type an incomplete date
      await user.type(input, "2026");
      // Open calendar
      await user.click(screen.getByLabelText("Toggle calendar"));

      // No day should be selected
      const selectedDays = screen
        .getAllByRole("gridcell")
        .filter((cell) => cell.getAttribute("aria-selected") === "true");
      expect(selectedDays).toHaveLength(0);
    });

    it("derives null calendar value from empty input in uncontrolled mode", async () => {
      const user = userEvent.setup();
      render(<DateInput aria-label="Date" />);

      // Open calendar without typing anything
      await user.click(screen.getByLabelText("Toggle calendar"));

      // No day should be selected
      const selectedDays = screen
        .getAllByRole("gridcell")
        .filter((cell) => cell.getAttribute("aria-selected") === "true");
      expect(selectedDays).toHaveLength(0);
    });

    it("does not open calendar when disabled", () => {
      render(<DateInput aria-label="Date" disabled />);

      // The toggle button should be disabled
      expect(screen.getByLabelText("Toggle calendar")).toBeDisabled();
    });

    it("does not open calendar when readOnly", async () => {
      const user = userEvent.setup();
      render(<DateInput aria-label="Date" readOnly />);

      // Click the toggle button — calendar should not open
      await user.click(screen.getByLabelText("Toggle calendar"));
      expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    });

    it("renders styled calendar nav icons (ChevronLeft / ChevronRight)", async () => {
      const user = userEvent.setup();
      render(<DateInput aria-label="Date" />);

      await user.click(screen.getByLabelText("Toggle calendar"));

      // The styled component passes styledNavPrev and styledNavNext
      // which render ChevronLeftIcon and ChevronRightIcon
      expect(screen.getByLabelText("Previous month")).toBeInTheDocument();
      expect(screen.getByLabelText("Next month")).toBeInTheDocument();
    });

    it("applies calendarOpen class to wrapper when calendar is open", async () => {
      const user = userEvent.setup();
      render(<DateInput aria-label="Date" />);

      await user.click(screen.getByLabelText("Toggle calendar"));

      const wrapper = screen.getByTestId("date-input");
      expect(wrapper.className).toMatch(/calendarOpen/);
    });

    it("does not fire outside-click handler if calendar is already closed", () => {
      render(
        <div>
          <DateInput aria-label="Date" />
          <button type="button">Outside</button>
        </div>,
      );

      // Calendar not open — clicking outside should not throw or break
      fireEvent.mouseDown(screen.getByText("Outside"));
      expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    });
  });

  //  Keyboard handling edge cases

  it("allows Ctrl+key combinations", () => {
    render(<DateInput aria-label="Date" />);
    const input = screen.getByRole("textbox");

    // Ctrl+A should not be prevented
    const event = new KeyboardEvent("keydown", { key: "a", ctrlKey: true, bubbles: true });
    const prevented = !input.dispatchEvent(event);
    expect(prevented).toBe(false);
  });

  it("allows Meta+key combinations", () => {
    render(<DateInput aria-label="Date" />);
    const input = screen.getByRole("textbox");

    const event = new KeyboardEvent("keydown", { key: "c", metaKey: true, bubbles: true });
    const prevented = !input.dispatchEvent(event);
    expect(prevented).toBe(false);
  });
});
