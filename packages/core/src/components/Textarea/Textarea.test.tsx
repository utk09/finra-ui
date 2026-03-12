import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Textarea } from "./Textarea";

describe("Textarea", () => {
  it("renders textarea element", () => {
    render(<Textarea />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("textbox").tagName).toBe("TEXTAREA");
  });

  it('has data-finra-ui="textarea" attribute', () => {
    render(<Textarea />);
    expect(screen.getByTestId("textarea")).toBeInTheDocument();
  });

  it("forwards ref", () => {
    const ref = vi.fn();
    render(<Textarea ref={ref} />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLTextAreaElement));
  });

  it("applies primary variant by default", () => {
    render(<Textarea />);
    const wrapper = screen.getByTestId("textarea");
    expect(wrapper.className).toMatch(/variantPrimary/);
  });

  it("applies secondary variant", () => {
    render(<Textarea variant="secondary" />);
    const wrapper = screen.getByTestId("textarea");
    expect(wrapper.className).toMatch(/variantSecondary/);
  });

  it("applies tertiary variant", () => {
    render(<Textarea variant="tertiary" />);
    const wrapper = screen.getByTestId("textarea");
    expect(wrapper.className).toMatch(/variantTertiary/);
  });

  it("applies error validation status class", () => {
    render(<Textarea validationStatus="error" />);
    const wrapper = screen.getByTestId("textarea");
    expect(wrapper.className).toMatch(/statusError/);
  });

  it("applies warning validation status class", () => {
    render(<Textarea validationStatus="warning" />);
    const wrapper = screen.getByTestId("textarea");
    expect(wrapper.className).toMatch(/statusWarning/);
  });

  it("applies success validation status class", () => {
    render(<Textarea validationStatus="success" />);
    const wrapper = screen.getByTestId("textarea");
    expect(wrapper.className).toMatch(/statusSuccess/);
  });

  it("shows character count when showCharCount and maxLength set", () => {
    render(<Textarea showCharCount maxLength={100} />);
    expect(screen.getByText("0/100")).toBeInTheDocument();
  });

  it("updates character count on typing", async () => {
    const user = userEvent.setup();
    render(<Textarea showCharCount maxLength={100} />);

    await user.type(screen.getByRole("textbox"), "hello");
    expect(screen.getByText("5/100")).toBeInTheDocument();
  });

  it("enforces maxLength", () => {
    render(<Textarea maxLength={5} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("maxlength", "5");
  });

  it("shows warning color when approaching threshold", async () => {
    const user = userEvent.setup();
    render(<Textarea showCharCount maxLength={10} warningThreshold={8} />);

    await user.type(screen.getByRole("textbox"), "12345678");

    const countEl = screen.getByTestId("textarea-count");
    expect(countEl.className).toMatch(/charCountWarning/);
  });

  it("shows error color when at limit", async () => {
    const user = userEvent.setup();
    render(<Textarea showCharCount maxLength={5} warningThreshold={3} />);

    await user.type(screen.getByRole("textbox"), "12345");

    const countEl = screen.getByTestId("textarea-count");
    expect(countEl.className).toMatch(/charCountError/);
  });

  it("is disabled when disabled", () => {
    render(<Textarea disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("applies disabled class to wrapper", () => {
    render(<Textarea disabled />);
    const wrapper = screen.getByTestId("textarea");
    expect(wrapper.className).toMatch(/disabled/);
  });

  it("applies fullWidth class", () => {
    render(<Textarea fullWidth />);
    const wrapper = screen.getByTestId("textarea");
    expect(wrapper.className).toMatch(/fullWidth/);
  });

  it("auto-resizes when autoResize is set", async () => {
    const user = userEvent.setup();
    render(<Textarea autoResize minRows={2} />);
    const textarea = screen.getByRole("textbox");

    await user.type(textarea, "Line 1\nLine 2\nLine 3\nLine 4\nLine 5");
    // The textarea height should be adjusted (style.height is set)
    expect(textarea.style.height).toBeTruthy();
  });

  it("respects maxRows when autoResize is set", async () => {
    const user = userEvent.setup();
    render(<Textarea autoResize minRows={1} maxRows={3} />);
    const textarea = screen.getByRole("textbox");

    await user.type(textarea, "a\nb\nc\nd\ne\nf");
    expect(textarea.style.height).toBeTruthy();
  });

  it("syncs charCount when controlled value changes", () => {
    const { rerender } = render(
      <Textarea showCharCount maxLength={100} value="hi" onChange={vi.fn()} />,
    );
    expect(screen.getByText("2/100")).toBeInTheDocument();

    rerender(<Textarea showCharCount maxLength={100} value="hello" onChange={vi.fn()} />);
    expect(screen.getByText("5/100")).toBeInTheDocument();
  });

  it("applies readOnly attribute", () => {
    render(<Textarea readOnly />);
    expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
  });

  it("does not show char count when showCharCount is false", () => {
    render(<Textarea maxLength={100} />);
    expect(screen.queryByTestId("textarea-count")).not.toBeInTheDocument();
  });

  it("applies error validation status to wrapper when at limit", async () => {
    const user = userEvent.setup();
    render(<Textarea showCharCount maxLength={3} warningThreshold={2} />);
    await user.type(screen.getByRole("textbox"), "abc");
    const wrapper = screen.getByTestId("textarea");
    expect(wrapper.className).toMatch(/statusError/);
  });
});
