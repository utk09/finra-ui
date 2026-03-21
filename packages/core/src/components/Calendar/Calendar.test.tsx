import { render, screen } from "@testing-library/react";
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
