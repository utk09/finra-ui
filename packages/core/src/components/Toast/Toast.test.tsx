import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { toast } from "../../logic/toast";
import { Toaster } from "./Toast";

afterEach(() => {
  act(() => {
    toast.clear();
  });
});

describe("Toaster (styled)", () => {
  it("applies the region class and forwards position", () => {
    render(<Toaster position="top-right" />);
    const region = screen.getByRole("region", { name: "Notifications" });
    expect(region.className).toMatch(/region/);
    expect(region).toHaveAttribute("data-position", "top-right");
  });

  it("renders a toast with the data-finra-ui + sentiment hooks", () => {
    render(<Toaster />);
    act(() => {
      toast.success({ description: "ok" });
    });
    const item = screen.getByRole("status");
    expect(item).toHaveAttribute("data-finra-ui", "toast");
    expect(item).toHaveAttribute("data-sentiment", "success");
  });

  it("closes with the icon rather than the unstyled text glyph", () => {
    render(<Toaster />);
    act(() => {
      toast("hi");
    });

    const close = screen.getByRole("button", { name: "Dismiss notification" });
    expect(close.innerHTML).toContain("<svg");
    expect(close).not.toHaveTextContent("×");
  });

  it("lets a consumer override the close icon", () => {
    render(<Toaster renderCloseIcon={() => <span>mine</span>} />);
    act(() => {
      toast("hi");
    });
    expect(screen.getByRole("button", { name: "Dismiss notification" })).toHaveTextContent("mine");
  });

  it("forwards dismissLabel to the close button", () => {
    render(<Toaster dismissLabel="Cerrar notificación" />);
    act(() => {
      toast("hi");
    });

    expect(screen.getByRole("button", { name: "Cerrar notificación" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Dismiss notification" })).not.toBeInTheDocument();
  });
});
