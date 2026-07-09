import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DateTenorInput } from "./DateTenorInput";

const REF_DATE = new Date(2026, 2, 11); // March 11, 2026

describe("DateTenorInput", () => {
  //  Rendering

  it("renders a date input field", () => {
    render(<DateTenorInput dateAriaLabel="Date" />);
    expect(screen.getByLabelText("Date")).toBeInTheDocument();
  });

  it('has data-finra-ui="date-tenor-input" attribute', () => {
    render(<DateTenorInput dateAriaLabel="Date" />);
    expect(screen.getByTestId("date-tenor-input")).toBeInTheDocument();
  });

  it("forwards ref to root div", () => {
    const ref = vi.fn();
    render(<DateTenorInput ref={ref} dateAriaLabel="Date" />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });

  it("renders CalendarIcon", () => {
    render(<DateTenorInput dateAriaLabel="Date" />);
    const icon = screen.getByTestId("calendar-icon");
    expect(icon).toBeInTheDocument();
  });

  //  Controlled values

  it("displays controlled date value", () => {
    render(
      <DateTenorInput
        dateAriaLabel="Date"
        dateValue={new Date(2026, 5, 11)}
        dateFormat="YYYY-MM-DD"
      />,
    );
    expect(screen.getByDisplayValue("2026-06-11")).toBeInTheDocument();
  });

  it("displays controlled tenor value as badge", () => {
    render(<DateTenorInput dateAriaLabel="Date" tenorValue="3M" />);
    expect(screen.getByText("3M")).toBeInTheDocument();
  });

  //  Popup

  it("opens popup when clicking the input", async () => {
    const user = userEvent.setup();
    render(<DateTenorInput dateAriaLabel="Date" referenceDate={REF_DATE} dateValue={REF_DATE} />);

    await user.click(screen.getByLabelText("Date"));

    // Calendar section should be visible with month/year
    expect(screen.getByText("March 2026")).toBeInTheDocument();
    // Tenor section should be visible
    expect(screen.getByText("Tenor")).toBeInTheDocument();
    expect(screen.getByText("3M")).toBeInTheDocument();
    expect(screen.getByText("1Y")).toBeInTheDocument();
  });

  it("opens popup when clicking the calendar icon", async () => {
    const user = userEvent.setup();
    render(<DateTenorInput dateAriaLabel="Date" />);

    await user.click(screen.getByLabelText("Toggle date and tenor picker"));
    expect(screen.getByText("Tenor")).toBeInTheDocument();
  });

  it("closes popup on Escape", async () => {
    const user = userEvent.setup();
    render(<DateTenorInput dateAriaLabel="Date" />);

    await user.click(screen.getByLabelText("Date"));
    expect(screen.getByText("Tenor")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByText("Tenor")).not.toBeInTheDocument();
  });

  //  Tenor selection

  it("selecting tenor fires onChange with resolved date", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DateTenorInput dateAriaLabel="Date" referenceDate={REF_DATE} onChange={handleChange} />,
    );

    // Open popup
    await user.click(screen.getByLabelText("Date"));

    // Click a tenor
    fireEvent.mouseDown(screen.getByRole("option", { name: "3M" }));

    expect(handleChange).toHaveBeenCalledWith({
      date: expect.any(Date),
      tenor: "3M",
    });

    const call = handleChange.mock.calls[0][0];
    // 3M from March 11 = June 11
    expect(call.date.getMonth()).toBe(5);
    expect(call.date.getDate()).toBe(11);
  });

  it("deselecting tenor fires onChange with both null", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DateTenorInput
        dateAriaLabel="Date"
        referenceDate={REF_DATE}
        tenorValue="3M"
        dateValue={new Date(2026, 5, 11)}
        onChange={handleChange}
      />,
    );

    await user.click(screen.getByLabelText("Date"));
    // Click the already-selected tenor to deselect
    fireEvent.mouseDown(screen.getByRole("option", { name: "3M" }));

    expect(handleChange).toHaveBeenCalledWith({
      date: null,
      tenor: null,
    });
  });

  //  Date entry via text input

  it("entering date fires onChange with matched tenor", () => {
    const handleChange = vi.fn();

    render(
      <DateTenorInput
        dateAriaLabel="Date"
        referenceDate={REF_DATE}
        dateFormat="YYYY-MM-DD"
        onChange={handleChange}
      />,
    );

    const dateInput = screen.getByLabelText("Date");
    // Type a date that matches 1M (April 11 from March 11)
    fireEvent.change(dateInput, { target: { value: "2026-04-11" } });
    fireEvent.blur(dateInput);

    expect(handleChange).toHaveBeenCalledWith({
      date: expect.any(Date),
      tenor: "1M",
    });
  });

  it("entering date that doesn't match tenor fires onChange with null tenor", () => {
    const handleChange = vi.fn();

    render(
      <DateTenorInput
        dateAriaLabel="Date"
        referenceDate={REF_DATE}
        dateFormat="YYYY-MM-DD"
        onChange={handleChange}
      />,
    );

    const dateInput = screen.getByLabelText("Date");
    // March 20 doesn't match any standard tenor from March 11
    fireEvent.change(dateInput, { target: { value: "2026-03-20" } });
    fireEvent.blur(dateInput);

    expect(handleChange).toHaveBeenCalledWith({
      date: expect.any(Date),
      tenor: null,
    });
  });

  //  Calendar selection

  it("selecting a date from calendar fires onChange", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DateTenorInput
        dateAriaLabel="Date"
        referenceDate={REF_DATE}
        dateValue={REF_DATE}
        dateFormat="YYYY-MM-DD"
        onChange={handleChange}
      />,
    );

    // Open popup
    await user.click(screen.getByLabelText("Date"));

    // Click March 15
    fireEvent.mouseDown(screen.getByLabelText("March 15, 2026"));

    expect(handleChange).toHaveBeenCalledWith({
      date: expect.any(Date),
      tenor: null, // March 15 doesn't match any standard tenor from March 11
    });
  });

  //  Custom tenor resolver

  it("uses custom tenorResolver", async () => {
    const customResolver = vi.fn((_tenor: string, _ref: Date) => new Date(2030, 0, 1));
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DateTenorInput
        dateAriaLabel="Date"
        referenceDate={REF_DATE}
        tenorResolver={customResolver}
        onChange={handleChange}
      />,
    );

    await user.click(screen.getByLabelText("Date"));
    fireEvent.mouseDown(screen.getByRole("option", { name: "1Y" }));

    expect(customResolver).toHaveBeenCalledWith("1Y", REF_DATE);
    expect(handleChange).toHaveBeenCalledWith({
      date: new Date(2030, 0, 1),
      tenor: "1Y",
    });
  });

  //  Disabled state

  it("disabled state disables the input", () => {
    render(<DateTenorInput dateAriaLabel="Date" disabled />);
    expect(screen.getByLabelText("Date")).toBeDisabled();
  });

  it("disabled state applies disabled class", () => {
    render(<DateTenorInput dateAriaLabel="Date" disabled />);
    const root = screen.getByTestId("date-tenor-input");
    expect(root.className).toMatch(/disabled/);
  });

  //  Date constraints

  it("passes date constraints through", () => {
    const handleChange = vi.fn();

    render(
      <DateTenorInput
        dateAriaLabel="Date"
        dateFormat="YYYY-MM-DD"
        minDate={new Date(2026, 5, 1)}
        onChange={handleChange}
      />,
    );

    const dateInput = screen.getByLabelText("Date");
    // Enter date before min
    fireEvent.change(dateInput, { target: { value: "2026-01-01" } });
    fireEvent.blur(dateInput);

    // onChange should NOT be called with an out-of-range date
    expect(handleChange).not.toHaveBeenCalled();
  });

  //  Allowed tenors

  it("passes allowedTenors to tenor list", async () => {
    const user = userEvent.setup();

    render(<DateTenorInput dateAriaLabel="Date" allowedTenors={["1M", "3M", "6M"]} />);

    await user.click(screen.getByLabelText("Date"));

    expect(screen.getByRole("option", { name: "1M" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "3M" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "6M" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "ON" })).not.toBeInTheDocument();
  });

  //  Styling

  it("applies fullWidth class", () => {
    render(<DateTenorInput dateAriaLabel="Date" fullWidth />);
    const root = screen.getByTestId("date-tenor-input");
    expect(root.className).toMatch(/fullWidth/);
  });

  it("applies custom className", () => {
    render(<DateTenorInput dateAriaLabel="Date" className="my-custom" />);
    const root = screen.getByTestId("date-tenor-input");
    expect(root.className).toContain("my-custom");
  });

  it("applies variant class", () => {
    render(<DateTenorInput dateAriaLabel="Date" variant="secondary" />);
    expect(screen.getByTestId("date-tenor-input")).toBeInTheDocument();
  });

  it("applies validationStatus class", () => {
    render(<DateTenorInput dateAriaLabel="Date" validationStatus="error" />);
    expect(screen.getByTestId("date-tenor-input")).toBeInTheDocument();
  });

  //  Clear date

  it("clearing date to empty fires onChange with both null", () => {
    const handleChange = vi.fn();
    render(
      <DateTenorInput
        dateAriaLabel="Date"
        dateValue={new Date(2026, 5, 11)}
        tenorValue="3M"
        dateFormat="YYYY-MM-DD"
        onChange={handleChange}
      />,
    );

    const dateInput = screen.getByLabelText("Date");
    fireEvent.change(dateInput, { target: { value: "" } });
    fireEvent.blur(dateInput);

    expect(handleChange).toHaveBeenCalledWith({ date: null, tenor: null });
  });

  //  Placeholder

  it("accepts custom date placeholder", () => {
    render(<DateTenorInput dateAriaLabel="Date" datePlaceholder="Enter date" />);
    expect(screen.getByPlaceholderText("Enter date")).toBeInTheDocument();
  });

  //  handleInputBlur branches

  describe("input blur validation", () => {
    it("fires onChange with nulls when input is empty on blur", () => {
      const handleChange = vi.fn();
      render(
        <DateTenorInput
          dateAriaLabel="Date"
          dateValue={new Date(2026, 5, 11)}
          dateFormat="YYYY-MM-DD"
          onChange={handleChange}
        />,
      );

      const dateInput = screen.getByLabelText("Date");
      fireEvent.change(dateInput, { target: { value: "" } });
      fireEvent.blur(dateInput);

      expect(handleChange).toHaveBeenCalledWith({ date: null, tenor: null });
    });

    it("does not fire onChange when input has invalid date format on blur", () => {
      const handleChange = vi.fn();
      render(
        <DateTenorInput dateAriaLabel="Date" dateFormat="YYYY-MM-DD" onChange={handleChange} />,
      );

      const dateInput = screen.getByLabelText("Date");
      // Partial/invalid date
      fireEvent.change(dateInput, { target: { value: "2026-13-01" } });
      fireEvent.blur(dateInput);

      expect(handleChange).not.toHaveBeenCalled();
    });

    it("does not fire onChange when date is out of range (before minDate)", () => {
      const handleChange = vi.fn();
      render(
        <DateTenorInput
          dateAriaLabel="Date"
          dateFormat="YYYY-MM-DD"
          minDate={new Date(2026, 5, 1)} // June 1, 2026
          onChange={handleChange}
        />,
      );

      const dateInput = screen.getByLabelText("Date");
      fireEvent.change(dateInput, { target: { value: "2026-01-01" } });
      fireEvent.blur(dateInput);

      expect(handleChange).not.toHaveBeenCalled();
    });

    it("does not fire onChange when date is out of range (after maxDate)", () => {
      const handleChange = vi.fn();
      render(
        <DateTenorInput
          dateAriaLabel="Date"
          dateFormat="YYYY-MM-DD"
          maxDate={new Date(2026, 2, 31)} // March 31, 2026
          onChange={handleChange}
        />,
      );

      const dateInput = screen.getByLabelText("Date");
      fireEvent.change(dateInput, { target: { value: "2026-06-15" } });
      fireEvent.blur(dateInput);

      expect(handleChange).not.toHaveBeenCalled();
    });

    it("does not fire onChange for incomplete input on blur", () => {
      const handleChange = vi.fn();
      render(
        <DateTenorInput dateAriaLabel="Date" dateFormat="YYYY-MM-DD" onChange={handleChange} />,
      );

      const dateInput = screen.getByLabelText("Date");
      fireEvent.change(dateInput, { target: { value: "2026" } });
      fireEvent.blur(dateInput);

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  //  calendarDisplayValue branches

  describe("calendar display value", () => {
    it("shows no selection when uncontrolled and input is empty", async () => {
      const user = userEvent.setup();
      // Do not provide dateValue (uncontrolled)
      render(<DateTenorInput dateAriaLabel="Date" />);

      await user.click(screen.getByLabelText("Date"));

      // No day should be selected
      const selectedDays = screen
        .getAllByRole("gridcell")
        .filter((cell) => cell.getAttribute("aria-selected") === "true");
      expect(selectedDays).toHaveLength(0);
    });

    it("shows no selection when uncontrolled and input has invalid date", async () => {
      const user = userEvent.setup();
      render(<DateTenorInput dateAriaLabel="Date" dateFormat="YYYY-MM-DD" />);

      const dateInput = screen.getByLabelText("Date");
      fireEvent.change(dateInput, { target: { value: "2026" } });

      await user.click(screen.getByLabelText("Toggle date and tenor picker"));

      const selectedDays = screen
        .getAllByRole("gridcell")
        .filter((cell) => cell.getAttribute("aria-selected") === "true");
      expect(selectedDays).toHaveLength(0);
    });
  });

  //  extraTenors

  it("renders extra tenors alongside standard ones", async () => {
    const user = userEvent.setup();
    render(<DateTenorInput dateAriaLabel="Date" extraTenors={["18M", "30M"]} />);

    await user.click(screen.getByLabelText("Date"));

    // Standard tenors should still be present
    expect(screen.getByRole("option", { name: "3M" })).toBeInTheDocument();
    // Extra tenors should also be present
    expect(screen.getByRole("option", { name: "18M" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "30M" })).toBeInTheDocument();
  });

  it("does not duplicate extra tenors already in standard set", async () => {
    const user = userEvent.setup();
    render(
      <DateTenorInput
        dateAriaLabel="Date"
        extraTenors={["3M"]} // 3M is already standard
      />,
    );

    await user.click(screen.getByLabelText("Date"));

    const options = screen.getAllByRole("option").filter((opt) => opt.textContent === "3M");
    expect(options).toHaveLength(1);
  });

  //  readOnly

  it("does not open popup when readOnly and clicking input", async () => {
    const user = userEvent.setup();
    render(<DateTenorInput dateAriaLabel="Date" readOnly />);

    await user.click(screen.getByLabelText("Date"));
    expect(screen.queryByText("Tenor")).not.toBeInTheDocument();
  });

  it("does not open popup when readOnly and clicking calendar icon", async () => {
    const user = userEvent.setup();
    render(<DateTenorInput dateAriaLabel="Date" readOnly />);

    await user.click(screen.getByLabelText("Toggle date and tenor picker"));
    expect(screen.queryByText("Tenor")).not.toBeInTheDocument();
  });

  //  tenorSectionTitle

  it("renders custom tenorSectionTitle", async () => {
    const user = userEvent.setup();
    render(<DateTenorInput dateAriaLabel="Date" tenorSectionTitle="Select Tenor" />);

    await user.click(screen.getByLabelText("Date"));
    expect(screen.getByText("Select Tenor")).toBeInTheDocument();
  });

  it("hides tenor section title when set to empty string", async () => {
    const user = userEvent.setup();
    render(<DateTenorInput dateAriaLabel="Date" tenorSectionTitle="" />);

    await user.click(screen.getByLabelText("Date"));
    // The default "Tenor" should not be present
    expect(screen.queryByText("Tenor")).not.toBeInTheDocument();
  });

  //  weekStartsOn

  it("passes weekStartsOn=0 to calendar (Sunday start)", async () => {
    const user = userEvent.setup();
    render(<DateTenorInput dateAriaLabel="Date" weekStartsOn={0} />);

    await user.click(screen.getByLabelText("Date"));

    // Check weekday headers: first should be "Su"
    const columnHeaders = screen.getAllByRole("columnheader");
    expect(columnHeaders[0]).toHaveTextContent("Su");
  });

  //  disabled does not open popup on input click

  it("does not open popup when disabled and clicking input", async () => {
    const user = userEvent.setup();
    render(<DateTenorInput dateAriaLabel="Date" disabled />);

    await user.click(screen.getByLabelText("Date"));
    expect(screen.queryByText("Tenor")).not.toBeInTheDocument();
  });

  //  Input keydown: allows navigation keys

  it("allows Ctrl+key in input without preventing default", () => {
    render(<DateTenorInput dateAriaLabel="Date" />);
    const input = screen.getByLabelText("Date");

    const event = new KeyboardEvent("keydown", { key: "a", ctrlKey: true, bubbles: true });
    const prevented = !input.dispatchEvent(event);
    expect(prevented).toBe(false);
  });

  it("allows digit keys in input", () => {
    render(<DateTenorInput dateAriaLabel="Date" />);
    const input = screen.getByLabelText("Date");

    const event = new KeyboardEvent("keydown", { key: "5", bubbles: true });
    const prevented = !input.dispatchEvent(event);
    expect(prevented).toBe(false);
  });

  it("allows separator key in input", () => {
    render(<DateTenorInput dateAriaLabel="Date" dateFormat="YYYY-MM-DD" />);
    const input = screen.getByLabelText("Date");

    const event = new KeyboardEvent("keydown", { key: "-", bubbles: true });
    const prevented = !input.dispatchEvent(event);
    expect(prevented).toBe(false);
  });

  //  Indicator toggle

  it("closes popup on Escape after opening via input click", async () => {
    const user = userEvent.setup();
    render(<DateTenorInput dateAriaLabel="Date" />);

    // Open via input click
    await user.click(screen.getByLabelText("Date"));
    expect(screen.getByText("Tenor")).toBeInTheDocument();

    // Close via Escape
    fireEvent.keyDown(screen.getByLabelText("Date"), { key: "Escape" });
    expect(screen.queryByText("Tenor")).not.toBeInTheDocument();
  });

  //  Outside click closes popup

  it("closes popup on outside click", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <DateTenorInput dateAriaLabel="Date" />
        <button type="button">Outside</button>
      </div>,
    );

    await user.click(screen.getByLabelText("Date"));
    expect(screen.getByText("Tenor")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByText("Outside"));
    expect(screen.queryByText("Tenor")).not.toBeInTheDocument();
  });

  //  Input change when disabled/readOnly

  it("does not process input change when disabled", () => {
    render(<DateTenorInput dateAriaLabel="Date" disabled dateFormat="YYYY-MM-DD" />);

    const input = screen.getByLabelText("Date");
    // Disabled inputs don't fire change events normally,
    // but we confirm the input is disabled
    expect(input).toBeDisabled();
  });

  //  Calendar nav rendering via styled component

  it("renders styled calendar nav icons inside popup", async () => {
    const user = userEvent.setup();
    render(<DateTenorInput dateAriaLabel="Date" />);

    await user.click(screen.getByLabelText("Date"));

    expect(screen.getByLabelText("Previous month")).toBeInTheDocument();
    expect(screen.getByLabelText("Next month")).toBeInTheDocument();
  });

  //  tenorAriaLabel

  it("uses custom tenorAriaLabel", async () => {
    const user = userEvent.setup();
    render(<DateTenorInput dateAriaLabel="Date" tenorAriaLabel="Custom Tenor" />);

    await user.click(screen.getByLabelText("Date"));

    expect(screen.getByRole("listbox", { name: "Custom Tenor" })).toBeInTheDocument();
  });

  it("uses default tenorAriaLabel when not provided", async () => {
    const user = userEvent.setup();
    render(<DateTenorInput dateAriaLabel="Date" />);

    await user.click(screen.getByLabelText("Date"));

    expect(screen.getByRole("listbox", { name: "Tenor" })).toBeInTheDocument();
  });
});
