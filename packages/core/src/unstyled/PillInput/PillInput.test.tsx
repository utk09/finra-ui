import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PillInputBase } from "./PillInput";

describe("PillInputBase", () => {
  it("renders an input element", () => {
    render(<PillInputBase aria-label="Tags" />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders with placeholder when no pills", () => {
    render(<PillInputBase aria-label="Tags" placeholder="Add tag..." />);
    expect(screen.getByPlaceholderText("Add tag...")).toBeInTheDocument();
  });

  it("adds pill on Enter", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<PillInputBase aria-label="Tags" onChange={handleChange} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "react{Enter}");
    expect(handleChange).toHaveBeenCalledWith(["react"]);
  });

  it("clears input after adding pill", async () => {
    const user = userEvent.setup();
    render(<PillInputBase aria-label="Tags" />);

    const input = screen.getByRole("textbox");
    await user.type(input, "react{Enter}");
    expect(input).toHaveValue("");
  });

  it("does not add duplicate pills", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<PillInputBase aria-label="Tags" values={["react"]} onChange={handleChange} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "react{Enter}");
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("does not add empty pill", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<PillInputBase aria-label="Tags" onChange={handleChange} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "{Enter}");
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("removes pill on remove button click", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<PillInputBase aria-label="Tags" values={["react", "vue"]} onChange={handleChange} />);

    const removeBtn = screen.getByRole("button", { name: "Remove react" });
    await user.click(removeBtn);
    expect(handleChange).toHaveBeenCalledWith(["vue"]);
  });

  it("removes last pill on Backspace when input is empty", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<PillInputBase aria-label="Tags" values={["react", "vue"]} onChange={handleChange} />);

    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.keyboard("{Backspace}");
    expect(handleChange).toHaveBeenCalledWith(["react"]);
  });

  it("respects maxPills", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PillInputBase
        aria-label="Tags"
        values={["react", "vue"]}
        maxPills={2}
        onChange={handleChange}
      />,
    );

    const input = screen.getByRole("textbox");
    await user.type(input, "angular{Enter}");
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("adds pill on custom delimiter", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<PillInputBase aria-label="Tags" delimiters={[","]} onChange={handleChange} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "react,");
    expect(handleChange).toHaveBeenCalledWith(["react"]);
  });

  it("disabled state prevents interaction", () => {
    render(<PillInputBase aria-label="Tags" disabled values={["react"]} />);
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Remove react" })).not.toBeInTheDocument();
  });

  it("focuses input on container click", async () => {
    const user = userEvent.setup();
    render(<PillInputBase aria-label="Tags" />);

    const container = screen.getByRole("toolbar");
    await user.click(container);
    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("does not focus input on container click when disabled", async () => {
    const user = userEvent.setup();
    render(<PillInputBase aria-label="Tags" disabled />);

    const container = screen.getByRole("toolbar");
    await user.click(container);
    expect(screen.getByRole("textbox")).not.toHaveFocus();
  });

  it("focuses input on container Enter/Space keydown", () => {
    render(<PillInputBase aria-label="Tags" />);

    const container = screen.getByRole("toolbar");
    const input = screen.getByRole("textbox");

    container.focus();
    const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
    container.dispatchEvent(event);
    expect(input).toHaveFocus();
  });

  it("does not focus on container keydown when disabled", () => {
    render(<PillInputBase aria-label="Tags" disabled />);

    const container = screen.getByRole("toolbar");
    const input = screen.getByRole("textbox");

    const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
    container.dispatchEvent(event);
    expect(input).not.toHaveFocus();
  });

  it("works in uncontrolled mode", async () => {
    const user = userEvent.setup();
    render(<PillInputBase aria-label="Tags" />);

    const input = screen.getByRole("textbox");
    await user.type(input, "react{Enter}");

    expect(screen.getByText("react")).toBeInTheDocument();
  });

  it("forwards ref to input", () => {
    const ref = vi.fn();
    render(<PillInputBase ref={ref} aria-label="Tags" />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it("hides placeholder when pills exist", () => {
    render(<PillInputBase aria-label="Tags" placeholder="Add tag..." values={["react"]} />);
    expect(screen.queryByPlaceholderText("Add tag...")).not.toBeInTheDocument();
  });
});
