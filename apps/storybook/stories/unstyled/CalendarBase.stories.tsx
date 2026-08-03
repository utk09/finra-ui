import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarBase } from "@utk09/finra-ui-finance/unstyled";
import { useState } from "react";
import { expect, within } from "storybook/test";

const meta: Meta<typeof CalendarBase> = {
  title: "Unstyled/CalendarBase",
  component: CalendarBase,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [selected, setSelected] = useState<Date | null>(null);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 280 }}>
        <CalendarBase
          value={selected}
          onSelect={(d) => setSelected(d)}
          today={new Date(2026, 2, 18)}
        />
        <div style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>
          Selected: {selected ? selected.toISOString().split("T")[0] : "null"}
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("March 2026")).toBeVisible();
  },
};

export const WithConstraints: Story = {
  render: () => {
    const [selected, setSelected] = useState<Date | null>(null);
    const min = new Date(2026, 2, 10);
    const max = new Date(2026, 2, 25);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 280 }}>
        <div style={{ fontSize: "0.75rem", color: "#666" }}>Only March 10–25, 2026 selectable</div>
        <CalendarBase
          value={selected}
          onSelect={(d) => setSelected(d)}
          min={min}
          max={max}
          today={new Date(2026, 2, 18)}
        />
        <div style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>
          Selected: {selected ? selected.toISOString().split("T")[0] : "null"}
        </div>
      </div>
    );
  },
};

export const SundayStart: Story = {
  render: () => {
    const [selected, setSelected] = useState<Date | null>(null);

    return (
      <div style={{ maxWidth: 280 }}>
        <CalendarBase
          value={selected}
          onSelect={(d) => setSelected(d)}
          weekStartsOn={0}
          today={new Date(2026, 2, 18)}
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Assert the column's identity, not its abbreviation: the visible label is
    // Intl-derived and its width is configurable (`weekdayFormat`), but the
    // aria-label is always the full day name.
    const headers = canvas.getAllByRole("columnheader");
    await expect(headers).toHaveLength(7);
    await expect(headers[0]).toHaveAttribute("aria-label", "Sunday");
  },
};
