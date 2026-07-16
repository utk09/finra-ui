import { afterEach, describe, expect, it } from "vitest";

import { lockBodyScroll } from "./scrollLock";

// jsdom has no layout, so drive the "scrollbar width" (innerWidth - clientWidth)
// by defining clientWidth explicitly per test.
function setClientWidth(value: number): void {
  Object.defineProperty(document.documentElement, "clientWidth", { configurable: true, value });
}

afterEach(() => {
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
});

describe("lockBodyScroll", () => {
  it("locks and restores body overflow", () => {
    setClientWidth(window.innerWidth);
    expect(document.body.style.overflow).toBe("");

    const unlock = lockBodyScroll();
    expect(document.body.style.overflow).toBe("hidden");

    unlock();
    expect(document.body.style.overflow).toBe("");
  });

  it("is ref-counted: stays locked until every lock releases", () => {
    setClientWidth(window.innerWidth);
    const releaseA = lockBodyScroll();
    const releaseB = lockBodyScroll();
    expect(document.body.style.overflow).toBe("hidden");

    releaseA();
    expect(document.body.style.overflow).toBe("hidden");

    releaseB();
    expect(document.body.style.overflow).toBe("");
  });

  it("ignores a double release", () => {
    setClientWidth(window.innerWidth);
    const unlock = lockBodyScroll();
    unlock();
    unlock();
    expect(document.body.style.overflow).toBe("");
  });

  it("compensates for the scrollbar width with padding", () => {
    setClientWidth(window.innerWidth - 15);
    const unlock = lockBodyScroll();
    expect(document.body.style.paddingRight).toBe("15px");

    unlock();
    expect(document.body.style.paddingRight).toBe("");
  });

  it("adds no padding when there is no scrollbar", () => {
    setClientWidth(window.innerWidth);
    const unlock = lockBodyScroll();
    expect(document.body.style.paddingRight).toBe("");
    unlock();
  });
});
