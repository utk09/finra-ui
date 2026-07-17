import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Select, SelectContent, SelectTrigger } from "./Select";

const options = [
  { value: "a", label: "Apple" },
  { value: "c", label: "Cherry" },
];

function renderSelect() {
  return render(
    <Select options={options} placeholder="Pick">
      <SelectTrigger aria-label="Fruit" />
      <SelectContent aria-label="Fruit options" />
    </Select>,
  );
}

describe("Select (styled)", () => {
  it("applies data-finra-ui identifiers and classes", async () => {
    const user = userEvent.setup();
    renderSelect();

    const trigger = screen.getByRole("combobox", { name: "Fruit" });
    expect(trigger).toHaveAttribute("data-finra-ui", "select-trigger");
    expect(trigger.className).toMatch(/trigger/);

    await user.click(trigger);
    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("data-finra-ui", "select");
    expect(listbox.className).toMatch(/listbox/);
    expect(screen.getAllByRole("option")[0]).toHaveAttribute("data-finra-ui", "select-option");
  });

  it("selects an option and reflects the label on the trigger", async () => {
    const user = userEvent.setup();
    renderSelect();
    const trigger = screen.getByRole("combobox", { name: "Fruit" });
    await user.click(trigger);
    await user.click(screen.getByRole("option", { name: "Cherry" }));

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveTextContent("Cherry");
  });
});
