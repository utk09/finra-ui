import { act, fireEvent, render, screen } from "@testing-library/react";
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

  it("clears the typeahead buffer after the timeout", () => {
    vi.useFakeTimers();
    try {
      renderSelect();
      const trigger = getTrigger();

      fireEvent.keyDown(trigger, { key: "d" }); // Date
      expect(screen.getByRole("option", { name: "Date" })).toHaveAttribute("data-active", "true");

      act(() => {
        vi.advanceTimersByTime(1_000);
      });

      // Buffer reset, so "c" starts a fresh search. Without the reset the query
      // would be "dc" and match nothing, leaving Date active.
      fireEvent.keyDown(trigger, { key: "c" });
      expect(screen.getByRole("option", { name: "Cherry" })).toHaveAttribute("data-active", "true");
    } finally {
      vi.useRealTimers();
    }
  });

  it("leaves the highlight alone when typeahead matches nothing", () => {
    renderSelect();
    const trigger = getTrigger();

    fireEvent.keyDown(trigger, { key: "c" });
    expect(screen.getByRole("option", { name: "Cherry" })).toHaveAttribute("data-active", "true");

    // A dead-end query must not close the list or move off the last match -
    // the user is mid-word, not asking for anything.
    fireEvent.keyDown(trigger, { key: "z" });
    expect(screen.getByRole("option", { name: "Cherry" })).toHaveAttribute("data-active", "true");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("does not act on a trigger key the consumer has claimed", () => {
    render(
      <Select options={options} placeholder="Pick fruit">
        <SelectTrigger aria-label="Fruit" onKeyDown={(event) => event.preventDefault()} />
        <SelectContent aria-label="Fruit options" />
      </Select>,
    );
    const trigger = getTrigger();

    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("does not activate a disabled option on hover", async () => {
    const user = userEvent.setup();
    renderSelect();
    await user.click(getTrigger());

    await user.hover(screen.getByRole("option", { name: "Banana" }));
    // Hovering something unselectable must not move the highlight there, or
    // Enter would land on a row that refuses.
    expect(screen.getByRole("option", { name: "Banana" })).not.toHaveAttribute(
      "data-active",
      "true",
    );
  });

  it("stamps its own id on the content root", async () => {
    const user = userEvent.setup();
    renderSelect();
    await user.click(getTrigger());

    // The base has to stamp this itself. Taking the id only from the styled
    // wrapper's props leaves the listbox unidentified for anyone composing
    // SelectContent from /unstyled.
    expect(screen.getByRole("listbox")).toHaveAttribute("data-finra-ui", "select");
  });

  it("lets a caller replace the content id", async () => {
    const user = userEvent.setup();
    render(
      <Select options={options} placeholder="Pick fruit">
        <SelectTrigger aria-label="Fruit" />
        <SelectContent aria-label="Fruit options" {...{ "data-finra-ui": "my-listbox" }} />
      </Select>,
    );
    await user.click(getTrigger());
    expect(screen.getByRole("listbox")).toHaveAttribute("data-finra-ui", "my-listbox");
  });

  it("scrolls the highlighted option into view while arrowing", () => {
    renderSelect();
    const trigger = getTrigger();
    fireEvent.keyDown(trigger, { key: "ArrowDown" }); // open, active = Apple (0)

    // Focus stays on the trigger under aria-activedescendant, so the browser
    // never scrolls the list and the library has to.
    const scrolls = screen.getAllByRole("option").map((option) => {
      const spy = vi.fn();
      option.scrollIntoView = spy;
      return spy;
    });

    fireEvent.keyDown(trigger, { key: "ArrowDown" }); // skips disabled Banana -> Cherry (2)
    expect(scrolls[2]).toHaveBeenCalledWith({ block: "nearest" });
    expect(scrolls[0]).not.toHaveBeenCalled();
    expect(scrolls[1]).not.toHaveBeenCalled();

    fireEvent.keyDown(trigger, { key: "ArrowUp" }); // back to Apple (0)
    expect(scrolls[0]).toHaveBeenCalledWith({ block: "nearest" });
  });

  it("scrolls the last option into view on End", () => {
    renderSelect();
    const trigger = getTrigger();
    fireEvent.keyDown(trigger, { key: "ArrowDown" }); // open

    const scrolls = screen.getAllByRole("option").map((option) => {
      const spy = vi.fn();
      option.scrollIntoView = spy;
      return spy;
    });

    fireEvent.keyDown(trigger, { key: "End" });
    expect(scrolls[3]).toHaveBeenCalledWith({ block: "nearest" });
  });

  it("throws when a part is used outside a Select", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<SelectTrigger aria-label="x" />)).toThrow(
      /must be used within a <Select>/,
    );
    spy.mockRestore();
  });
});
