import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  type DialogProps,
  DialogTitle,
  DialogTrigger,
} from "./Dialog";

function Example(props: Omit<DialogProps, "children">) {
  return (
    <Dialog {...props}>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogTitle>The title</DialogTitle>
        <DialogDescription>The description</DialogDescription>
        <button>focusable</button>
        <DialogClose>Close</DialogClose>
      </DialogContent>
    </Dialog>
  );
}

describe("Dialog", () => {
  it("is closed initially - content is not rendered", () => {
    render(<Example />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens when the trigger is clicked", () => {
    render(<Example />);
    fireEvent.click(screen.getByText("Open"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("sets aria-modal and links the title and description", () => {
    render(<Example />);
    fireEvent.click(screen.getByText("Open"));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");

    const labelledBy = dialog.getAttribute("aria-labelledby");
    const describedBy = dialog.getAttribute("aria-describedby");
    expect(screen.getByText("The title")).toHaveAttribute("id", labelledBy);
    expect(screen.getByText("The description")).toHaveAttribute("id", describedBy);
  });

  it("omits aria-labelledby/describedby and honours aria-label when there is no Title/Description", () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent aria-label="Bare dialog">
          <button>x</button>
        </DialogContent>
      </Dialog>,
    );
    fireEvent.click(screen.getByText("Open"));

    const dialog = screen.getByRole("dialog");
    expect(dialog).not.toHaveAttribute("aria-labelledby");
    expect(dialog).not.toHaveAttribute("aria-describedby");
    expect(dialog).toHaveAttribute("aria-label", "Bare dialog");
  });

  it("moves focus to the first tabbable inside on open", () => {
    render(<Example />);
    fireEvent.click(screen.getByText("Open"));
    expect(screen.getByText("focusable")).toHaveFocus();
  });

  it("locks body scroll while open and restores it on close", () => {
    render(<Example />);
    fireEvent.click(screen.getByText("Open"));
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(screen.getByText("Close"));
    expect(document.body.style.overflow).toBe("");
  });

  it("closes on the Close button", () => {
    render(<Example />);
    fireEvent.click(screen.getByText("Open"));
    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on Escape", () => {
    render(<Example />);
    fireEvent.click(screen.getByText("Open"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not close on Escape when dismissOnEscape is false", () => {
    render(<Example dismissOnEscape={false} />);
    fireEvent.click(screen.getByText("Open"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes on an outside pointer (backdrop)", () => {
    render(<Example />);
    fireEvent.click(screen.getByText("Open"));

    // eslint-disable-next-line testing-library/no-node-access -- backdrop has no accessible role
    const overlay = document.querySelector('[data-finra-ui="dialog-overlay"]');
    fireEvent.pointerDown(overlay as Element);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("supports controlled open: Close fires onOpenChange but the parent owns the state", () => {
    const onOpenChange = vi.fn();
    render(<Example open onOpenChange={onOpenChange} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Close"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders the trigger onto a child element with asChild", () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <a href="#open">Open link</a>
        </DialogTrigger>
        <DialogContent>
          <button>x</button>
        </DialogContent>
      </Dialog>,
    );

    const link = screen.getByText("Open link");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("aria-haspopup", "dialog");

    fireEvent.click(link);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not close on an outside pointer when dismissOnOutside is false", () => {
    render(<Example dismissOnOutside={false} />);
    fireEvent.click(screen.getByText("Open"));

    // eslint-disable-next-line testing-library/no-node-access -- backdrop has no accessible role
    const overlay = document.querySelector('[data-finra-ui="dialog-overlay"]');
    fireEvent.pointerDown(overlay as Element);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("respects preventDefault on the trigger's onClick", () => {
    render(
      <Dialog>
        <DialogTrigger onClick={(event) => event.preventDefault()}>Open</DialogTrigger>
        <DialogContent>
          <button>x</button>
        </DialogContent>
      </Dialog>,
    );

    fireEvent.click(screen.getByText("Open"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("throws when a part is used outside a Dialog", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<DialogTrigger>x</DialogTrigger>)).toThrow(/within a <Dialog>/);
    spy.mockRestore();
  });
});
