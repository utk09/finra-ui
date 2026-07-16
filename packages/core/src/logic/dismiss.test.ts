import { describe, expect, it, vi } from "vitest";

import { type DismissLayerHandle, getEscapeTarget, getOutsideDismissals } from "./dismiss";

function makeLayer(overrides: Partial<DismissLayerHandle> = {}): DismissLayerHandle {
  return {
    getElement: () => null,
    onDismiss: vi.fn(),
    ...overrides,
  };
}

describe("getEscapeTarget", () => {
  it("returns undefined for an empty stack", () => {
    expect(getEscapeTarget([])).toBeUndefined();
  });

  it("returns the topmost layer", () => {
    const a = makeLayer();
    const b = makeLayer();
    expect(getEscapeTarget([a, b])).toBe(b);
  });

  it("returns undefined when the topmost layer opts out (no cascade to lower)", () => {
    const a = makeLayer();
    const b = makeLayer({ disableEscape: true });
    expect(getEscapeTarget([a, b])).toBeUndefined();
  });
});

describe("getOutsideDismissals", () => {
  it("dismisses every layer, top-down, when the point is outside all of them", () => {
    const a = makeLayer();
    const b = makeLayer();
    expect(getOutsideDismissals([a, b], () => false)).toEqual([b, a]);
  });

  it("dismisses nothing when the point is inside the topmost layer", () => {
    const a = makeLayer();
    const b = makeLayer();
    expect(getOutsideDismissals([a, b], (layer) => layer === b)).toEqual([]);
  });

  it("dismisses the inner layer but stops at the layer containing the point", () => {
    const outer = makeLayer();
    const inner = makeLayer();
    // point falls inside outer but outside inner
    expect(getOutsideDismissals([outer, inner], (layer) => layer === outer)).toEqual([inner]);
  });

  it("skips a layer that opts out of outside-dismiss without blocking lower layers", () => {
    const a = makeLayer();
    const b = makeLayer({ disableOutsidePointer: true });
    expect(getOutsideDismissals([a, b], () => false)).toEqual([a]);
  });
});
