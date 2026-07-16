import { describe, expect, it } from "vitest";

import {
  type ComboBoxKeyContext,
  type ComboBoxOptionLike,
  defaultFilter,
  flattenOptions,
  groupOptions,
  resolveComboBoxKey,
  resolveSelectOption,
  shouldShowCreateOption,
} from "./combobox";

//  Pure filter / grouping

describe("defaultFilter", () => {
  it("keeps every option when the input is empty", () => {
    expect(defaultFilter({ value: "a", label: "Apple" }, "")).toBe(true);
  });

  it("matches case-insensitively on a substring", () => {
    expect(defaultFilter({ value: "a", label: "Apple" }, "PL")).toBe(true);
    expect(defaultFilter({ value: "a", label: "Apple" }, "xy")).toBe(false);
  });
});

describe("groupOptions", () => {
  it("partitions into favourites, named groups, and ungrouped", () => {
    const { favourites, groups, ungrouped } = groupOptions([
      { value: "1", label: "One", favourite: true, group: "G" },
      { value: "2", label: "Two", group: "G" },
      { value: "3", label: "Three" },
    ]);

    expect(favourites.map((o) => o.value)).toEqual(["1"]);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ label: "G" });
    expect(groups[0].options.map((o) => o.value)).toEqual(["1", "2"]);
    expect(ungrouped.map((o) => o.value)).toEqual(["3"]);
  });
});

//  Keyboard resolver — mirrors the original ComboBoxBase switch branch-for-branch

/** Sensible open-with-options default; override per test. */
function ctx(overrides: Partial<ComboBoxKeyContext> = {}): ComboBoxKeyContext {
  return {
    isOpen: true,
    disabled: false,
    highlightedIndex: 0,
    totalNavigable: 4,
    flatOptionsLength: 4,
    showCreateOption: false,
    multiple: false,
    inputValueEmpty: true,
    selectedCount: 0,
    ...overrides,
  };
}

describe("resolveComboBoxKey", () => {
  it("swallows every key when disabled (no preventDefault, no effects)", () => {
    for (const key of ["ArrowDown", "ArrowUp", "Enter", "Escape", "Home", "End", "Backspace"]) {
      expect(resolveComboBoxKey(key, ctx({ disabled: true }))).toEqual({
        preventDefault: false,
        effects: [],
      });
    }
  });

  it("ignores unmapped keys", () => {
    expect(resolveComboBoxKey("a", ctx())).toEqual({ preventDefault: false, effects: [] });
    expect(resolveComboBoxKey("Tab", ctx())).toEqual({ preventDefault: false, effects: [] });
  });

  //  ArrowDown

  it("ArrowDown when closed opens and highlights the first option", () => {
    expect(resolveComboBoxKey("ArrowDown", ctx({ isOpen: false }))).toEqual({
      preventDefault: true,
      effects: [
        { kind: "setOpen", open: true },
        { kind: "setHighlight", index: 0 },
      ],
    });
  });

  it("ArrowDown when open moves to the next option", () => {
    expect(
      resolveComboBoxKey("ArrowDown", ctx({ highlightedIndex: 1, totalNavigable: 4 })),
    ).toEqual({ preventDefault: true, effects: [{ kind: "setHighlight", index: 2 }] });
  });

  it("ArrowDown wraps from the last option to the first", () => {
    expect(
      resolveComboBoxKey("ArrowDown", ctx({ highlightedIndex: 3, totalNavigable: 4 })),
    ).toEqual({ preventDefault: true, effects: [{ kind: "setHighlight", index: 0 }] });
  });

  //  ArrowUp

  it("ArrowUp when closed opens and highlights the last option", () => {
    expect(resolveComboBoxKey("ArrowUp", ctx({ isOpen: false, totalNavigable: 4 }))).toEqual({
      preventDefault: true,
      effects: [
        { kind: "setOpen", open: true },
        { kind: "setHighlight", index: 3 },
      ],
    });
  });

  it("ArrowUp when open moves to the previous option", () => {
    expect(resolveComboBoxKey("ArrowUp", ctx({ highlightedIndex: 2, totalNavigable: 4 }))).toEqual({
      preventDefault: true,
      effects: [{ kind: "setHighlight", index: 1 }],
    });
  });

  it("ArrowUp wraps from the first option to the last", () => {
    expect(resolveComboBoxKey("ArrowUp", ctx({ highlightedIndex: 0, totalNavigable: 4 }))).toEqual({
      preventDefault: true,
      effects: [{ kind: "setHighlight", index: 3 }],
    });
  });

  //  Enter

  it("Enter selects the highlighted option", () => {
    expect(resolveComboBoxKey("Enter", ctx({ highlightedIndex: 2, flatOptionsLength: 4 }))).toEqual(
      { preventDefault: true, effects: [{ kind: "selectOption", index: 2 }] },
    );
  });

  it("Enter on the create affordance emits createOption", () => {
    // highlight sits just past the flat options, at the create row
    expect(
      resolveComboBoxKey(
        "Enter",
        ctx({
          highlightedIndex: 4,
          flatOptionsLength: 4,
          showCreateOption: true,
          totalNavigable: 5,
        }),
      ),
    ).toEqual({ preventDefault: true, effects: [{ kind: "createOption" }] });
  });

  it("Enter past the flat options with no create affordance is a no-op (but still preventDefault)", () => {
    expect(
      resolveComboBoxKey(
        "Enter",
        ctx({ highlightedIndex: 4, flatOptionsLength: 4, showCreateOption: false }),
      ),
    ).toEqual({ preventDefault: true, effects: [] });
  });

  it("Enter when closed opens the menu", () => {
    expect(resolveComboBoxKey("Enter", ctx({ isOpen: false }))).toEqual({
      preventDefault: true,
      effects: [{ kind: "setOpen", open: true }],
    });
  });

  it("Enter when open with nothing highlighted is a no-op (but still preventDefault)", () => {
    expect(resolveComboBoxKey("Enter", ctx({ isOpen: true, highlightedIndex: -1 }))).toEqual({
      preventDefault: true,
      effects: [],
    });
  });

  //  Escape

  it("Escape when open closes and clears the highlight", () => {
    expect(resolveComboBoxKey("Escape", ctx({ isOpen: true }))).toEqual({
      preventDefault: true,
      effects: [
        { kind: "setOpen", open: false },
        { kind: "setHighlight", index: -1 },
      ],
    });
  });

  it("Escape when closed does nothing (no preventDefault)", () => {
    expect(resolveComboBoxKey("Escape", ctx({ isOpen: false }))).toEqual({
      preventDefault: false,
      effects: [],
    });
  });

  //  Backspace

  it("Backspace removes the last value in multi-select with empty input", () => {
    expect(
      resolveComboBoxKey(
        "Backspace",
        ctx({ multiple: true, inputValueEmpty: true, selectedCount: 2 }),
      ),
    ).toEqual({ preventDefault: false, effects: [{ kind: "removeLastValue" }] });
  });

  it("Backspace does nothing when not multi-select", () => {
    expect(
      resolveComboBoxKey(
        "Backspace",
        ctx({ multiple: false, inputValueEmpty: true, selectedCount: 2 }),
      ),
    ).toEqual({ preventDefault: false, effects: [] });
  });

  it("Backspace does nothing when the input still has text", () => {
    expect(
      resolveComboBoxKey(
        "Backspace",
        ctx({ multiple: true, inputValueEmpty: false, selectedCount: 2 }),
      ),
    ).toEqual({ preventDefault: false, effects: [] });
  });

  it("Backspace does nothing when nothing is selected", () => {
    expect(
      resolveComboBoxKey(
        "Backspace",
        ctx({ multiple: true, inputValueEmpty: true, selectedCount: 0 }),
      ),
    ).toEqual({ preventDefault: false, effects: [] });
  });

  //  Home / End

  it("Home when open highlights the first option", () => {
    expect(resolveComboBoxKey("Home", ctx({ isOpen: true, highlightedIndex: 3 }))).toEqual({
      preventDefault: true,
      effects: [{ kind: "setHighlight", index: 0 }],
    });
  });

  it("End when open highlights the last option", () => {
    expect(resolveComboBoxKey("End", ctx({ isOpen: true, totalNavigable: 4 }))).toEqual({
      preventDefault: true,
      effects: [{ kind: "setHighlight", index: 3 }],
    });
  });

  it("Home and End do nothing when closed", () => {
    expect(resolveComboBoxKey("Home", ctx({ isOpen: false }))).toEqual({
      preventDefault: false,
      effects: [],
    });
    expect(resolveComboBoxKey("End", ctx({ isOpen: false }))).toEqual({
      preventDefault: false,
      effects: [],
    });
  });
});

//  Flattening — must match the rendered listbox order

describe("flattenOptions", () => {
  it("orders favourites, then group non-favourites, then ungrouped non-favourites", () => {
    const options: ComboBoxOptionLike[] = [
      { value: "fav1", label: "Fav1", favourite: true },
      { value: "g1a", label: "G1A", group: "G1" },
      { value: "g1fav", label: "G1Fav", group: "G1", favourite: true },
      { value: "g2a", label: "G2A", group: "G2" },
      { value: "u1", label: "U1" },
    ];

    // favourites first (fav1, g1fav), then group non-favs (g1a, g2a), then ungrouped non-favs (u1)
    expect(flattenOptions(options).map((o) => o.value)).toEqual([
      "fav1",
      "g1fav",
      "g1a",
      "g2a",
      "u1",
    ]);
  });

  it("returns an empty list for no options", () => {
    expect(flattenOptions([])).toEqual([]);
  });
});

//  Create affordance

describe("shouldShowCreateOption", () => {
  const options: ComboBoxOptionLike[] = [{ value: "a", label: "Apple" }];

  it("is false when not creatable", () => {
    expect(shouldShowCreateOption({ creatable: false, inputValue: "New", options })).toBe(false);
  });

  it("is false when the input is blank or whitespace", () => {
    expect(shouldShowCreateOption({ creatable: true, inputValue: "", options })).toBe(false);
    expect(shouldShowCreateOption({ creatable: true, inputValue: "   ", options })).toBe(false);
  });

  it("is false when an option label already matches (case-insensitive, trimmed)", () => {
    expect(shouldShowCreateOption({ creatable: true, inputValue: "  apple ", options })).toBe(
      false,
    );
  });

  it("is true for a novel, non-blank input", () => {
    expect(shouldShowCreateOption({ creatable: true, inputValue: "Banana", options })).toBe(true);
  });
});

//  Selection decision

describe("resolveSelectOption", () => {
  it("returns null for a disabled option", () => {
    expect(
      resolveSelectOption(
        { value: "a", label: "A", disabled: true },
        { multiple: false, selectedValues: [] },
      ),
    ).toBeNull();
  });

  it("single-select sets the value, shows the label, and closes", () => {
    expect(
      resolveSelectOption({ value: "a", label: "Apple" }, { multiple: false, selectedValues: [] }),
    ).toEqual({ nextValue: "a", inputValue: "Apple", close: true });
  });

  it("multi-select adds an unselected value, clears input, stays open", () => {
    expect(
      resolveSelectOption({ value: "b", label: "B" }, { multiple: true, selectedValues: ["a"] }),
    ).toEqual({ nextValue: ["a", "b"], inputValue: "", close: false });
  });

  it("multi-select toggles off an already-selected value", () => {
    expect(
      resolveSelectOption(
        { value: "a", label: "A" },
        { multiple: true, selectedValues: ["a", "b"] },
      ),
    ).toEqual({ nextValue: ["b"], inputValue: "", close: false });
  });

  it("multi-select toggling off the last value yields an empty array (not null)", () => {
    // selectOption differs from removeValue here: it emits [] rather than null
    expect(
      resolveSelectOption({ value: "a", label: "A" }, { multiple: true, selectedValues: ["a"] }),
    ).toEqual({ nextValue: [], inputValue: "", close: false });
  });
});
