import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it } from "vitest";

import { Calendar } from "./Calendar";

const TODAY = new Date(2026, 2, 15); // March 15, 2026

describe("Calendar", () => {
  it("renders a calendar grid", () => {
    render(<Calendar today={TODAY} />);
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getByText("March 2026")).toBeInTheDocument();
  });

  it('has data-finra-ui="calendar" attribute', () => {
    render(<Calendar today={TODAY} />);
    expect(screen.getByTestId("calendar")).toBeInTheDocument();
  });

  it("forwards ref to the root div", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Calendar ref={ref} today={TODAY} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("forwards additional className", () => {
    render(<Calendar className="custom" today={TODAY} />);
    const root = screen.getByTestId("calendar");
    expect(root).toHaveClass("custom");
  });

  it("renders 42 day buttons", () => {
    render(<Calendar today={TODAY} />);
    expect(screen.getAllByRole("gridcell")).toHaveLength(42);
  });

  it("marks selected day", () => {
    const value = new Date(2026, 2, 20);
    render(<Calendar value={value} today={TODAY} />);
    expect(screen.getByLabelText("March 20, 2026")).toHaveAttribute("aria-selected", "true");
  });

  it("applies SCSS module styles to day cells", () => {
    render(<Calendar today={TODAY} />);
    const days = screen.getAllByRole("gridcell");
    expect(days[0].className).toBeTruthy();
  });

  it("merges user classNames with default styles", () => {
    render(<Calendar today={TODAY} classNames={{ day: "user-day", header: "user-header" }} />);
    const days = screen.getAllByRole("gridcell");
    expect(days[0]).toHaveClass("user-day");
  });
});

describe("Calendar month/year dropdowns", () => {
  it("renders month and year comboboxes reflecting the displayed month", () => {
    render(<Calendar monthYearDropdowns today={TODAY} />);
    expect(screen.getByRole("combobox", { name: "Month" })).toHaveTextContent("March");
    expect(screen.getByRole("combobox", { name: "Year" })).toHaveTextContent("2026");
    // No static title when dropdowns are on.
    expect(screen.queryByText("March 2026")).not.toBeInTheDocument();
  });

  it("navigates the grid when the month dropdown changes", async () => {
    const user = userEvent.setup();
    render(<Calendar monthYearDropdowns today={TODAY} />);

    await user.click(screen.getByRole("combobox", { name: "Month" }));
    await user.click(screen.getByRole("option", { name: "June" }));

    expect(screen.getByRole("combobox", { name: "Month" })).toHaveTextContent("June");
    expect(screen.getByRole("grid")).toHaveAttribute("aria-label", "June 2026");
  });

  it("navigates the grid when the year dropdown changes", async () => {
    const user = userEvent.setup();
    render(<Calendar monthYearDropdowns today={TODAY} />);

    await user.click(screen.getByRole("combobox", { name: "Year" }));
    await user.click(screen.getByRole("option", { name: "2028" }));

    expect(screen.getByRole("combobox", { name: "Year" })).toHaveTextContent("2028");
    expect(screen.getByRole("grid")).toHaveAttribute("aria-label", "March 2028");
  });

  it("disables out-of-range months in the dropdown", async () => {
    const user = userEvent.setup();
    render(<Calendar monthYearDropdowns today={TODAY} min={new Date(2026, 2, 1)} />);

    await user.click(screen.getByRole("combobox", { name: "Month" }));
    // January is entirely before the March min.
    expect(screen.getByRole("option", { name: "January" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("prefers an explicit renderTitle over the dropdowns", () => {
    render(<Calendar monthYearDropdowns renderTitle={() => <span>Custom</span>} today={TODAY} />);
    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Month" })).not.toBeInTheDocument();
  });
});

describe("Calendar range mode", () => {
  it("forwards range mode and marks start / middle / end days", () => {
    render(
      <Calendar
        mode="range"
        today={TODAY}
        rangeValue={{ start: new Date(2026, 2, 10), end: new Date(2026, 2, 12) }}
      />,
    );
    expect(screen.getByLabelText("March 10, 2026")).toHaveAttribute("data-range-start");
    expect(screen.getByLabelText("March 11, 2026")).toHaveAttribute("data-range-middle");
    expect(screen.getByLabelText("March 12, 2026")).toHaveAttribute("data-range-end");
  });
});

describe("Calendar highlighted dates and week numbers", () => {
  it("forwards week-number and highlight hooks", () => {
    render(<Calendar today={TODAY} showWeekNumbers highlightedDates={[new Date(2026, 2, 20)]} />);
    expect(screen.getAllByRole("rowheader")).toHaveLength(6);
    expect(screen.getByLabelText("March 20, 2026")).toHaveAttribute("data-highlighted");
  });
});
