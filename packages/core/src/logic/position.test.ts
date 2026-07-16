import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { computeAnchoredPosition, trackAnchoredPosition } from "./position";

// floating-ui autoUpdate observes with ResizeObserver / IntersectionObserver,
// which jsdom lacks; stub them as no-ops so setup succeeds.
class NoopObserver {
  observe(): void {
    /* no-op stub */
  }
  unobserve(): void {
    /* no-op stub */
  }
  disconnect(): void {
    /* no-op stub */
  }
  takeRecords(): unknown[] {
    return [];
  }
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", NoopObserver);
  vi.stubGlobal("IntersectionObserver", NoopObserver);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

function anchor(): { reference: HTMLElement; floating: HTMLElement } {
  const reference = document.createElement("div");
  const floating = document.createElement("div");
  document.body.append(reference, floating);
  return { reference, floating };
}

describe("computeAnchoredPosition", () => {
  it("returns numeric coordinates and the default bottom placement", async () => {
    const { reference, floating } = anchor();

    const pos = await computeAnchoredPosition(reference, floating);
    expect(typeof pos.x).toBe("number");
    expect(typeof pos.y).toBe("number");
    expect(pos.placement).toBe("bottom");

    reference.remove();
    floating.remove();
  });

  it("honours a custom placement with flip/shift disabled and an offset", async () => {
    const { reference, floating } = anchor();

    const pos = await computeAnchoredPosition(reference, floating, {
      placement: "top",
      offset: 8,
      flip: false,
      shift: false,
    });
    // flip/shift off, so the requested placement is preserved.
    expect(pos.placement).toBe("top");

    reference.remove();
    floating.remove();
  });

  it("runs the arrow middleware when an arrow element is supplied", async () => {
    const { reference, floating } = anchor();
    const arrowEl = document.createElement("div");
    floating.appendChild(arrowEl);

    const pos = await computeAnchoredPosition(reference, floating, { arrowElement: arrowEl });
    expect(pos.placement).toBe("bottom");

    reference.remove();
    floating.remove();
  });
});

describe("trackAnchoredPosition", () => {
  it("invokes onUpdate and returns a cleanup function", async () => {
    const { reference, floating } = anchor();
    const onUpdate = vi.fn();

    const cleanup = trackAnchoredPosition(reference, floating, onUpdate);
    expect(typeof cleanup).toBe("function");
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalled());

    cleanup();
    reference.remove();
    floating.remove();
  });
});
