import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { TenorPickerBase, type TenorPickerHandle } from "./TenorPicker";

function setup(props: React.ComponentProps<typeof TenorPickerBase> = {}) {
  const onChange = vi.fn();
  const utils = render(<TenorPickerBase aria-label="Tenor" onChange={onChange} {...props} />);
  const input = screen.getByRole("combobox", { name: "Tenor" });
  return { onChange, input, ...utils };
}

describe("TenorPickerBase", () => {
  it("renders a collapsed combobox", () => {
    setup();
    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("opens on click and shows grouped options", async () => {
    const user = userEvent.setup();
    const { input } = setup();
    await user.click(input);
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("group", { name: "Months" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Years" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /3M/ })).toBeInTheDocument();
  });

  it("commits a clicked option", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup();
    await user.click(input);
    await user.click(screen.getByRole("option", { name: /^3M/ }));
    expect(onChange).toHaveBeenCalledWith("3M");
    expect(input).toHaveValue("3M");
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("commits a typed free-form tenor on Enter", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup();
    await user.type(input, "1y6m");
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("1Y6M");
    expect(input).toHaveValue("1Y6M");
  });

  it("normalises long-form typed input", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup();
    await user.type(input, "3 months");
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("3M");
  });

  it("rejects free-form input when allowCustom is false", async () => {
    const user = userEvent.setup();
    const onInvalid = vi.fn();
    const { onChange, input } = setup({ allowCustom: false, onInvalid });
    await user.type(input, "1y6m");
    await user.keyboard("{Enter}");
    expect(onChange).not.toHaveBeenCalled();
    // Reverts to the (empty) committed value.
    expect(input).toHaveValue("");
  });

  it("reports invalid typed input", async () => {
    const user = userEvent.setup();
    const onInvalid = vi.fn();
    const { onChange, input } = setup({ onInvalid });
    await user.type(input, "zzz");
    await user.keyboard("{Enter}");
    expect(onInvalid).toHaveBeenCalledWith("unrecognized");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("filters options as the user types", async () => {
    const user = userEvent.setup();
    const { input } = setup();
    await user.type(input, "3M");
    // Only the 3M option survives the filter.
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("3M");
  });

  it("navigates with the keyboard and selects on Enter", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup({ tenors: ["1M", "2M", "3M"] });
    await user.click(input);
    await user.keyboard("{ArrowDown}"); // 1M
    await user.keyboard("{ArrowDown}"); // 2M
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("2M");
  });

  it("skips disabled tenors during navigation", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup({ tenors: ["1M", "2M", "3M"], disabledTenors: ["2M"] });
    await user.click(input);
    await user.keyboard("{ArrowDown}"); // 1M
    await user.keyboard("{ArrowDown}"); // skips 2M -> 3M
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("3M");
  });

  it("closes on Escape without committing", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup();
    await user.type(input, "3M");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("closes on an outside pointer", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TenorPickerBase aria-label="Tenor" />
        <button type="button">Outside</button>
      </>,
    );

    const input = screen.getByRole("combobox", { name: "Tenor" });
    await user.click(input);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    // `pointerdown`, not `mousedown` - the latter is not synthesised reliably
    // on iOS Safari, so a mousedown-based dismiss silently fails on touch.
    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("pins favourites into a first group and toggles via the star", async () => {
    const user = userEvent.setup();
    const onFavouriteChange = vi.fn();
    const { input } = setup({
      defaultFavourites: ["3M"],
      onFavouriteChange,
      renderFavourite: (active) => (active ? "★" : "☆"),
    });
    await user.click(input);
    const groups = screen.getAllByRole("group");
    expect(groups[0]).toHaveAccessibleName("Favourites");
    // The star is decorative; favourite state rides on the option's name.
    const option = screen.getByRole("option", { name: "3M, favourite" });
    // Remove 3M from favourites by clicking the star.
    await user.click(within(option).getByText("★"));
    expect(onFavouriteChange).toHaveBeenCalledWith("3M", false, []);
  });

  it("keeps options free of nested interactive controls", async () => {
    const user = userEvent.setup();
    const { input } = setup({
      defaultFavourites: ["3M"],
      renderFavourite: (active) => (active ? "★" : "☆"),
    });
    await user.click(input);

    // A listbox option may not contain interactive descendants (axe
    // `nested-interactive`); the favourite toggle used to be a <button>.
    expect(within(screen.getByRole("listbox")).queryByRole("button")).toBeNull();
  });

  it("toggles the highlighted option's favourite with Ctrl+D", async () => {
    const user = userEvent.setup();
    const onFavouriteChange = vi.fn();
    const { input } = setup({
      favourites: [],
      onFavouriteChange,
      renderFavourite: (active) => (active ? "★" : "☆"),
    });

    await user.click(input);
    await user.keyboard("{ArrowDown}"); // highlight the first option
    await user.keyboard("{Control>}d{/Control}");

    expect(onFavouriteChange).toHaveBeenCalledTimes(1);
    expect(onFavouriteChange.mock.calls[0][1]).toBe(true);
  });

  it("ignores Ctrl+D when favourites are hidden", async () => {
    const user = userEvent.setup();
    const onFavouriteChange = vi.fn();
    const { input } = setup({
      showFavourites: false,
      onFavouriteChange,
      renderFavourite: () => "☆",
    });

    await user.click(input);
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Control>}d{/Control}");

    expect(onFavouriteChange).not.toHaveBeenCalled();
  });

  it("hides favourites entirely when showFavourites is false", async () => {
    const user = userEvent.setup();
    const { input } = setup({
      defaultFavourites: ["3M"],
      showFavourites: false,
      renderFavourite: () => "☆",
    });
    await user.click(input);
    expect(screen.queryByRole("group", { name: "Favourites" })).not.toBeInTheDocument();
    expect(screen.queryByText("☆")).not.toBeInTheDocument();
  });

  it("supports controlled favourites", async () => {
    const user = userEvent.setup();
    const onFavouriteChange = vi.fn();
    const { input } = setup({
      favourites: [],
      onFavouriteChange,
      renderFavourite: (active) => (active ? "★" : "☆"),
    });
    await user.click(input);
    const option = screen.getByRole("option", { name: "3M" });
    await user.click(within(option).getByText("☆"));
    expect(onFavouriteChange).toHaveBeenCalledWith("3M", true, ["3M"]);
    // Controlled: no favourites group appears until the parent updates the prop.
    expect(screen.queryByRole("group", { name: "Favourites" })).not.toBeInTheDocument();
  });

  it("exposes an imperative handle", async () => {
    const ref = createRef<TenorPickerHandle>();
    const { onChange, input } = setup({ ref, defaultValue: "3M" });
    expect(ref.current?.getValue()).toBe("3M");

    act(() => ref.current?.focus());
    expect(input).toHaveFocus();

    // clear() commits through component state, so React must flush it.
    act(() => ref.current?.clear());
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("does not open when disabled", async () => {
    const user = userEvent.setup();
    const { input } = setup({ disabled: true });
    await user.click(input);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not open or commit when read-only", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup({ readOnly: true, defaultValue: "3M" });
    await user.click(input);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await user.keyboard("{ArrowDown}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue("3M");
  });

  it("opens with ArrowDown from a closed field", async () => {
    const user = userEvent.setup();
    const { input } = setup();
    input.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("navigates back up with ArrowUp", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup({ tenors: ["1M", "2M", "3M"] });
    await user.click(input);
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowUp}");
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("1M");
  });

  it("scrolls the highlighted option into view while arrowing", async () => {
    const user = userEvent.setup();
    const { input } = setup({ tenors: ["1M", "2M", "3M"] });
    await user.click(input);

    // Focus stays on the input under aria-activedescendant, so the browser
    // never scrolls the popup and the library has to. The popup caps its height
    // with --finra-popup-max-block-size, so anything past the fold is invisible
    // without this.
    const scrolls = screen.getAllByRole("option").map((option) => {
      const spy = vi.fn();
      option.scrollIntoView = spy;
      return spy;
    });

    await user.keyboard("{ArrowDown}"); // 1M
    expect(scrolls[0]).toHaveBeenCalledWith({ block: "nearest" });

    await user.keyboard("{ArrowDown}"); // 2M
    expect(scrolls[1]).toHaveBeenCalledWith({ block: "nearest" });

    await user.keyboard("{ArrowUp}"); // back to 1M
    expect(scrolls[0]).toHaveBeenCalledTimes(2);
    expect(scrolls[2]).not.toHaveBeenCalled();
  });

  it("opens with Ctrl+Space", async () => {
    const user = userEvent.setup();
    const { input } = setup();
    input.focus();
    await user.keyboard("{Control>} {/Control}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("clears the value when the field is emptied and committed", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup({ defaultValue: "3M" });
    await user.clear(input);
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith(null);
    expect(input).toHaveValue("");
  });

  it("rejects a typed tenor that is disabled", async () => {
    const user = userEvent.setup();
    const onInvalid = vi.fn();
    const { onChange, input } = setup({ disabledTenors: ["3M"], onInvalid });
    await user.type(input, "3m");
    await user.keyboard("{Enter}");
    expect(onInvalid).toHaveBeenCalledWith("disabled-tenor");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("commits typed input on blur", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup();
    await user.type(input, "6m");
    await user.tab();
    expect(onChange).toHaveBeenCalledWith("6M");
  });

  it("renders a flat, ungrouped list when grouped is false", async () => {
    const user = userEvent.setup();
    const { input } = setup({ grouped: false, tenors: ["1M", "3M", "1Y"] });
    await user.click(input);
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("distinguishes a malformed tenor from an out-of-range one", async () => {
    const user = userEvent.setup();
    const onInvalid = vi.fn();
    const { input } = setup({ onInvalid });

    // "0M" parses cleanly and is still not a tenor. Collapsing it into
    // "unrecognized" would tell the user their typing was wrong rather than
    // their number.
    await user.type(input, "0M");
    await user.keyboard("{Enter}");
    expect(onInvalid).toHaveBeenCalledWith("invalid-value");
  });

  it("leaves ArrowUp and Escape alone while closed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { onChange, input } = setup({ onClose, defaultValue: "3M" });

    input.focus();
    await user.keyboard("{ArrowUp}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    // Escape on a closed field belongs to whatever surrounds this one - a
    // dialog to dismiss, a form to abandon.
    await user.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue("3M");
  });

  it("does not blur-commit when the text was never edited", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup({ defaultValue: "3M" });

    await user.click(input);
    await user.tab();

    // Opening and leaving is not an edit, so there is nothing to commit and
    // onChange must stay silent.
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue("3M");
  });

  it("does not blur-commit when focus moves into the popup", async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup();

    await user.click(input);
    await user.type(input, "6m");
    fireEvent.blur(input, { relatedTarget: screen.getByRole("listbox") });

    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveAttribute("aria-expanded", "true");
  });

  it("does not commit a highlighted option that has since been disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <TenorPickerBase aria-label="Tenor" tenors={["1M", "2M", "3M"]} onChange={onChange} />,
    );
    const input = screen.getByRole("combobox", { name: "Tenor" });

    await user.click(input);
    await user.keyboard("{ArrowDown}");
    expect(input.getAttribute("aria-activedescendant")).toBe(
      screen.getByRole("option", { name: /1M/ }).id,
    );

    // Roving skips disabled options, but a list that changes under a standing
    // highlight can strand it on one anyway.
    rerender(
      <TenorPickerBase
        aria-label="Tenor"
        tenors={["1M", "2M", "3M"]}
        disabledTenors={["1M"]}
        onChange={onChange}
      />,
    );
    await user.keyboard("{Enter}");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("announces open and close once each, however often it is asked", () => {
    const ref = createRef<TenorPickerHandle>();
    const onOpen = vi.fn();
    const onClose = vi.fn();
    setup({ ref, onOpen, onClose });

    act(() => ref.current?.open());
    act(() => ref.current?.open());
    expect(onOpen).toHaveBeenCalledTimes(1);

    act(() => ref.current?.close());
    act(() => ref.current?.close());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("refuses the imperative open, and a programmatic change, while readOnly", () => {
    const ref = createRef<TenorPickerHandle>();
    const { onChange, input } = setup({ ref, readOnly: true, defaultValue: "3M" });

    act(() => ref.current?.open());
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    // readOnly stops typing, but autofill and IME can still drive a change
    // event, so the handler guards rather than trusting the DOM.
    fireEvent.change(input, { target: { value: "6M" } });
    expect(input).toHaveValue("3M");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("refuses the imperative open while disabled", () => {
    const ref = createRef<TenorPickerHandle>();
    setup({ ref, disabled: true });

    act(() => ref.current?.open());
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("marks the indicator open with the supplied class", async () => {
    const user = userEvent.setup();
    const { input } = setup({
      renderIndicator: (open) => (open ? "up" : "down"),
      classNames: { indicator: "ind", indicatorOpen: "ind-open" },
    });

    expect(screen.getByText("down", { selector: ".ind" })).toBeInTheDocument();
    await user.click(input);
    expect(screen.getByText("up", { selector: ".ind.ind-open" })).toBeInTheDocument();
  });

  it("leaves the indicator unclassed when no classNames are supplied", () => {
    setup({ renderIndicator: (open) => (open ? "up" : "down") });
    // An empty join must collapse to no attribute at all rather than class="".
    expect(screen.getByText("down")).toBeInTheDocument();
    expect(screen.queryByText("down", { selector: "[class]" })).toBeNull();
  });

  it("marks the committed option with a check", async () => {
    const user = userEvent.setup();
    const { input } = setup({
      tenors: ["1M", "3M"],
      defaultValue: "3M",
      renderCheck: () => <span>check</span>,
    });

    await user.click(input);
    const checked = screen.getByRole("option", { name: /3M/ });
    expect(checked).toHaveAttribute("aria-selected", "true");
    expect(within(checked).getByText("check")).toBeInTheDocument();
    expect(within(screen.getByRole("option", { name: /1M/ })).queryByText("check")).toBeNull();
  });
});

describe("TenorPickerBase - display stays tied to the committed value", () => {
  /** A parent that only ever accepts 3M, holding its own value. */
  function Controlled() {
    const [value, setValue] = useState<string | null>("3M");
    return (
      <TenorPickerBase
        aria-label="Tenor"
        value={value}
        onChange={(next) => {
          if (next !== "3M") return;
          setValue(next);
        }}
      />
    );
  }

  it("redraws the held tenor when a controlled parent declines a picked option", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByRole("combobox", { name: "Tenor" });
    expect(input).toHaveValue("3M");

    await user.click(input);
    await user.click(screen.getByRole("option", { name: /6M/ }));

    // The parent kept 3M. Leaving 6M on screen would report a tenor the
    // application never accepted.
    await waitFor(() => expect(input).toHaveValue("3M"));
  });

  it("redraws the held tenor when a controlled parent declines typed text", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByRole("combobox", { name: "Tenor" });

    await user.clear(input);
    await user.type(input, "6M{Enter}");

    await waitFor(() => expect(input).toHaveValue("3M"));
  });
});
