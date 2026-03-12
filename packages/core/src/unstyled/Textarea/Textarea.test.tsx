import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TextareaBase } from "./Textarea";

describe("TextareaBase", () => {
  it("renders a textarea element by default", () => {
    render(<TextareaBase aria-label="Comment" />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("textbox").tagName).toBe("TEXTAREA");
  });

  it("forwards ref", () => {
    const ref = vi.fn();
    render(<TextareaBase ref={ref} aria-label="Comment" />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLTextAreaElement));
  });

  it("renders as Slot when asChild is true", () => {
    render(
      <TextareaBase asChild aria-label="Comment">
        <textarea placeholder="Write here" rows={5} />
      </TextareaBase>,
    );
    const textarea = screen.getByPlaceholderText("Write here");
    expect(textarea).toHaveAttribute("aria-label", "Comment");
    expect(textarea).toHaveAttribute("rows", "5");
  });

  it("passes props through", () => {
    render(<TextareaBase aria-label="Comment" disabled placeholder="Write" />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveAttribute("placeholder", "Write");
  });
});
