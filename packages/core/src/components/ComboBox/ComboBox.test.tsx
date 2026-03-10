import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  // ─── Rendering ───

  it("renders with placeholder", () => {
    render(<ComboBox options={options} value={null} onChange={vi.fn()} placeholder="Select..." />);
    expect(screen.getByPlaceholderText("Select...")).toBeInTheDocument();
  });

  it('has data-finra-ui="combo-box" attribute', () => {
    const { container } = render(
      <ComboBox options={options} value={null} onChange={vi.fn()} placeholder="Select" />,
    );
    expect(container.querySelector('[data-finra-ui="combo-box"]')).toBeInTheDocument();
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

  // ─── Opening / closing ───

  it("opens dropdown on focus", async () => {
    const user = userEvent.setup();
    render(<ComboBox options={options} value={null} onChange={vi.fn()} placeholder="Select" />);

    await user.click(screen.getByRole("searchbox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("opens on ArrowDown", async () => {
    const user = userEvent.setup();
    render(<ComboBox options={options} value={null} onChange={vi.fn()} placeholder="Select" />);

    const input = screen.getByRole("searchbox");
    await user.click(input);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(<ComboBox options={options} value={null} onChange={vi.fn()} placeholder="Select" />);

    await user.click(screen.getByRole("searchbox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  // ─── Selection ───

  it("selects option on click (single)", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ComboBox options={options} value={null} onChange={handleChange} placeholder="Select" />,
    );

    await user.click(screen.getByRole("searchbox"));
    await user.click(screen.getByRole("option", { name: "Apple" }));

    expect(handleChange).toHaveBeenCalledWith("apple");
  });

  it("selects option via keyboard Enter", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ComboBox options={options} value={null} onChange={handleChange} placeholder="Select" />,
    );

    const input = screen.getByRole("searchbox");
    await user.click(input);
    await user.keyboard("{ArrowDown}{Enter}");

    expect(handleChange).toHaveBeenCalledWith("apple");
  });

  it("displays selected value label", () => {
    render(<ComboBox options={options} value="banana" onChange={vi.fn()} placeholder="Select" />);
    const input = screen.getByRole("searchbox");
    expect(input).toHaveValue("Banana");
  });

  // ─── Typeahead / filtering ───

  it("filters options as user types", async () => {
    const user = userEvent.setup();
    render(<ComboBox options={options} value={null} onChange={vi.fn()} placeholder="Select" />);

    const input = screen.getByRole("searchbox");
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

    await user.click(screen.getByRole("searchbox"));
    await user.type(screen.getByRole("searchbox"), "xyz");

    expect(screen.getByText("Nothing found")).toBeInTheDocument();
  });

  // ─── Multi-select ───

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

    await user.click(screen.getByRole("searchbox"));
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

    const input = screen.getByRole("searchbox");
    await user.click(input);
    await user.keyboard("{Backspace}");

    expect(handleChange).toHaveBeenCalledWith(["apple"]);
  });

  // ─── Groups & favourites ───

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

    await user.click(screen.getByRole("searchbox"));
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

    await user.click(screen.getByRole("searchbox"));
    expect(screen.getByText("Major")).toBeInTheDocument();
    expect(screen.getByText("Minor")).toBeInTheDocument();
  });

  // ─── Header / footer ───

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

    await user.click(screen.getByRole("searchbox"));
    expect(screen.getByText("Header content")).toBeInTheDocument();
    expect(screen.getByText("Footer content")).toBeInTheDocument();
  });

  // ─── Async / loading ───

  it("shows loading state", async () => {
    const user = userEvent.setup();
    render(<ComboBox options={[]} value={null} onChange={vi.fn()} loading placeholder="Select" />);

    await user.click(screen.getByRole("searchbox"));
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

    await user.type(screen.getByRole("searchbox"), "ban");
    expect(handleLoad).toHaveBeenCalledWith("ban");
  });

  // ─── Creatable ───

  it("shows create option when creatable and no match", async () => {
    const user = userEvent.setup();
    render(
      <ComboBox options={options} value={null} onChange={vi.fn()} creatable placeholder="Select" />,
    );

    await user.type(screen.getByRole("searchbox"), "Mango");
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

    await user.type(screen.getByRole("searchbox"), "Mango");
    await user.click(screen.getByText('Create "Mango"'));
    expect(handleCreate).toHaveBeenCalledWith("Mango");
  });

  it("does not show create option when input matches existing", async () => {
    const user = userEvent.setup();
    render(
      <ComboBox options={options} value={null} onChange={vi.fn()} creatable placeholder="Select" />,
    );

    await user.type(screen.getByRole("searchbox"), "Apple");
    expect(screen.queryByText(/Create/)).not.toBeInTheDocument();
  });

  // ─── Disabled ───

  it("applies disabled state", () => {
    const { container } = render(
      <ComboBox options={options} value={null} onChange={vi.fn()} disabled placeholder="Select" />,
    );
    expect(screen.getByRole("searchbox")).toBeDisabled();
    const combobox = screen.getByRole("combobox");
    expect(combobox).toHaveAttribute("aria-disabled", "true");
    const wrapper = container.querySelector('[data-finra-ui="combo-box"]');
    expect(wrapper).toBeInTheDocument();
  });

  // ─── Variants / validation ───

  it("applies fullWidth class", () => {
    const { container } = render(
      <ComboBox options={options} value={null} onChange={vi.fn()} fullWidth placeholder="Select" />,
    );
    const wrapper = container.querySelector('[data-finra-ui="combo-box"]');
    expect(wrapper?.className).toMatch(/fullWidth/);
  });

  it("applies custom className", () => {
    const { container } = render(
      <ComboBox
        options={options}
        value={null}
        onChange={vi.fn()}
        className="my-class"
        placeholder="Select"
      />,
    );
    const wrapper = container.querySelector('[data-finra-ui="combo-box"]');
    expect(wrapper?.className).toContain("my-class");
  });

  // ─── Keyboard navigation ───

  it("navigates options with arrow keys", async () => {
    const user = userEvent.setup();
    render(<ComboBox options={options} value={null} onChange={vi.fn()} placeholder="Select" />);

    const input = screen.getByRole("searchbox");
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

    const input = screen.getByRole("searchbox");
    await user.click(input);
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");

    // Should wrap to first
    const firstOption = screen.getByRole("option", { name: "Alpha" });
    expect(firstOption).toHaveAttribute("data-highlighted", "true");
  });

  // ─── Custom format create label ───

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

    await user.type(screen.getByRole("searchbox"), "Kiwi");
    expect(screen.getByText("Add new: Kiwi")).toBeInTheDocument();
  });
});
