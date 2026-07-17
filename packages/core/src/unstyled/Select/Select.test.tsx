import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { SelectOptionData } from "../../logic/select";
import { Select, SelectContent, SelectTrigger, SelectValue } from "./Select";

const options: readonly SelectOptionData[] = [
  { value: "a", label: "Apple" },
  { value: "b", label: "Banana", disabled: true },
  { value: "c", label: "Cherry" },
  { value: "d", label: "Date" },
];

function renderSelect(props?: Partial<Parameters<typeof Select>[0]>) {
  return render(
    <Select options={options} placeholder="Pick fruit" {...props}>
      <SelectTrigger aria-label="Fruit" />
      <SelectContent aria-label="Fruit options" />
    </Select>,
  );
}

function getTrigger() {
  return screen.getByRole("combobox", { name: "Fruit" });
}

describe("Select", () => {
  it("renders a combobox trigger showing the placeholder, closed", () => {
    renderSelect();
    const trigger = getTrigger();
    expect(trigger).toHaveTextContent("Pick fruit");
    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).not.toHaveAttribute("aria-controls");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("opens on click and renders the options as a listbox", async () => {
    const user = userEvent.setup();
    renderSelect();
    const trigger = getTrigger();
    await user.click(trigger);

    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls", listbox.id);
    expect(screen.getAllByRole("option")).toHaveLength(4);
    // Default active lands on the first enabled option.
    expect(trigger).toHaveAttribute("aria-activedescendant", screen.getAllByRole("option")[0].id);
  });

  it("toggles closed when the trigger is clicked again", async () => {
    const user = userEvent.setup();
    renderSelect();
    const trigger = getTrigger();
    await user.click(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.click(trigger);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("selects an option on click and shows its label", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderSelect({ onValueChange });
    await user.click(getTrigger());

    fireEvent.mouseDown(screen.getByRole("option", { name: "Cherry" }));
    expect(onValueChange).toHaveBeenCalledWith("c");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(getTrigger()).toHaveTextContent("Cherry");
  });

  it("does not select a disabled option", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderSelect({ onValueChange });
    await user.click(getTrigger());

    fireEvent.mouseDown(screen.getByRole("option", { name: "Banana" }));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("navigates with the keyboard and selects with Enter (skipping disabled)", () => {
    const onValueChange = vi.fn();
    renderSelect({ onValueChange });
    const trigger = getTrigger();

    fireEvent.keyDown(trigger, { key: "ArrowDown" }); // open, active = 0 (Apple)
    const optionIds = screen.getAllByRole("option").map((o) => o.id);
    expect(trigger).toHaveAttribute("aria-activedescendant", optionIds[0]);

    fireEvent.keyDown(trigger, { key: "ArrowDown" }); // skip disabled Banana -> Cherry (2)
    expect(trigger).toHaveAttribute("aria-activedescendant", optionIds[2]);

    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(onValueChange).toHaveBeenCalledWith("c");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("End jumps to the last option, Home to the first", () => {
    renderSelect();
    const trigger = getTrigger();
    fireEvent.keyDown(trigger, { key: "ArrowDown" }); // open
    const ids = screen.getAllByRole("option").map((o) => o.id);

    fireEvent.keyDown(trigger, { key: "End" });
    expect(trigger).toHaveAttribute("aria-activedescendant", ids[3]);
    fireEvent.keyDown(trigger, { key: "Home" });
    expect(trigger).toHaveAttribute("aria-activedescendant", ids[0]);
  });

  it("closes on Escape", () => {
    renderSelect();
    const trigger = getTrigger();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes on an outside pointer", async () => {
    const user = userEvent.setup();
    renderSelect();
    await user.click(getTrigger());
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("typeahead jumps to a matching option while open", () => {
    renderSelect();
    const trigger = getTrigger();
    fireEvent.keyDown(trigger, { key: "ArrowDown" }); // open at 0
    const ids = screen.getAllByRole("option").map((o) => o.id);

    fireEvent.keyDown(trigger, { key: "d" }); // -> Date (3)
    expect(trigger).toHaveAttribute("aria-activedescendant", ids[3]);
  });

  it("typeahead opens and highlights when closed", () => {
    renderSelect();
    const trigger = getTrigger();
    fireEvent.keyDown(trigger, { key: "c" }); // opens at Cherry (2)
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    const ids = screen.getAllByRole("option").map((o) => o.id);
    expect(trigger).toHaveAttribute("aria-activedescendant", ids[2]);
  });

  it("ignores modifier-key combos for typeahead", () => {
    renderSelect();
    const trigger = getTrigger();
    fireEvent.keyDown(trigger, { key: "a", metaKey: true });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("opens the keyboard highlight on the currently selected option", () => {
    renderSelect({ defaultValue: "d" });
    const trigger = getTrigger();
    expect(trigger).toHaveTextContent("Date");

    fireEvent.keyDown(trigger, { key: "ArrowDown" }); // open at selected (3)
    const ids = screen.getAllByRole("option").map((o) => o.id);
    expect(trigger).toHaveAttribute("aria-activedescendant", ids[3]);
  });

  it("respects a controlled value (does not self-update)", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderSelect({ value: "a", onValueChange });
    expect(getTrigger()).toHaveTextContent("Apple");

    await user.click(getTrigger());
    fireEvent.mouseDown(screen.getByRole("option", { name: "Cherry" }));
    expect(onValueChange).toHaveBeenCalledWith("c");
    // Controlled: label stays until the parent updates the prop.
    expect(getTrigger()).toHaveTextContent("Apple");
  });

  it("marks the selected and active options with data attributes", async () => {
    const user = userEvent.setup();
    renderSelect({ defaultValue: "c" });
    await user.click(getTrigger());
    const cherry = screen.getByRole("option", { name: "Cherry" });
    expect(cherry).toHaveAttribute("aria-selected", "true");
    expect(cherry).toHaveAttribute("data-selected");
  });

  it("sets active on hover (mouse enter)", async () => {
    const user = userEvent.setup();
    renderSelect();
    await user.click(getTrigger());
    const date = screen.getByRole("option", { name: "Date" });
    fireEvent.mouseEnter(date);
    expect(getTrigger()).toHaveAttribute("aria-activedescendant", date.id);
  });

  it("supports a custom renderOption", async () => {
    const user = userEvent.setup();
    render(
      <Select options={options} placeholder="Pick">
        <SelectTrigger aria-label="Fruit" />
        <SelectContent
          aria-label="Fruit options"
          renderOption={(option) => <span>★ {option.label}</span>}
        />
      </Select>,
    );
    await user.click(getTrigger());
    expect(screen.getByRole("option", { name: "★ Apple" })).toBeInTheDocument();
  });

  it("supports asChild on the trigger and a standalone SelectValue", async () => {
    const user = userEvent.setup();
    render(
      <Select options={options} placeholder="Pick" defaultValue="a">
        <SelectTrigger asChild aria-label="Fruit">
          <button>
            <SelectValue />
          </button>
        </SelectTrigger>
        <SelectContent aria-label="Fruit options" />
      </Select>,
    );
    const trigger = getTrigger();
    expect(trigger).toHaveTextContent("Apple");
    await user.click(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("SelectValue falls back to its own placeholder", () => {
    render(
      <Select options={options}>
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Nothing yet" />
        </SelectTrigger>
        <SelectContent aria-label="Fruit options" />
      </Select>,
    );
    expect(getTrigger()).toHaveTextContent("Nothing yet");
  });

  it("does not toggle when the trigger onClick prevents default", async () => {
    const user = userEvent.setup();
    render(
      <Select options={options} placeholder="Pick">
        <SelectTrigger aria-label="Fruit" onClick={(event) => event.preventDefault()} />
        <SelectContent aria-label="Fruit options" />
      </Select>,
    );
    await user.click(getTrigger());
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("throws when a part is used outside a Select", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<SelectTrigger aria-label="x" />)).toThrow(
      /must be used within a <Select>/,
    );
    spy.mockRestore();
  });
});
