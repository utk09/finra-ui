import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TenorInputBase } from "./TenorInput";

describe("TenorInputBase", () => {
  it("renders with default placeholder", () => {
    render(<TenorInputBase aria-label="Tenor" />);
    expect(screen.getByPlaceholderText("Select tenor...")).toBeInTheDocument();
  });

  it("renders with custom placeholder", () => {
    render(<TenorInputBase aria-label="Tenor" placeholder="Pick tenor" />);
    expect(screen.getByPlaceholderText("Pick tenor")).toBeInTheDocument();
  });

  it("shows standard tenor options on focus", async () => {
    const user = userEvent.setup();
    render(<TenorInputBase aria-label="Tenor" />);

    await user.click(screen.getByRole("searchbox"));
    expect(screen.getByText("ON")).toBeInTheDocument();
    expect(screen.getByText("3M")).toBeInTheDocument();
    expect(screen.getByText("1Y")).toBeInTheDocument();
  });

  it("selects tenor on click", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<TenorInputBase aria-label="Tenor" onChange={handleChange} />);

    await user.click(screen.getByRole("searchbox"));
    await user.click(screen.getByText("3M"));
    expect(handleChange).toHaveBeenCalledWith("3M");
  });

  it("displays controlled value", () => {
    render(<TenorInputBase aria-label="Tenor" value="6M" />);
    expect(screen.getByDisplayValue("6M")).toBeInTheDocument();
  });

  it("restricts to allowedTenors", async () => {
    const user = userEvent.setup();
    render(<TenorInputBase aria-label="Tenor" allowedTenors={["1M", "3M"]} />);

    await user.click(screen.getByRole("searchbox"));
    expect(screen.getByText("1M")).toBeInTheDocument();
    expect(screen.getByText("3M")).toBeInTheDocument();
    expect(screen.queryByText("ON")).not.toBeInTheDocument();
  });

  it("adds extraTenors to list", async () => {
    const user = userEvent.setup();
    render(<TenorInputBase aria-label="Tenor" extraTenors={["4M"]} />);

    await user.click(screen.getByRole("searchbox"));
    expect(screen.getByText("4M")).toBeInTheDocument();
    expect(screen.getByText("ON")).toBeInTheDocument();
  });

  it("does not duplicate existing extra tenors", async () => {
    const user = userEvent.setup();
    render(<TenorInputBase aria-label="Tenor" extraTenors={["3M"]} />);

    await user.click(screen.getByRole("searchbox"));
    const items = screen.getAllByText("3M");
    expect(items).toHaveLength(1);
  });

  it("filters options as user types", async () => {
    const user = userEvent.setup();
    render(<TenorInputBase aria-label="Tenor" />);

    const input = screen.getByRole("searchbox");
    await user.click(input);
    await user.type(input, "1");

    expect(screen.getByText("1W")).toBeInTheDocument();
    expect(screen.getByText("1M")).toBeInTheDocument();
    expect(screen.queryByText("ON")).not.toBeInTheDocument();
  });

  it("disabled state", () => {
    render(<TenorInputBase aria-label="Tenor" disabled />);
    expect(screen.getByRole("searchbox")).toBeDisabled();
  });

  it("handles allowCustom with valid tenor", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<TenorInputBase aria-label="Tenor" allowCustom onChange={handleChange} />);

    const input = screen.getByRole("searchbox");
    await user.click(input);
    await user.type(input, "4M");

    const createOption = screen.getByText(/Use "4M"/i);
    await user.click(createOption);
    expect(handleChange).toHaveBeenCalledWith("4M");
  });

  it("does not create invalid custom tenor", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<TenorInputBase aria-label="Tenor" allowCustom onChange={handleChange} />);

    const input = screen.getByRole("searchbox");
    await user.click(input);
    await user.type(input, "ABC");

    const createOption = screen.getByText(/Use "ABC"/i);
    await user.click(createOption);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("converts array value from ComboBox to single string", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<TenorInputBase aria-label="Tenor" onChange={handleChange} />);

    await user.click(screen.getByRole("searchbox"));
    await user.click(screen.getByText("6M"));
    expect(handleChange).toHaveBeenCalledWith("6M");
  });

  it("forwards ref to input", () => {
    const ref = vi.fn();
    render(<TenorInputBase ref={ref} aria-label="Tenor" />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it("supports controlled open state", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<TenorInputBase aria-label="Tenor" open={false} onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole("searchbox"));
    expect(onOpenChange).toHaveBeenCalled();
  });
});
