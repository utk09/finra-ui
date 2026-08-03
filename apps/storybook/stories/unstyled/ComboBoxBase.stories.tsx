import type { Meta, StoryObj } from "@storybook/react-vite";
import { ComboBoxBase } from "@utk09/finra-ui/unstyled";
import { expect, userEvent, waitFor, within } from "storybook/test";

const meta: Meta<typeof ComboBoxBase> = {
  title: "Unstyled/ComboBoxBase",
  component: ComboBoxBase,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// The base builds its popup internally, so unlike Select and Menu there is no
// child element to take an inline style: it takes class names instead. These
// mirror `overlayPanel` and `menuItemStyle`, so the three popups read alike.
const popupClasses = {
  listbox: "combo-box-demo-listbox",
  option: "combo-box-demo-option",
  optionHighlighted: "combo-box-demo-option-highlighted",
};

export const Default: Story = {
  render: () => {
    const options = [
      { value: "apple", label: "Apple" },
      { value: "banana", label: "Banana" },
      { value: "cherry", label: "Cherry" },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 300 }}>
        <style>{`
          .combo-box-demo-listbox {
            padding: 0.25rem;
            color: #111111;
            background: #ffffff;
            border: 1px solid #8a8a8a;
            border-radius: 6px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
          }
          .combo-box-demo-option {
            padding: 0.375rem 0.5rem;
            border-radius: 4px;
            cursor: pointer;
          }
          .combo-box-demo-option-highlighted {
            background: #ededed;
          }
        `}</style>
        <ComboBoxBase
          options={options}
          value={null}
          placeholder="Select a fruit..."
          classNames={popupClasses}
        />
        <ComboBoxBase
          options={options}
          value="banana"
          placeholder="With value"
          classNames={popupClasses}
        />
        <ComboBoxBase options={options} value={null} disabled placeholder="Disabled" />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getAllByRole("combobox")[0];
    await expect(input).toBeVisible();
    await userEvent.click(input);
    // The listbox is portalled to <body>, outside the story canvas.
    const listbox = await within(document.body).findByRole("listbox");
    await waitFor(() => expect(listbox).toBeVisible());
  },
};
