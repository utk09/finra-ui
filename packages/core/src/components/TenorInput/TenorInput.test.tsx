import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TenorInput } from "./TenorInput";

describe("TenorInput", () => {
  it('has data-finra-ui="tenor-input" attribute', () => {
    render(<TenorInput aria-label="Tenor" />);
    expect(screen.getByTestId("tenor-input")).toBeInTheDocument();
  });

  it("renders with default placeholder", () => {
    render(<TenorInput aria-label="Tenor" />);
    expect(screen.getByPlaceholderText("Select tenor...")).toBeInTheDocument();
  });

  it("renders with custom placeholder", () => {
    render(<TenorInput aria-label="Tenor" placeholder="Choose tenor" />);
    expect(screen.getByPlaceholderText("Choose tenor")).toBeInTheDocument();
  });

  it("shows tenor options on focus", async () => {
    const user = userEvent.setup();
    render(<TenorInput aria-label="Tenor" />);

    const input = screen.getByRole("searchbox");
    await user.click(input);

    expect(screen.getByText("ON")).toBeInTheDocument();
    expect(screen.getByText("3M")).toBeInTheDocument();
    expect(screen.getByText("1Y")).toBeInTheDocument();
    expect(screen.getByText("30Y")).toBeInTheDocument();
  });

  it("selects tenor on click", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<TenorInput aria-label="Tenor" onChange={handleChange} />);

    await user.click(screen.getByRole("searchbox"));
    await user.click(screen.getByText("3M"));

    expect(handleChange).toHaveBeenCalledWith("3M");
  });

  it("filters tenors as user types", async () => {
    const user = userEvent.setup();
    render(<TenorInput aria-label="Tenor" />);

    const input = screen.getByRole("searchbox");
    await user.click(input);
    await user.type(input, "1");

    // Should show tenors containing "1": 1W, 1M, 1Y, 10Y, 15Y
    expect(screen.getByText("1W")).toBeInTheDocument();
    expect(screen.getByText("1M")).toBeInTheDocument();
    expect(screen.getByText("1Y")).toBeInTheDocument();
    expect(screen.getByText("10Y")).toBeInTheDocument();
    expect(screen.getByText("15Y")).toBeInTheDocument();

    // Should NOT show tenors without "1"
    expect(screen.queryByText("ON")).not.toBeInTheDocument();
    expect(screen.queryByText("3M")).not.toBeInTheDocument();
  });

  it("displays selected value", () => {
    render(<TenorInput aria-label="Tenor" value="6M" />);
    expect(screen.getByDisplayValue("6M")).toBeInTheDocument();
  });

  it("restricts to allowedTenors", async () => {
    const user = userEvent.setup();
    render(<TenorInput aria-label="Tenor" allowedTenors={["1M", "3M", "6M", "1Y"]} />);

    await user.click(screen.getByRole("searchbox"));

    expect(screen.getByText("1M")).toBeInTheDocument();
    expect(screen.getByText("3M")).toBeInTheDocument();
    expect(screen.getByText("6M")).toBeInTheDocument();
    expect(screen.getByText("1Y")).toBeInTheDocument();
    expect(screen.queryByText("ON")).not.toBeInTheDocument();
    expect(screen.queryByText("30Y")).not.toBeInTheDocument();
  });

  it("adds extraTenors to the list", async () => {
    const user = userEvent.setup();
    render(<TenorInput aria-label="Tenor" extraTenors={["4M", "7Y"]} />);

    await user.click(screen.getByRole("searchbox"));

    expect(screen.getByText("4M")).toBeInTheDocument();
    expect(screen.getByText("7Y")).toBeInTheDocument();
    // Standard tenors still present
    expect(screen.getByText("ON")).toBeInTheDocument();
  });

  it("disabled state", () => {
    render(<TenorInput aria-label="Tenor" disabled />);
    const input = screen.getByRole("searchbox");
    expect(input).toBeDisabled();
  });

  it("calls onChange with new value after reselecting", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<TenorInput aria-label="Tenor" value="3M" onChange={handleChange} />);

    const input = screen.getByRole("searchbox");
    await user.click(input);
    await user.click(screen.getByText("6M"));

    expect(handleChange).toHaveBeenCalledWith("6M");
  });

  it("shows no options message when filter matches nothing", async () => {
    const user = userEvent.setup();
    render(<TenorInput aria-label="Tenor" />);

    const input = screen.getByRole("searchbox");
    await user.click(input);
    await user.type(input, "XYZ");

    expect(screen.getByText("No matching tenors")).toBeInTheDocument();
  });

  it("handles allowCustom with valid tenor", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<TenorInput aria-label="Tenor" allowCustom onChange={handleChange} />);

    const input = screen.getByRole("searchbox");
    await user.click(input);
    await user.type(input, "4M");

    // Should show create option
    const createOption = screen.getByText(/Use "4M"/i);
    expect(createOption).toBeInTheDocument();
    await user.click(createOption);

    expect(handleChange).toHaveBeenCalledWith("4M");
  });

  it("does not create invalid custom tenor", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<TenorInput aria-label="Tenor" allowCustom onChange={handleChange} />);

    const input = screen.getByRole("searchbox");
    await user.click(input);
    await user.type(input, "ABC");

    // Should show create option label, clicking it should NOT fire onChange (parseTenor returns invalid)
    const createOption = screen.getByText(/Use "ABC"/i);
    await user.click(createOption);

    expect(handleChange).not.toHaveBeenCalled();
  });

  it("applies variant prop", () => {
    render(<TenorInput aria-label="Tenor" variant="secondary" />);
    // ComboBox applies variant class to its wrapper
    const comboBox = screen.getByTestId("combo-box");
    expect(comboBox).toBeInTheDocument();
  });

  it("applies fullWidth prop", () => {
    render(<TenorInput aria-label="Tenor" fullWidth />);
    const comboBox = screen.getByTestId("combo-box");
    expect(comboBox).toBeInTheDocument();
  });

  it("handles onChange returning array value from ComboBox", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<TenorInput aria-label="Tenor" onChange={handleChange} />);

    await user.click(screen.getByRole("searchbox"));
    await user.click(screen.getByText("1Y"));

    // The internal handleChange converts single value; verify it arrives correctly
    expect(handleChange).toHaveBeenCalledWith("1Y");
  });

  it("passes noOptionsMessage to ComboBox", async () => {
    const user = userEvent.setup();
    render(<TenorInput aria-label="Tenor" noOptionsMessage="Nothing" />);

    const input = screen.getByRole("searchbox");
    await user.click(input);
    await user.type(input, "ZZZ");

    expect(screen.getByText("Nothing")).toBeInTheDocument();
  });

  it("passes className", () => {
    render(<TenorInput aria-label="Tenor" className="custom-tenor" />);
    const comboBox = screen.getByTestId("combo-box");
    expect(comboBox.className).toContain("custom-tenor");
  });

  it("does not duplicate existing standard tenors in extraTenors", async () => {
    const user = userEvent.setup();
    render(<TenorInput aria-label="Tenor" extraTenors={["3M"]} />);

    await user.click(screen.getByRole("searchbox"));
    const items = screen.getAllByText("3M");
    expect(items).toHaveLength(1);
  });
});
