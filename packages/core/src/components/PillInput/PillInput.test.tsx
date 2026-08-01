import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PillInput } from "./PillInput";

describe("PillInput", () => {
  it("renders a text input", () => {
    render(<PillInput aria-label="Tags" />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it('has data-finra-ui="pill-input" attribute', () => {
    render(<PillInput aria-label="Tags" />);
    expect(screen.getByTestId("pill-input")).toBeInTheDocument();
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
    render(<PillInput aria-label="Tags" disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
    const wrapper = screen.getByTestId("pill-input");
    expect(wrapper.className).toMatch(/disabled/);
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
    render(<PillInput aria-label="Tags" className="my-class" />);
    const wrapper = screen.getByTestId("pill-input");
    expect(wrapper.className).toContain("my-class");
  });
});

describe("PillInput — consumer event handlers", () => {
  it("still focuses the input when a consumer passes onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<PillInput aria-label="Tags" onClick={onClick} />);

    // Clicking anywhere in the container is how the whole surface behaves like
    // one field. A consumer observing the click must not cost you that.
    await user.click(screen.getByRole("toolbar"));

    expect(onClick).toHaveBeenCalled();
    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("still focuses the input on Enter when a consumer passes onKeyDown", () => {
    const onKeyDown = vi.fn();
    render(<PillInput aria-label="Tags" onKeyDown={onKeyDown} />);

    fireEvent.keyDown(screen.getByRole("toolbar"), { key: "Enter" });

    expect(onKeyDown).toHaveBeenCalled();
    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("lets a consumer suppress container focus with preventDefault on click", async () => {
    const user = userEvent.setup();
    render(
      <PillInput
        aria-label="Tags"
        onClick={(event) => {
          event.preventDefault();
        }}
      />,
    );

    await user.click(screen.getByRole("toolbar"));

    expect(screen.getByRole("textbox")).not.toHaveFocus();
  });

  it("keeps adding pills on Enter when a consumer passes onKeyDown", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PillInput aria-label="Tags" onChange={onChange} onKeyDown={vi.fn()} />);

    // The pill-creating handler lives on the inner input, so a container-level
    // consumer handler must leave it alone.
    await user.type(screen.getByRole("textbox"), "react{Enter}");

    expect(onChange).toHaveBeenCalledWith(["react"]);
  });
});
