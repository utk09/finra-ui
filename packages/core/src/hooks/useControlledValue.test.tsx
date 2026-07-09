import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useControlledValue } from "./useControlledValue";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useControlledValue", () => {
  it("uses the default value when uncontrolled", () => {
    const { result } = renderHook(() => useControlledValue<string>(undefined, "default"));
    expect(result.current[0]).toBe("default");
  });

  it("uncontrolled: setValue updates the value and fires onChange", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControlledValue<string>(undefined, "a", onChange));

    act(() => result.current[1]("b"));

    expect(result.current[0]).toBe("b");
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("controlled: value follows the prop and setValue only fires onChange", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControlledValue<string>("controlled", "a", onChange));

    expect(result.current[0]).toBe("controlled");

    act(() => result.current[1]("b"));

    // parent owns the value — internal value does not change
    expect(result.current[0]).toBe("controlled");
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("warns in development when flipping from controlled to uncontrolled", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { rerender } = renderHook(
      ({ value }: { value: string | undefined }) => useControlledValue(value, "d"),
      { initialProps: { value: "x" as string | undefined } },
    );

    rerender({ value: undefined });

    expect(spy).toHaveBeenCalledWith(expect.stringContaining("controlled and uncontrolled"));
  });

  it("warns when flipping from uncontrolled to controlled", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { rerender } = renderHook(
      ({ value }: { value: string | undefined }) => useControlledValue(value, "d"),
      { initialProps: { value: undefined as string | undefined } },
    );

    rerender({ value: "y" });

    expect(spy).toHaveBeenCalledWith(expect.stringContaining("controlled and uncontrolled"));
  });
});
