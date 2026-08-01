import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ComboBoxBase, type ComboBoxOption } from "./ComboBox";

// The styled wrapper always supplies its own icons and loading text, so the
// base's fallbacks are only reachable from here.
const options: ComboBoxOption[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
];

describe("ComboBoxBase - defaults with no render props", () => {
  it("renders a bare listbox with no indicator", async () => {
    const user = userEvent.setup();
    render(<ComboBoxBase options={options} value={null} onChange={vi.fn()} aria-label="Fruit" />);

    await user.click(screen.getByRole("combobox", { name: "Fruit" }));
    expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument();
  });

  it("falls back to plain text while loading", async () => {
    const user = userEvent.setup();
    render(
      <ComboBoxBase options={[]} value={null} onChange={vi.fn()} aria-label="Fruit" loading />,
    );

    await user.click(screen.getByRole("combobox", { name: "Fruit" }));
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("falls back to a multiplication sign on the pill remove button", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ComboBoxBase
        options={options}
        value={["apple"]}
        onChange={onChange}
        aria-label="Fruit"
        multiple
      />,
    );

    const remove = screen.getByRole("button", { name: /apple/i });
    expect(remove).toHaveTextContent("×");

    await user.click(remove);
    // Emptying the selection reports null rather than an empty array, so a
    // consumer's "is anything selected" check is one comparison.
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("renders no pill list at all when nothing is selected", () => {
    render(
      <ComboBoxBase options={options} value={[]} onChange={vi.fn()} aria-label="Fruit" multiple />,
    );
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("shows pills without remove buttons when disabled", () => {
    render(
      <ComboBoxBase
        options={options}
        value={["apple"]}
        onChange={vi.fn()}
        aria-label="Fruit"
        multiple
        disabled
      />,
    );

    // The value stays legible - dropping the pill entirely would hide what is
    // selected - but there is nothing left to press.
    expect(screen.getByRole("listitem")).toHaveTextContent("Apple");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("does not reopen on focus while already open", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <ComboBoxBase
        options={options}
        value={null}
        onChange={vi.fn()}
        aria-label="Fruit"
        onOpenChange={onOpenChange}
      />,
    );

    const input = screen.getByRole("combobox", { name: "Fruit" });
    await user.click(input);
    expect(onOpenChange).toHaveBeenCalledTimes(1);

    // A second focus event on the already-open field must not re-announce the
    // open state - a consumer counting these would double-log every click.
    fireEvent.focus(input);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });
});
