import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { ComboBox, type ComboBoxOption } from "./ComboBox";

const options: ComboBoxOption[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "date", label: "Date" },
];

const currencyOptions: ComboBoxOption[] = [
  { value: "USDKRW", label: "USDKRW", group: "Major", favourite: true },
  { value: "EURUSD", label: "EURUSD", group: "Major", favourite: true },
  { value: "GBPUSD", label: "GBPUSD", group: "Major" },
  { value: "USDJPY", label: "USDJPY", group: "Major" },
  { value: "AUDUSD", label: "AUDUSD", group: "Minor" },
  { value: "NZDUSD", label: "NZDUSD", group: "Minor" },
];

describe("ComboBox", () => {
  //  Rendering

  it("renders with placeholder", () => {
    render(<ComboBox options={options} value={null} onChange={vi.fn()} placeholder="Select..." />);
    expect(screen.getByPlaceholderText("Select...")).toBeInTheDocument();
  });

  it('has data-finra-ui="combo-box" attribute', () => {
    render(<ComboBox options={options} value={null} onChange={vi.fn()} placeholder="Select" />);
    expect(screen.getByTestId("combo-box")).toBeInTheDocument();
  });

  it("forwards ref to input", () => {
    const ref = vi.fn();
    render(
      <ComboBox ref={ref} options={options} value={null} onChange={vi.fn()} placeholder="Select" />,
    );
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it("has combobox role", () => {
    render(<ComboBox options={options} value={null} onChange={vi.fn()} placeholder="Select" />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  //  Opening / closing

  it("opens dropdown on focus", async () => {
    const user = userEvent.setup();
    render(<ComboBox options={options} value={null} onChange={vi.fn()} placeholder="Select" />);

    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("opens on ArrowDown", async () => {
    const user = userEvent.setup();
    render(<ComboBox options={options} value={null} onChange={vi.fn()} placeholder="Select" />);

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(<ComboBox options={options} value={null} onChange={vi.fn()} placeholder="Select" />);

    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  //  Selection

  it("selects option on click (single)", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ComboBox options={options} value={null} onChange={handleChange} placeholder="Select" />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Apple" }));

    expect(handleChange).toHaveBeenCalledWith("apple");
  });

  it("selects option via keyboard Enter", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ComboBox options={options} value={null} onChange={handleChange} placeholder="Select" />,
    );

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{ArrowDown}{Enter}");

    expect(handleChange).toHaveBeenCalledWith("apple");
  });

  it("displays selected value label", () => {
    render(<ComboBox options={options} value="banana" onChange={vi.fn()} placeholder="Select" />);
    const input = screen.getByRole("combobox");
    expect(input).toHaveValue("Banana");
  });

  //  Typeahead / filtering

  it("filters options as user types", async () => {
    const user = userEvent.setup();
    render(<ComboBox options={options} value={null} onChange={vi.fn()} placeholder="Select" />);

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "ch");

    expect(screen.getByRole("option", { name: "Cherry" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Apple" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Banana" })).not.toBeInTheDocument();
  });

  it("shows no options message when filter matches nothing", async () => {
    const user = userEvent.setup();
    render(
      <ComboBox
        options={options}
        value={null}
        onChange={vi.fn()}
        placeholder="Select"
        noOptionsMessage="Nothing found"
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByRole("combobox"), "xyz");

    expect(screen.getByText("Nothing found")).toBeInTheDocument();
  });

  //  Multi-select

  it("selects multiple values", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ComboBox
        options={options}
        value={[]}
        onChange={handleChange}
        multiple
        placeholder="Select"
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Apple" }));

    expect(handleChange).toHaveBeenCalledWith(["apple"]);
  });

  it("renders pills in multi-select mode", () => {
    render(
      <ComboBox
        options={options}
        value={["apple", "cherry"]}
        onChange={vi.fn()}
        multiple
        placeholder="Select"
      />,
    );
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Cherry")).toBeInTheDocument();
  });

  it("removes pill on remove button click", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ComboBox
        options={options}
        value={["apple", "cherry"]}
        onChange={handleChange}
        multiple
        placeholder="Select"
      />,
    );

    await user.click(screen.getByLabelText("Remove Apple"));
    expect(handleChange).toHaveBeenCalledWith(["cherry"]);
  });

  it("removes last pill on Backspace with empty input", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ComboBox
        options={options}
        value={["apple", "cherry"]}
        onChange={handleChange}
        multiple
        placeholder="Select"
      />,
    );

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{Backspace}");

    expect(handleChange).toHaveBeenCalledWith(["apple"]);
  });

  //  Groups & favourites

  it("renders favourites group", async () => {
    const user = userEvent.setup();
    render(
      <ComboBox
        options={currencyOptions}
        value={null}
        onChange={vi.fn()}
        placeholder="Select currency"
      />,
    );

    await user.click(screen.getByRole("combobox"));
    expect(screen.getByText("Favourites")).toBeInTheDocument();
  });

  it("renders named groups", async () => {
    const user = userEvent.setup();
    render(
      <ComboBox
        options={currencyOptions}
        value={null}
        onChange={vi.fn()}
        placeholder="Select currency"
      />,
    );

    await user.click(screen.getByRole("combobox"));
    expect(screen.getByText("Major")).toBeInTheDocument();
    expect(screen.getByText("Minor")).toBeInTheDocument();
  });

  //  Header / footer

  it("renders header and footer", async () => {
    const user = userEvent.setup();
    render(
      <ComboBox
        options={options}
        value={null}
        onChange={vi.fn()}
        placeholder="Select"
        header={<span>Header content</span>}
        footer={<span>Footer content</span>}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    expect(screen.getByText("Header content")).toBeInTheDocument();
    expect(screen.getByText("Footer content")).toBeInTheDocument();
  });

  //  Async / loading

  it("shows loading state", async () => {
    const user = userEvent.setup();
    render(<ComboBox options={[]} value={null} onChange={vi.fn()} loading placeholder="Select" />);

    await user.click(screen.getByRole("combobox"));
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("calls onLoadOptions when input changes", async () => {
    const handleLoad = vi.fn();
    const user = userEvent.setup();
    render(
      <ComboBox
        options={options}
        value={null}
        onChange={vi.fn()}
        onLoadOptions={handleLoad}
        placeholder="Select"
      />,
    );

    await user.type(screen.getByRole("combobox"), "ban");
    expect(handleLoad).toHaveBeenCalledWith("ban");
  });

  //  Creatable

  it("shows create option when creatable and no match", async () => {
    const user = userEvent.setup();
    render(
      <ComboBox options={options} value={null} onChange={vi.fn()} creatable placeholder="Select" />,
    );

    await user.type(screen.getByRole("combobox"), "Mango");
    expect(screen.getByText('Create "Mango"')).toBeInTheDocument();
  });

  it("calls onCreateOption when create option is clicked", async () => {
    const handleCreate = vi.fn();
    const user = userEvent.setup();
    render(
      <ComboBox
        options={options}
        value={null}
        onChange={vi.fn()}
        creatable
        onCreateOption={handleCreate}
        placeholder="Select"
      />,
    );

    await user.type(screen.getByRole("combobox"), "Mango");
    await user.click(screen.getByText('Create "Mango"'));
    expect(handleCreate).toHaveBeenCalledWith("Mango");
  });

  it("does not show create option when input matches existing", async () => {
    const user = userEvent.setup();
    render(
      <ComboBox options={options} value={null} onChange={vi.fn()} creatable placeholder="Select" />,
    );

    await user.type(screen.getByRole("combobox"), "Apple");
    expect(screen.queryByText(/Create/)).not.toBeInTheDocument();
  });

  //  Disabled

  it("applies disabled state", () => {
    render(
      <ComboBox options={options} value={null} onChange={vi.fn()} disabled placeholder="Select" />,
    );
    // The native `disabled` on the input is the real signal; the shell only
    // carries `data-disabled` for styling (it has no ARIA role any more).
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(screen.getByTestId("combo-box-control")).toHaveAttribute("data-disabled", "true");
    expect(screen.getByTestId("combo-box")).toBeInTheDocument();
  });

  //  Variants / validation

  it("applies fullWidth class", () => {
    render(
      <ComboBox options={options} value={null} onChange={vi.fn()} fullWidth placeholder="Select" />,
    );
    const wrapper = screen.getByTestId("combo-box");
    expect(wrapper.className).toMatch(/fullWidth/);
  });

  it("applies custom className", () => {
    render(
      <ComboBox
        options={options}
        value={null}
        onChange={vi.fn()}
        className="my-class"
        placeholder="Select"
      />,
    );
    const wrapper = screen.getByTestId("combo-box");
    expect(wrapper.className).toContain("my-class");
  });

  //  Keyboard navigation

  it("navigates options with arrow keys", async () => {
    const user = userEvent.setup();
    render(<ComboBox options={options} value={null} onChange={vi.fn()} placeholder="Select" />);

    const input = screen.getByRole("combobox");
    await user.click(input);

    await user.keyboard("{ArrowDown}");
    const firstOption = screen.getByRole("option", { name: "Apple" });
    expect(firstOption).toHaveAttribute("data-highlighted", "true");

    await user.keyboard("{ArrowDown}");
    const secondOption = screen.getByRole("option", { name: "Banana" });
    expect(secondOption).toHaveAttribute("data-highlighted", "true");
  });

  it("wraps around from last to first option", async () => {
    const user = userEvent.setup();
    const shortOptions: ComboBoxOption[] = [
      { value: "a", label: "Alpha" },
      { value: "b", label: "Beta" },
    ];
    render(
      <ComboBox options={shortOptions} value={null} onChange={vi.fn()} placeholder="Select" />,
    );

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");

    // Should wrap to first
    const firstOption = screen.getByRole("option", { name: "Alpha" });
    expect(firstOption).toHaveAttribute("data-highlighted", "true");
  });

  //  Custom format create label

  it("uses custom formatCreateLabel", async () => {
    const user = userEvent.setup();
    render(
      <ComboBox
        options={options}
        value={null}
        onChange={vi.fn()}
        creatable
        formatCreateLabel={(val) => `Add new: ${val}`}
        placeholder="Select"
      />,
    );

    await user.type(screen.getByRole("combobox"), "Kiwi");
    expect(screen.getByText("Add new: Kiwi")).toBeInTheDocument();
  });

  //  Validation status

  it("applies warning validation status class", () => {
    render(
      <ComboBox
        options={options}
        value={null}
        onChange={vi.fn()}
        validationStatus="warning"
        placeholder="Select"
      />,
    );
    const combobox = screen.getByTestId("combo-box-control");
    expect(combobox.className).toMatch(/statusWarning/);
  });

  it("applies success validation status class", () => {
    render(
      <ComboBox
        options={options}
        value={null}
        onChange={vi.fn()}
        validationStatus="success"
        placeholder="Select"
      />,
    );
    const combobox = screen.getByTestId("combo-box-control");
    expect(combobox.className).toMatch(/statusSuccess/);
  });

  it("applies error validation status class", () => {
    render(
      <ComboBox
        options={options}
        value={null}
        onChange={vi.fn()}
        validationStatus="error"
        placeholder="Select"
      />,
    );
    const combobox = screen.getByTestId("combo-box-control");
    expect(combobox.className).toMatch(/statusError/);
  });

  //  Controlled open/input

  it("supports controlled open state", () => {
    render(
      <ComboBox
        options={options}
        value={null}
        onChange={vi.fn()}
        open
        onOpenChange={vi.fn()}
        placeholder="Select"
      />,
    );
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("supports controlled inputValue", () => {
    render(
      <ComboBox
        options={options}
        value={null}
        onChange={vi.fn()}
        inputValue="che"
        onInputChange={vi.fn()}
        open
        placeholder="Select"
      />,
    );
    expect(screen.getByRole("option", { name: "Cherry" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Apple" })).not.toBeInTheDocument();
  });

  //  Keyboard: ArrowUp, Home, End

  it("opens and highlights last on ArrowUp when closed", async () => {
    const user = userEvent.setup();
    render(<ComboBox options={options} value={null} onChange={vi.fn()} placeholder="Select" />);

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{Escape}");
    await user.keyboard("{ArrowUp}");

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    const lastOption = screen.getByRole("option", { name: "Date" });
    expect(lastOption).toHaveAttribute("data-highlighted", "true");
  });

  it("navigates to first option on Home key", async () => {
    const user = userEvent.setup();
    render(<ComboBox options={options} value={null} onChange={vi.fn()} placeholder="Select" />);

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{ArrowDown}{ArrowDown}{Home}");

    const firstOption = screen.getByRole("option", { name: "Apple" });
    expect(firstOption).toHaveAttribute("data-highlighted", "true");
  });

  it("navigates to last option on End key", async () => {
    const user = userEvent.setup();
    render(<ComboBox options={options} value={null} onChange={vi.fn()} placeholder="Select" />);

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{End}");

    const lastOption = screen.getByRole("option", { name: "Date" });
    expect(lastOption).toHaveAttribute("data-highlighted", "true");
  });

  //  Creates via keyboard Enter

  it("creates option via Enter key on create item", async () => {
    const handleCreate = vi.fn();
    const user = userEvent.setup();
    render(
      <ComboBox
        options={options}
        value={null}
        onChange={vi.fn()}
        creatable
        onCreateOption={handleCreate}
        placeholder="Select"
      />,
    );

    const input = screen.getByRole("combobox");
    await user.type(input, "Mango");
    // Navigate past all filtered options (none match) to the create option
    await user.keyboard("{ArrowDown}{Enter}");

    expect(handleCreate).toHaveBeenCalledWith("Mango");
  });

  //  Disabled option click

  it("does not select disabled option on click", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    const optionsWithDisabled: ComboBoxOption[] = [
      { value: "a", label: "Alpha" },
      { value: "b", label: "Beta", disabled: true },
    ];
    render(
      <ComboBox
        options={optionsWithDisabled}
        value={null}
        onChange={handleChange}
        placeholder="Select"
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Beta" }));

    expect(handleChange).not.toHaveBeenCalled();
  });

  //  renderValue in single mode

  it("uses renderValue for single selection display", () => {
    render(
      <ComboBox
        options={options}
        value="apple"
        onChange={vi.fn()}
        renderValue={(opt) => <span data-finra-ui="custom-val">{opt.label.toUpperCase()}</span>}
        placeholder="Select"
      />,
    );
    expect(screen.getByTestId("custom-val")).toHaveTextContent("APPLE");
  });

  //  Multi-select deselect

  it("deselects already selected option in multi mode", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ComboBox
        options={options}
        value={["apple", "banana"]}
        onChange={handleChange}
        multiple
        placeholder="Select"
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Apple" }));

    expect(handleChange).toHaveBeenCalledWith(["banana"]);
  });

  //  Open with Enter when closed

  it("opens dropdown on Enter when closed", async () => {
    const user = userEvent.setup();
    render(<ComboBox options={options} value={null} onChange={vi.fn()} placeholder="Select" />);

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.keyboard("{Enter}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  //  APG 1.2 conformance

  describe("APG 1.2 conformance", () => {
    it("puts the combobox role and its state on the input, not a wrapper", async () => {
      const user = userEvent.setup();
      render(<ComboBox options={options} value={null} onChange={vi.fn()} placeholder="Select" />);

      // Exactly one combobox, and it is the text input.
      const combobox = screen.getByRole("combobox");
      expect(combobox.tagName).toBe("INPUT");
      expect(combobox).toHaveAttribute("aria-expanded", "false");
      expect(combobox).toHaveAttribute("aria-haspopup", "listbox");
      expect(combobox).toHaveAttribute("aria-autocomplete", "list");
      expect(combobox).not.toHaveAttribute("aria-controls");

      await user.click(combobox);
      expect(combobox).toHaveAttribute("aria-expanded", "true");
      expect(combobox).toHaveAttribute("aria-controls", screen.getByRole("listbox").id);
    });

    it("closes the listbox on Tab and lets focus move on", async () => {
      const user = userEvent.setup();
      render(
        <>
          <ComboBox options={options} value={null} onChange={vi.fn()} placeholder="Select" />
          <button type="button">After</button>
        </>,
      );

      await user.click(screen.getByRole("combobox"));
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      await user.tab();
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    });

    it("opens with Alt+ArrowDown without activating an option", async () => {
      const user = userEvent.setup();
      render(<ComboBox options={options} value={null} onChange={vi.fn()} placeholder="Select" />);

      const input = screen.getByRole("combobox");
      act(() => input.focus());
      await user.keyboard("{Escape}");

      await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(input).not.toHaveAttribute("aria-activedescendant");
    });

    it("announces the result count in a live region", async () => {
      const user = userEvent.setup();
      render(<ComboBox options={options} value={null} onChange={vi.fn()} placeholder="Select" />);

      const status = screen.getByRole("status");
      expect(status).toBeEmptyDOMElement();

      await user.click(screen.getByRole("combobox"));
      expect(status).toHaveTextContent(`${options.length} results available`);
    });

    it("announces when filtering leaves no results", async () => {
      const user = userEvent.setup();
      render(<ComboBox options={options} value={null} onChange={vi.fn()} placeholder="Select" />);

      await user.type(screen.getByRole("combobox"), "zzzz");
      expect(screen.getByRole("status")).toHaveTextContent("No results available");
    });

    it("singularises the announcement for a single result", async () => {
      const user = userEvent.setup();
      render(<ComboBox options={options} value={null} onChange={vi.fn()} placeholder="Select" />);

      await user.type(screen.getByRole("combobox"), "cherry");
      expect(screen.getByRole("status")).toHaveTextContent("1 result available");
    });

    it("accepts a custom result-count formatter", async () => {
      const user = userEvent.setup();
      render(
        <ComboBox
          options={options}
          value={null}
          onChange={vi.fn()}
          placeholder="Select"
          formatResultCount={(count) => `${count} matches`}
        />,
      );

      await user.click(screen.getByRole("combobox"));
      expect(screen.getByRole("status")).toHaveTextContent("4 matches");
    });
  });

  //  Keyboard-reachable pills (multi-select)

  describe("pill keyboard access", () => {
    function renderMulti(onChange = vi.fn()) {
      render(
        <ComboBox
          options={options}
          value={["apple", "banana"]}
          onChange={onChange}
          multiple
          placeholder="Select"
        />,
      );
      return onChange;
    }

    it("exposes exactly one pill in the tab order", () => {
      renderMulti();
      expect(screen.getByLabelText("Remove Apple")).toHaveAttribute("tabindex", "0");
      expect(screen.getByLabelText("Remove Banana")).toHaveAttribute("tabindex", "-1");
    });

    it("removes a pill with the Delete key", async () => {
      const user = userEvent.setup();
      const onChange = renderMulti();

      act(() => screen.getByLabelText("Remove Apple").focus());
      await user.keyboard("{Delete}");

      expect(onChange).toHaveBeenCalledWith(["banana"]);
    });

    it("removes a pill with Enter (a real button, not a div)", async () => {
      const user = userEvent.setup();
      const onChange = renderMulti();

      act(() => screen.getByLabelText("Remove Banana").focus());
      await user.keyboard("{Enter}");

      expect(onChange).toHaveBeenCalledWith(["apple"]);
    });

    it("moves between pills with the arrow keys", async () => {
      const user = userEvent.setup();
      renderMulti();

      act(() => screen.getByLabelText("Remove Apple").focus());
      await user.keyboard("{ArrowRight}");
      expect(screen.getByLabelText("Remove Banana")).toHaveFocus();

      await user.keyboard("{ArrowLeft}");
      expect(screen.getByLabelText("Remove Apple")).toHaveFocus();
    });

    it("steps off the last pill back into the input", async () => {
      const user = userEvent.setup();
      renderMulti();

      act(() => screen.getByLabelText("Remove Banana").focus());
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("combobox")).toHaveFocus();
    });

    it("enters the pill list with ArrowLeft from the start of the input", async () => {
      const user = userEvent.setup();
      renderMulti();

      act(() => screen.getByRole("combobox").focus());
      await user.keyboard("{ArrowLeft}");
      expect(screen.getByLabelText("Remove Banana")).toHaveFocus();
    });

    it("groups the pills in a list for assistive tech", () => {
      renderMulti();
      expect(screen.getAllByRole("listitem")).toHaveLength(2);
    });

    // The tests above hold `value` static, so the parent never actually applies
    // the removal. These drive a real stateful parent, which is the only way the
    // post-removal focus handoff is exercised.
    function StatefulMulti({ initial }: { initial: string[] }) {
      const [value, setValue] = useState<string[] | null>(initial);
      return (
        <ComboBox
          options={options}
          value={value}
          onChange={(next) => setValue(next as string[] | null)}
          multiple
          placeholder="Select"
        />
      );
    }

    it("moves focus to the pill that takes the removed one's place", async () => {
      const user = userEvent.setup();
      render(<StatefulMulti initial={["apple", "banana", "cherry"]} />);

      act(() => screen.getByLabelText("Remove Banana").focus());
      await user.keyboard("{Delete}");

      expect(screen.queryByLabelText("Remove Banana")).toBeNull();
      // Cherry slid into Banana's index, so focus follows the position.
      expect(screen.getByLabelText("Remove Cherry")).toHaveFocus();
    });

    it("returns focus to the input when the last pill is removed", async () => {
      const user = userEvent.setup();
      render(<StatefulMulti initial={["apple"]} />);

      act(() => screen.getByLabelText("Remove Apple").focus());
      await user.keyboard("{Delete}");

      expect(screen.queryByRole("listitem")).toBeNull();
      expect(screen.getByRole("combobox")).toHaveFocus();
    });

    it("does not steal focus on a later change when a removal was declined", async () => {
      const user = userEvent.setup();
      // Controlled parent that ignores removals but accepts additions - the
      // shape that used to leave a focus target armed indefinitely.
      function DecliningParent() {
        const [value, setValue] = useState<string[] | null>(["apple", "banana"]);
        return (
          <ComboBox
            options={options}
            value={value}
            onChange={(next) => {
              const arr = (next as string[] | null) ?? [];
              if (arr.length >= 2) setValue(arr);
            }}
            multiple
            placeholder="Select"
          />
        );
      }
      render(<DecliningParent />);

      act(() => screen.getByLabelText("Remove Apple").focus());
      await user.keyboard("{Delete}"); // declined: still two pills
      expect(screen.getAllByRole("listitem")).toHaveLength(2);

      // An unrelated accepted change must not drag focus back into the pills.
      await user.click(screen.getByRole("combobox"));
      await user.click(screen.getByRole("option", { name: "Cherry" }));

      expect(screen.getByRole("combobox")).toHaveFocus();
    });
  });
});
