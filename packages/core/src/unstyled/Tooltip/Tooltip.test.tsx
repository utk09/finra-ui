import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Tooltip, TooltipContent, type TooltipProps, TooltipTrigger } from "./Tooltip";

function Example(props: Omit<TooltipProps, "children">) {
  return (
    <Tooltip openDelay={100} closeDelay={50} {...props}>
      <TooltipTrigger>Hover me</TooltipTrigger>
      <TooltipContent>Helpful hint</TooltipContent>
    </Tooltip>
  );
}

describe("Tooltip", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("is hidden initially", () => {
    render(<Example />);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows on pointer enter after the open delay", () => {
    render(<Example />);
    fireEvent.pointerEnter(screen.getByText("Hover me"));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(100));
    expect(screen.getByRole("tooltip")).toHaveTextContent("Helpful hint");
  });

  it("hides on pointer leave after the close delay", () => {
    render(<Example />);
    fireEvent.pointerEnter(screen.getByText("Hover me"));
    act(() => vi.advanceTimersByTime(100));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.pointerLeave(screen.getByText("Hover me"));
    act(() => vi.advanceTimersByTime(50));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows on focus and hides on blur", () => {
    render(<Example />);
    fireEvent.focus(screen.getByText("Hover me"));
    act(() => vi.advanceTimersByTime(100));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.blur(screen.getByText("Hover me"));
    act(() => vi.advanceTimersByTime(50));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("hides immediately on Escape (no close delay)", () => {
    render(<Example />);
    fireEvent.focus(screen.getByText("Hover me"));
    act(() => vi.advanceTimersByTime(100));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.keyDown(screen.getByText("Hover me"), { key: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("links the trigger to the tooltip via aria-describedby only while open", () => {
    render(<Example />);
    const trigger = screen.getByText("Hover me");
    expect(trigger).not.toHaveAttribute("aria-describedby");

    fireEvent.pointerEnter(trigger);
    act(() => vi.advanceTimersByTime(100));
    expect(trigger).toHaveAttribute("aria-describedby", screen.getByRole("tooltip").id);
  });

  it("renders the trigger onto a child element with asChild", () => {
    render(
      <Tooltip openDelay={0}>
        <TooltipTrigger asChild>
          <a href="#x">link</a>
        </TooltipTrigger>
        <TooltipContent>hint</TooltipContent>
      </Tooltip>,
    );

    const link = screen.getByText("link");
    expect(link.tagName).toBe("A");
    fireEvent.pointerEnter(link);
    act(() => vi.advanceTimersByTime(0));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("throws when a part is used outside a Tooltip", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<TooltipTrigger>x</TooltipTrigger>)).toThrow(/within a <Tooltip>/);
    spy.mockRestore();
  });
});
