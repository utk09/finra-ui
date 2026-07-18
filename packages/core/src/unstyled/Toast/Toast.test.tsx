import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { toast } from "../../logic/toast";
import { Toaster } from "./Toast";

afterEach(() => {
  act(() => {
    toast.clear();
  });
});

describe("Toaster", () => {
  it("renders queued toasts in a labelled live region", () => {
    render(<Toaster />);
    act(() => {
      toast.success({ title: "Saved", description: "All good" });
    });
    expect(screen.getByRole("region", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("All good")).toBeInTheDocument();
  });

  it("renders a title-only toast", () => {
    render(<Toaster />);
    act(() => {
      toast({ title: "Solo" });
    });
    expect(screen.getByText("Solo")).toBeInTheDocument();
  });

  it("uses role=alert for danger/warning and role=status otherwise", () => {
    render(<Toaster />);
    act(() => {
      toast.error("boom");
    });
    expect(screen.getByRole("alert")).toHaveTextContent("boom");

    act(() => {
      toast.clear();
      toast.info("fyi");
    });
    expect(screen.getByRole("status")).toHaveTextContent("fyi");
  });

  it("dismisses via the close button", async () => {
    const user = userEvent.setup();
    render(<Toaster />);
    act(() => {
      toast("bye");
    });
    await user.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(screen.queryByText("bye")).not.toBeInTheDocument();
  });

  it("runs the action then dismisses", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Toaster />);
    act(() => {
      toast({ description: "Undo?", action: { label: "Undo", onClick } });
    });
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByText("Undo?")).not.toBeInTheDocument();
  });

  it("pauses auto-dismiss on hover and resumes on leave", () => {
    vi.useFakeTimers();
    try {
      render(<Toaster />);
      act(() => {
        toast({ description: "hoverme", duration: 1000 });
      });
      const item = screen.getByRole("status");

      fireEvent.mouseEnter(item);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText("hoverme")).toBeInTheDocument();

      fireEvent.mouseLeave(item);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.queryByText("hoverme")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders a custom toast via renderToast", () => {
    render(<Toaster renderToast={(t) => <div>custom-{t.description}</div>} />);
    act(() => {
      toast("hi");
    });
    expect(screen.getByText("custom-hi")).toBeInTheDocument();
  });

  it("reflects the position prop on the region", () => {
    render(<Toaster position="top-center" />);
    expect(screen.getByRole("region")).toHaveAttribute("data-position", "top-center");
  });
});
