import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select, SelectContent, SelectTrigger } from "@utk09/finra-ui/unstyled";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { overlayPanel, triggerButton } from "./_demoStyles";

const meta: Meta<typeof Select> = {
  title: "Unstyled/Select",
  component: Select,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const selectOptions = [
  { value: "aapl", label: "Apple" },
  { value: "msft", label: "Microsoft" },
  { value: "goog", label: "Alphabet" },
];

export const Default: Story = {
  render: () => (
    <div style={{ maxWidth: 240 }}>
      {/*
        Options are built inside `SelectContent`, so there is no element to take
        an inline style. They are reached by their stable id instead, scoped to
        this panel so the rule cannot escape to another Select on the page.
      */}
      <style>{`
        .select-demo-listbox [data-finra-ui="select-option"] {
          padding: 0.375rem 0.5rem;
          border-radius: 4px;
          cursor: pointer;
        }
        .select-demo-listbox [data-finra-ui="select-option"][data-active] {
          background: #ededed;
        }
      `}</style>
      <Select options={selectOptions} placeholder="Select a ticker">
        <SelectTrigger
          aria-label="Ticker"
          style={{ ...triggerButton, inlineSize: "100%", textAlign: "left" }}
        />
        <SelectContent
          aria-label="Tickers"
          className="select-demo-listbox"
          style={{ ...overlayPanel, padding: "0.25rem" }}
        />
      </Select>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: "Ticker" });
    await userEvent.click(trigger);
    // Listbox portals to <body> (APG activedescendant pattern).
    const listbox = await within(document.body).findByRole("listbox");
    await userEvent.click(within(listbox).getByRole("option", { name: "Microsoft" }));
    await waitFor(() => expect(within(document.body).queryByRole("listbox")).toBeNull());
    await expect(trigger).toHaveTextContent("Microsoft");
  },
};
