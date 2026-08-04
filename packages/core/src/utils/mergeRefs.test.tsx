import { render } from "@testing-library/react";
import { createRef, forwardRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { mergeRefs } from "./mergeRefs";

describe("mergeRefs", () => {
  it("assigns the node to every object ref", () => {
    const a = createRef<HTMLDivElement>();
    const b = createRef<HTMLDivElement>();
    const node = document.createElement("div");

    mergeRefs(a, b)(node);

    expect(a.current).toBe(node);
    expect(b.current).toBe(node);
  });

  it("calls every callback ref with the node", () => {
    const a = vi.fn();
    const b = vi.fn();
    const node = document.createElement("div");

    mergeRefs<HTMLDivElement>(a, b)(node);

    expect(a).toHaveBeenCalledWith(node);
    expect(b).toHaveBeenCalledWith(node);
  });

  it("mixes callback and object refs in one pass", () => {
    const callback = vi.fn();
    const object = createRef<HTMLDivElement>();
    const node = document.createElement("div");

    mergeRefs<HTMLDivElement>(callback, object)(node);

    expect(callback).toHaveBeenCalledWith(node);
    expect(object.current).toBe(node);
  });

  it("skips undefined and null entries rather than throwing", () => {
    const object = createRef<HTMLDivElement>();
    const node = document.createElement("div");

    expect(() => mergeRefs<HTMLDivElement>(undefined, null, object)(node)).not.toThrow();
    expect(object.current).toBe(node);
  });

  it("propagates the null React passes on unmount", () => {
    const callback = vi.fn();
    const object = createRef<HTMLDivElement>();
    const merged = mergeRefs<HTMLDivElement>(callback, object);
    const node = document.createElement("div");

    merged(node);
    merged(null);

    expect(object.current).toBeNull();
    expect(callback).toHaveBeenLastCalledWith(null);
  });

  it("populates a forwarded ref and an internal ref from the same node", () => {
    const forwarded = createRef<HTMLButtonElement>();
    const internal = createRef<HTMLButtonElement>();

    const Button = forwardRef<HTMLButtonElement>((_props, ref) => (
      <button type="button" ref={mergeRefs(ref, internal)}>
        press
      </button>
    ));

    render(<Button ref={forwarded} />);

    expect(forwarded.current).toBeInstanceOf(HTMLButtonElement);
    expect(forwarded.current).toBe(internal.current);
  });
});
