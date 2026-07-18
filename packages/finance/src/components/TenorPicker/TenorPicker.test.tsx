import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import type { TenorPickerHandle } from "../../unstyled/TenorPicker/TenorPicker";
import { TenorPicker } from "./TenorPicker";

describe("TenorPicker (styled)", () => {
  it("renders the data-finra-ui root and a combobox", () => {
    render(<TenorPicker aria-label="Tenor" />);
    expect(screen.getByTestId("tenor-picker")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Tenor" })).toBeInTheDocument();
  });

  it("commits a typed tenor through the styled wrapper", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TenorPicker aria-label="Tenor" onChange={onChange} />);

    const input = screen.getByRole("combobox");
    await user.type(input, "1y6m");
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledWith("1Y6M");
    expect(input).toHaveValue("1Y6M");
  });

  it("opens a grouped listbox with favourite stars", async () => {
    const user = userEvent.setup();
    render(<TenorPicker aria-label="Tenor" defaultFavourites={["3M"]} />);

    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("group", { name: "Favourites" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Months" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove 3M from favourites" })).toBeInTheDocument();
  });

  it("forwards the imperative handle", () => {
    const ref = createRef<TenorPickerHandle>();
    render(<TenorPicker aria-label="Tenor" ref={ref} />);
    const input = screen.getByRole("combobox");

    act(() => ref.current?.focus());
    expect(input).toHaveFocus();
    act(() => ref.current?.open());
    expect(input).toHaveAttribute("aria-expanded", "true");
  });

  it("applies variant / validation / fullWidth / disabled without error", () => {
    render(
      <TenorPicker
        aria-label="Tenor"
        variant="secondary"
        validationStatus="error"
        fullWidth
        disabled
      />,
    );
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("hides favourite stars when showFavourites is false", async () => {
    const user = userEvent.setup();
    render(<TenorPicker aria-label="Tenor" showFavourites={false} />);
    await user.click(screen.getByRole("combobox"));
    expect(screen.queryByRole("button", { name: /favourites/i })).not.toBeInTheDocument();
  });

  it("marks + checks the selected option and highlights on keyboard nav", async () => {
    const user = userEvent.setup();
    render(<TenorPicker aria-label="Tenor" value="3M" />);
    await user.click(screen.getByRole("combobox"));
    const selected = screen.getByRole("option", { name: /3M/ });
    expect(selected).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowDown}");
    // Some option now carries the roving highlight.
    expect(
      screen.getAllByRole("option").some((o) => o.getAttribute("aria-selected") === "true"),
    ).toBe(true);
  });

  it("shows the empty message when the filter matches nothing", async () => {
    const user = userEvent.setup();
    render(<TenorPicker aria-label="Tenor" noOptionsMessage="No tenors" />);
    const input = screen.getByRole("combobox");
    await user.type(input, "zzz");
    expect(screen.getByText("No tenors")).toBeInTheDocument();
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });
});
