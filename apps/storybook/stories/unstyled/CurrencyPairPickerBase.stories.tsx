import type { Meta, StoryObj } from "@storybook/react-vite";
import { type CurrencyPair, CurrencyPairPickerBase } from "@utk09/finra-ui-finance/unstyled";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

const meta: Meta<typeof CurrencyPairPickerBase> = {
  title: "Unstyled/CurrencyPairPickerBase",
  component: CurrencyPairPickerBase,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const usdinrInstruments: CurrencyPair[] = [
  {
    id: "USDINR.ONSHORE",
    baseCurrency: "USD",
    quoteCurrency: "INR",
    displayName: "Onshore",
    settlementStyle: "Deliverable",
  },
  {
    id: "USDINR.NDF",
    baseCurrency: "USD",
    quoteCurrency: "INR",
    displayName: "Non-deliverable",
    settlementStyle: "NDF",
    requiresTenor: true,
  },
];

/**
 * One currency pair can be several tradable instruments. USDINR trades onshore
 * (deliverable, RBI fix) and as an NDF (cash-settled, tenor required): same base
 * and quote, different economics. `id` is the **instrument** key, so each gets
 * its own - `baseCurrency + quoteCurrency` names only the pair.
 *
 * Typing `USDINR` therefore names two things, and the base refuses to guess:
 * it reports `ambiguous` and leaves the list open so the rows are the choice.
 * Entirely a behaviour concern, so it is visible with no styling at all.
 */
export const OnePairSeveralInstruments: Story = {
  render: () => {
    const [status, setStatus] = useState("");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 360 }}>
        <CurrencyPairPickerBase
          aria-label="Instrument"
          pairs={usdinrInstruments}
          onChange={(pair) => setStatus(pair ? `Selected ${pair.id}` : "")}
          onInvalid={(reason) => setStatus(`Rejected: ${reason}`)}
        />
        <p style={{ margin: 0 }}>{status}</p>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Instrument" });

    await userEvent.type(input, "usdinr");
    // Portalled, so the listbox is outside the story canvas even unstyled.
    const body = within(document.body);
    await expect(within(await body.findByRole("listbox")).getAllByRole("option")).toHaveLength(2);

    await userEvent.keyboard("{Enter}");
    await expect(await canvas.findByText("Rejected: ambiguous")).toBeInTheDocument();

    await userEvent.click(await body.findByRole("option", { name: /Non-deliverable/ }));
    await expect(await canvas.findByText("Selected USDINR.NDF")).toBeInTheDocument();
  },
};
