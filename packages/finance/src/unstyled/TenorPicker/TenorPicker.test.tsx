import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
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
    // Remove 3M from favourites.
    await user.click(screen.getByRole("button", { name: "Remove 3M from favourites" }));
    expect(onFavouriteChange).toHaveBeenCalledWith("3M", false, []);
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
    expect(screen.queryByRole("button", { name: /favourites/i })).not.toBeInTheDocument();
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
    await user.click(screen.getByRole("button", { name: "Add 3M to favourites" }));
    expect(onFavouriteChange).toHaveBeenCalledWith("3M", true, ["3M"]);
    // Controlled: no favourites group appears until the parent updates the prop.
    expect(screen.queryByRole("group", { name: "Favourites" })).not.toBeInTheDocument();
  });

  it("exposes an imperative handle", async () => {
    const ref = createRef<TenorPickerHandle>();
    const { onChange } = setup({ ref, defaultValue: "3M" });
    expect(ref.current?.getValue()).toBe("3M");
    ref.current?.clear();
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
});
