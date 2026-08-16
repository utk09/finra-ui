import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { soundEngine } from "../../logic/sound";
import { toast } from "../../logic/toast";
import { Toaster } from "./Toast";

afterEach(() => {
  act(() => {
    toast.clear();
  });
  vi.restoreAllMocks();
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

  it("closes with a text glyph by default, so the unstyled layer ships no icon", () => {
    render(<Toaster />);
    act(() => {
      toast("hi");
    });
    expect(screen.getByRole("button", { name: "Dismiss notification" })).toHaveTextContent("×");
  });

  it("renders renderCloseIcon in the close button instead of the glyph", () => {
    render(<Toaster renderCloseIcon={() => <span>icon</span>} />);
    act(() => {
      toast("hi");
    });

    const close = screen.getByRole("button", { name: "Dismiss notification" });
    expect(close).toHaveTextContent("icon");
    expect(close).not.toHaveTextContent("×");
  });

  it("keeps the close button's accessible name when an icon replaces the glyph", () => {
    render(<Toaster renderCloseIcon={() => <span aria-hidden>icon</span>} />);
    act(() => {
      toast("hi");
    });
    // The label lives on the button, so swapping the glyph cannot strip the name.
    expect(screen.getByRole("button", { name: "Dismiss notification" })).toBeInTheDocument();
  });

  it("still dismisses when the icon is supplied", async () => {
    const user = userEvent.setup();
    render(<Toaster renderCloseIcon={() => <span>icon</span>} />);
    act(() => {
      toast("hi");
    });

    await user.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(screen.queryByText("hi")).not.toBeInTheDocument();
  });

  it("a toast with `sound` renders identically to one without it", () => {
    render(<Toaster />);
    act(() => {
      toast.success({ title: "Filled", description: "2M EURUSD" });
    });
    const withoutSound = screen.getByRole("status").outerHTML;

    act(() => {
      toast.clear();
    });

    act(() => {
      toast.success({ title: "Filled", description: "2M EURUSD", sound: "chime" });
    });
    const withSound = screen.getByRole("status").outerHTML;

    // Same role, same aria-live (inherited from role="status"), same
    // data-sentiment, same text, same accessible names, same data-finra-ui
    // ids: `sound` never reaches `ToastData`, so nothing here can differ.
    // `ToastItem` renders no `toast.id` and no `useId`, so the two toasts'
    // markup is byte-comparable with no normalisation.
    expect(withSound).toBe(withoutSound);
  });

  it("a StrictMode double-render does not replay a toast's cue", () => {
    const play = vi.spyOn(soundEngine, "play");
    render(
      <StrictMode>
        <Toaster />
      </StrictMode>,
    );
    act(() => {
      toast({ description: "Filled", sound: "chime" });
    });
    // The side effect lives in the controller's `add`, called once before
    // React renders anything - there is no effect for StrictMode to double-fire.
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("names the close button through dismissLabel", () => {
    render(<Toaster dismissLabel="Cerrar notificación" />);
    act(() => {
      toast("hi");
    });

    expect(screen.getByRole("button", { name: "Cerrar notificación" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Dismiss notification" })).not.toBeInTheDocument();
  });

  it("still dismisses when the label is translated", async () => {
    const user = userEvent.setup();
    render(<Toaster dismissLabel="Cerrar notificación" />);
    act(() => {
      toast("hi");
    });

    await user.click(screen.getByRole("button", { name: "Cerrar notificación" }));
    expect(screen.queryByText("hi")).not.toBeInTheDocument();
  });
});
