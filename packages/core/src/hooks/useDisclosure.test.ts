import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useDisclosure } from "./useDisclosure";

describe("useDisclosure", () => {
  it("uncontrolled: opens, closes, and toggles", () => {
    const { result } = renderHook(() => useDisclosure());
    expect(result.current.isOpen).toBe(false);

    act(() => result.current.setOpen(true));
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);

    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(true);
  });

  it("respects defaultOpen", () => {
    const { result } = renderHook(() => useDisclosure({ defaultOpen: true }));
    expect(result.current.isOpen).toBe(true);
  });

  it("controlled: setOpen fires onOpenChange but the parent owns the state", () => {
    const onOpenChange = vi.fn();
    const { result } = renderHook(() => useDisclosure({ open: false, onOpenChange }));

    act(() => result.current.setOpen(true));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(result.current.isOpen).toBe(false);
  });
});
