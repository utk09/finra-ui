import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import type { DateTenorPickerHandle } from "../../unstyled/DateTenorPicker/DateTenorPicker";
import { DateTenorPicker } from "./DateTenorPicker";

const REF = new Date(2026, 0, 15);

describe("DateTenorPicker (styled)", () => {
  it("renders the data-finra-ui root and a combobox", () => {
    render(<DateTenorPicker aria-label="Value date" referenceDate={REF} />);
    expect(screen.getByTestId("date-tenor-picker")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Value date" })).toBeInTheDocument();
  });

  it("commits a typed tenor through the styled wrapper", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DateTenorPicker aria-label="Value date" referenceDate={REF} onChange={onChange} />);

    const input = screen.getByRole("combobox");
    await user.type(input, "3M");
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toMatchObject({ mode: "tenor", tenor: "3M" });
    expect(input).toHaveValue("3M");
  });

  it("opens the popup with a calendar and tenor list", async () => {
    const user = userEvent.setup();
    render(<DateTenorPicker aria-label="Value date" referenceDate={REF} />);

    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "3M" })).toBeInTheDocument();
    expect(screen.getByRole("gridcell", { name: "January 15, 2026" })).toBeInTheDocument();
  });

  it("forwards the imperative handle", () => {
    const ref = createRef<DateTenorPickerHandle>();
    render(<DateTenorPicker aria-label="Value date" referenceDate={REF} ref={ref} />);
    const input = screen.getByRole("combobox");

    act(() => ref.current?.focus());
    expect(input).toHaveFocus();
    act(() => ref.current?.open());
    expect(input).toHaveAttribute("aria-expanded", "true");
  });

  it("applies variant / validation / fullWidth / disabled without error", () => {
    render(
      <DateTenorPicker
        aria-label="Value date"
        referenceDate={REF}
        variant="secondary"
        validationStatus="error"
        fullWidth
        disabled
      />,
    );
    expect(screen.getByRole("combobox")).toBeDisabled();
  });
});
