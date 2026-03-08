import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PillInput } from "./PillInput";

describe("PillInput", () => {
  it("renders a text input", () => {
    render(<PillInput aria-label="Tags" />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it('has data-finra-ui="pill-input" attribute', () => {
    const { container } = render(<PillInput aria-label="Tags" />);
    expect(container.querySelector('[data-finra-ui="pill-input"]')).toBeInTheDocument();
  });

  it("forwards ref to input", () => {
    const ref = vi.fn();
    render(<PillInput ref={ref} aria-label="Tags" />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it("shows placeholder when empty", () => {
    render(<PillInput aria-label="Tags" placeholder="Add tags..." />);
    expect(screen.getByPlaceholderText("Add tags...")).toBeInTheDocument();
  });

  it("adds pill on Enter", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<PillInput aria-label="Tags" onChange={handleChange} />);
    const input = screen.getByRole("textbox");

    await user.type(input, "React{Enter}");
    expect(handleChange).toHaveBeenCalledWith(["React"]);
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("does not add duplicate pills", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<PillInput aria-label="Tags" onChange={handleChange} />);
    const input = screen.getByRole("textbox");

    await user.type(input, "React{Enter}");
    await user.type(input, "React{Enter}");

    // Should have been called once for the first add, then not again for duplicate
    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
    expect(lastCall[0]).toEqual(["React"]);
  });

  it("does not add empty pills", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<PillInput aria-label="Tags" onChange={handleChange} />);
    const input = screen.getByRole("textbox");

    await user.type(input, "   {Enter}");
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("removes pill on remove button click", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<PillInput aria-label="Tags" values={["React", "Vue"]} onChange={handleChange} />);

    const removeButton = screen.getByLabelText("Remove React");
    await user.click(removeButton);

    expect(handleChange).toHaveBeenCalledWith(["Vue"]);
  });

  it("removes last pill on Backspace with empty input", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<PillInput aria-label="Tags" values={["React", "Vue"]} onChange={handleChange} />);
    const input = screen.getByRole("textbox");

    await user.click(input);
    await user.keyboard("{Backspace}");

    expect(handleChange).toHaveBeenCalledWith(["React"]);
  });

  it("renders controlled values as pills", () => {
    render(<PillInput aria-label="Tags" values={["React", "Vue", "Angular"]} />);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Vue")).toBeInTheDocument();
    expect(screen.getByText("Angular")).toBeInTheDocument();
  });

  it("respects maxPills", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<PillInput aria-label="Tags" maxPills={2} onChange={handleChange} />);
    const input = screen.getByRole("textbox");

    await user.type(input, "React{Enter}");
    await user.type(input, "Vue{Enter}");
    await user.type(input, "Angular{Enter}");

    // The third should not be added
    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
    expect(lastCall[0]).toEqual(["React", "Vue"]);
  });

  it("supports custom delimiters", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<PillInput aria-label="Tags" delimiters={[","]} onChange={handleChange} />);
    const input = screen.getByRole("textbox");

    await user.type(input, "React,");
    expect(handleChange).toHaveBeenCalledWith(["React"]);
  });

  it("applies disabled state", () => {
    const { container } = render(<PillInput aria-label="Tags" disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
    const wrapper = container.querySelector('[data-finra-ui="pill-input"]');
    expect(wrapper?.className).toMatch(/disabled/);
  });

  it("hides remove buttons when disabled", () => {
    render(<PillInput aria-label="Tags" values={["React"]} disabled />);
    expect(screen.queryByLabelText("Remove React")).not.toBeInTheDocument();
  });

  it("hides placeholder when pills exist", () => {
    render(<PillInput aria-label="Tags" values={["React"]} placeholder="Add tags..." />);
    expect(screen.queryByPlaceholderText("Add tags...")).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<PillInput aria-label="Tags" className="my-class" />);
    const wrapper = container.querySelector('[data-finra-ui="pill-input"]');
    expect(wrapper?.className).toContain("my-class");
  });
});
