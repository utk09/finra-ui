import { afterEach, describe, expect, it, vi } from "vitest";

import { scrollActiveDescendantIntoView } from "./activeDescendant";

afterEach(() => {
  document.body.innerHTML = "";
});

function renderOption(id: string): HTMLElement {
  const element = document.createElement("div");
  element.id = id;
  document.body.append(element);
  return element;
}

describe("scrollActiveDescendantIntoView", () => {
  it("scrolls the element named by the id into view", () => {
    const option = renderOption("listbox-option-3");
    const scrollIntoView = vi.fn();
    option.scrollIntoView = scrollIntoView;

    scrollActiveDescendantIntoView("listbox-option-3");

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("scrolls to the nearest edge, so an already visible option does not move the list", () => {
    const option = renderOption("listbox-option-3");
    const scrollIntoView = vi.fn();
    option.scrollIntoView = scrollIntoView;

    scrollActiveDescendantIntoView("listbox-option-3");

    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
  });

  it("leaves every other option alone", () => {
    const first = renderOption("listbox-option-0");
    const second = renderOption("listbox-option-1");
    first.scrollIntoView = vi.fn();
    second.scrollIntoView = vi.fn();

    scrollActiveDescendantIntoView("listbox-option-1");

    expect(first.scrollIntoView).not.toHaveBeenCalled();
    expect(second.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("does nothing when there is no active descendant", () => {
    const option = renderOption("listbox-option-0");
    option.scrollIntoView = vi.fn();

    scrollActiveDescendantIntoView(undefined);
    scrollActiveDescendantIntoView(null);
    scrollActiveDescendantIntoView("");

    expect(option.scrollIntoView).not.toHaveBeenCalled();
  });

  it("does not throw when nothing carries the id", () => {
    expect(() => scrollActiveDescendantIntoView("listbox-option-99")).not.toThrow();
  });

  it("does not throw where the environment has no scrollIntoView", () => {
    const option = renderOption("listbox-option-0");

    // jsdom implements no scrolling, which is what makes the optional call
    // load-bearing. Asserted rather than assumed: were jsdom to grow a real
    // implementation, this test would otherwise pass while covering nothing.
    expect(option.scrollIntoView).toBeUndefined();
    expect(() => scrollActiveDescendantIntoView("listbox-option-0")).not.toThrow();
  });
});
