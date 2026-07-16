import { describe, expect, it } from "vitest";

import { getTabbables, resolveTabStop } from "./focus";

describe("getTabbables", () => {
  it("collects tabbable elements in DOM order and excludes non-tabbables", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <button>b1</button>
      <button disabled>b2</button>
      <input />
      <div tabindex="-1">skip</div>
      <div tabindex="0">grid</div>
      <a href="#">link</a>
      <a>no-href</a>
      <button hidden>hidden</button>
      <button aria-hidden="true">aria-hidden</button>
    `;

    const result = getTabbables(container);
    expect(result.map((el) => el.tagName)).toEqual(["BUTTON", "INPUT", "DIV", "A"]);
  });

  it("returns an empty list when nothing is tabbable", () => {
    const container = document.createElement("div");
    container.innerHTML = `<span>text</span><button disabled>x</button>`;
    expect(getTabbables(container)).toEqual([]);
  });
});

describe("resolveTabStop", () => {
  function els(n: number): HTMLElement[] {
    return Array.from({ length: n }, () => document.createElement("button"));
  }

  it("returns null when there are no tabbables", () => {
    expect(resolveTabStop([], document.createElement("button"), false)).toBeNull();
  });

  it("wraps from the last tabbable to the first on Tab", () => {
    const list = els(3);
    expect(resolveTabStop(list, list[2], false)).toBe(list[0]);
  });

  it("wraps from the first tabbable to the last on Shift+Tab", () => {
    const list = els(3);
    expect(resolveTabStop(list, list[0], true)).toBe(list[2]);
  });

  it("returns null for an interior tab", () => {
    const list = els(3);
    expect(resolveTabStop(list, list[1], false)).toBeNull();
    expect(resolveTabStop(list, list[1], true)).toBeNull();
  });

  it("pulls focus to the first tabbable when focus is outside the scope", () => {
    const list = els(3);
    expect(resolveTabStop(list, document.createElement("button"), false)).toBe(list[0]);
    expect(resolveTabStop(list, null, false)).toBe(list[0]);
  });

  it("pulls focus to the last tabbable when focus is outside and Shift is held", () => {
    const list = els(3);
    expect(resolveTabStop(list, null, true)).toBe(list[2]);
  });
});
