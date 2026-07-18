import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { CalendarFooterApi } from "../../unstyled/Calendar/Calendar";
import { CalendarShortcuts, CalendarTodayButton } from "./CalendarFooter";

function makeApi(overrides: Partial<CalendarFooterApi> = {}): CalendarFooterApi {
  return {
    today: new Date(2026, 2, 15), // March 15, 2026
    month: new Date(2026, 2, 1),
    value: null,
    goToToday: vi.fn(),
    selectToday: vi.fn(),
    select: vi.fn(),
    goToMonth: vi.fn(),
    isDateDisabled: () => false,
    ...overrides,
  };
}

describe("CalendarTodayButton", () => {
  it("selects today on click by default", async () => {
    const user = userEvent.setup();
    const api = makeApi();
    render(<CalendarTodayButton api={api} />);
    await user.click(screen.getByRole("button", { name: "Go to today" }));
    expect(api.selectToday).toHaveBeenCalledOnce();
    expect(api.goToToday).not.toHaveBeenCalled();
  });

  it("navigates only when navigateOnly is set", async () => {
    const user = userEvent.setup();
    const api = makeApi();
    render(<CalendarTodayButton api={api} navigateOnly />);
    await user.click(screen.getByRole("button", { name: "Go to today" }));
    expect(api.goToToday).toHaveBeenCalledOnce();
    expect(api.selectToday).not.toHaveBeenCalled();
  });

  it("renders custom children", () => {
    render(<CalendarTodayButton api={makeApi()}>Jump to today</CalendarTodayButton>);
    expect(screen.getByRole("button", { name: "Jump to today" })).toBeInTheDocument();
  });

  it("disables when today is out of range (and not navigate-only)", () => {
    const api = makeApi({ isDateDisabled: () => true });
    render(<CalendarTodayButton api={api} />);
    expect(screen.getByRole("button", { name: "Go to today" })).toBeDisabled();
  });
});

describe("CalendarShortcuts", () => {
  it("selects today + tenor on click", async () => {
    const user = userEvent.setup();
    const api = makeApi();
    render(<CalendarShortcuts api={api} shortcuts={[{ label: "1M", tenor: "1m" }]} />);
    await user.click(screen.getByRole("button", { name: "1M" }));
    expect(api.select).toHaveBeenCalledOnce();
    const arg = (api.select as ReturnType<typeof vi.fn>).mock.calls[0][0] as Date;
    expect(arg.getMonth()).toBe(3); // April
    expect(arg.getDate()).toBe(15);
  });

  it("renders one button per shortcut", () => {
    render(
      <CalendarShortcuts
        api={makeApi()}
        shortcuts={[
          { label: "1W", tenor: "1w" },
          { label: "1M", tenor: "1m" },
          { label: "6M", tenor: "6m" },
        ]}
      />,
    );
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("disables a shortcut whose target is out of range", () => {
    const api = makeApi({ isDateDisabled: () => true });
    render(<CalendarShortcuts api={api} shortcuts={[{ label: "6M", tenor: "6m" }]} />);
    expect(screen.getByRole("button", { name: "6M" })).toBeDisabled();
  });

  it("disables a shortcut with an invalid tenor", () => {
    render(<CalendarShortcuts api={makeApi()} shortcuts={[{ label: "Bad", tenor: "nope" }]} />);
    expect(screen.getByRole("button", { name: "Bad" })).toBeDisabled();
  });
});
