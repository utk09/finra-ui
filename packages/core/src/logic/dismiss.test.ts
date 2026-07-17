import { describe, expect, it, vi } from "vitest";

import {
  type DismissLayerHandle,
  getEscapeTarget,
  getOutsideDismissals,
  isPointerInsideLayer,
} from "./dismiss";

/** Fake element whose `contains` matches only the given marker node. */
function fakeEl(match: Node | null): Element {
  return { contains: (n: Node | null) => n === match } as unknown as Element;
}

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

describe("isPointerInsideLayer", () => {
  const node = {} as Node;

  it("is false when there is no target node", () => {
    expect(isPointerInsideLayer(makeLayer({ getElement: () => fakeEl(node) }), null)).toBe(false);
  });

  it("is true when the node is inside the layer element", () => {
    expect(isPointerInsideLayer(makeLayer({ getElement: () => fakeEl(node) }), node)).toBe(true);
  });

  it("is false when the layer has no element and no extras", () => {
    // getElement returns null (default) and getExtraElements is undefined.
    expect(isPointerInsideLayer(makeLayer(), node)).toBe(false);
  });

  it("is true when the node is inside an extra element", () => {
    const layer = makeLayer({ getExtraElements: () => [fakeEl(node)] });
    expect(isPointerInsideLayer(layer, node)).toBe(true);
  });

  it("ignores null extras and non-matching elements", () => {
    const other = {} as Node;
    const layer = makeLayer({
      getElement: () => fakeEl(other),
      getExtraElements: () => [null, fakeEl(other)],
    });
    expect(isPointerInsideLayer(layer, node)).toBe(false);
  });
});
