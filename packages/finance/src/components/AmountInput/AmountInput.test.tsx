import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import type { AmountInputHandle } from "../../unstyled/AmountInput/AmountInput";
import { AmountInput } from "./AmountInput";

describe("AmountInput (styled)", () => {
  it("renders the data-finra-ui root and a spinbutton", () => {
    render(<AmountInput aria-label="Notional" locale="en-US" defaultValue={1_230_000} />);
    expect(screen.getByTestId("amount-input")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Notional" })).toHaveValue("1.23M");
  });

  it("resolves shorthand through the wrapper", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AmountInput aria-label="Notional" locale="en-US" onChange={onChange} />);
    const input = screen.getByRole("spinbutton");

    await user.type(input, "10m");

    // Enter commits without leaving the field, so it stays in its editable form.
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith(10_000_000);
    expect(input).toHaveValue("10000000");

    await user.tab();
    expect(input).toHaveValue("10M");
  });

  it("forwards the imperative handle", () => {
    const ref = createRef<AmountInputHandle>();
    render(
      <AmountInput
        aria-label="Notional"
        locale="en-US"
        defaultValue={1_000_000}
        step={500_000}
        ref={ref}
      />,
    );

    act(() => ref.current?.step(1));
    expect(screen.getByRole("spinbutton")).toHaveValue("1.5M");
  });

  it("applies variant / validation / fullWidth / disabled", () => {
    render(
      <AmountInput
        aria-label="Notional"
        locale="en-US"
        defaultValue={1_000}
        variant="secondary"
        validationStatus="error"
        fullWidth
        disabled
      />,
    );
    expect(screen.getByRole("spinbutton")).toBeDisabled();
  });
});
