import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useAnchoredPosition } from "./useAnchoredPosition";

describe("useAnchoredPosition", () => {
  it("defaults to bottom placement and a zeroed position with no reference", () => {
    const { result } = renderHook(() => useAnchoredPosition(null));

    expect(result.current.placement).toBe("bottom");
    expect(result.current.x).toBe(0);
    expect(result.current.y).toBe(0);
    expect(typeof result.current.setFloating).toBe("function");
  });

  it("uses a provided placement for the initial state", () => {
    const { result } = renderHook(() => useAnchoredPosition(null, { placement: "top" }));
    expect(result.current.placement).toBe("top");
  });
});
