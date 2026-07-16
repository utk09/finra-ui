import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./Dialog";

function renderDialog() {
  return render(
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogTitle>Delete item</DialogTitle>
        <DialogDescription>This cannot be undone.</DialogDescription>
        <DialogClose>Close</DialogClose>
      </DialogContent>
    </Dialog>,
  );
}

describe("Dialog (styled)", () => {
  it("applies the data-finra-ui identifiers to each part when open", () => {
    renderDialog();
    fireEvent.click(screen.getByText("Open"));

    expect(screen.getByRole("dialog")).toHaveAttribute("data-finra-ui", "dialog");
    expect(screen.getByTestId("dialog-title")).toHaveTextContent("Delete item");
    expect(screen.getByTestId("dialog-description")).toHaveTextContent("This cannot be undone.");
    expect(screen.getByTestId("dialog-close")).toBeInTheDocument();
  });

  it("applies the panel class to the content", () => {
    renderDialog();
    fireEvent.click(screen.getByText("Open"));
    expect(screen.getByRole("dialog").className).toMatch(/panel/);
  });

  it("closes via the styled close button", () => {
    renderDialog();
    fireEvent.click(screen.getByText("Open"));
    fireEvent.click(screen.getByTestId("dialog-close"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
