import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import type { PriceInputHandle } from "../../unstyled/PriceInput/PriceInput";
import { PriceInput } from "./PriceInput";

describe("PriceInput (styled)", () => {
  it("renders the data-finra-ui root and a spinbutton", () => {
    render(<PriceInput aria-label="Price" format="decimal" precision={2} defaultValue={1} />);
    expect(screen.getByTestId("price-input")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Price" })).toHaveValue("1.00");
  });

  it("commits a typed value through the wrapper", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PriceInput aria-label="Price" format="decimal" precision={2} onChange={onChange} />);
    const input = screen.getByRole("spinbutton");
    await user.type(input, "12.5");
    await user.keyboard("{Enter}");
    expect(input).toHaveValue("12.50");
    expect(onChange.mock.calls[0][0]).toBeCloseTo(12.5, 6);
  });

  it("renders a digit-hierarchy overlay when enabled", () => {
    render(
      <PriceInput
        aria-label="Price"
        primaryPrecision={4}
        precisionDigits={1}
        digitHierarchy
        defaultValue={1.08345}
      />,
    );
    expect(screen.getByText("0834")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders the FX big-figure / pips / fractional-pip zones", () => {
    render(
      <PriceInput
        aria-label="Price"
        primaryPrecision={4}
        precisionDigits={1}
        digitHierarchy
        pipDigits={2}
        bigFigureDigits={2}
        defaultValue={1.23456}
      />,
    );
    expect(screen.getByText("1.23")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  it("forwards the imperative handle", () => {
    const ref = createRef<PriceInputHandle>();
    render(
      <PriceInput aria-label="Price" precision={2} tickSize={0.01} defaultValue={1} ref={ref} />,
    );
    act(() => ref.current?.step(5));
    expect(screen.getByRole("spinbutton")).toHaveValue("1.05");
  });

  it("applies variant / validation / fullWidth / disabled", () => {
    render(
      <PriceInput
        aria-label="Price"
        precision={2}
        defaultValue={1}
        variant="secondary"
        validationStatus="error"
        fullWidth
        disabled
      />,
    );
    expect(screen.getByRole("spinbutton")).toBeDisabled();
  });
});
