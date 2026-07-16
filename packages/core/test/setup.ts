import "@testing-library/jest-dom";

import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

configure({ testIdAttribute: "data-finra-ui" });

// jsdom lacks ResizeObserver / IntersectionObserver, which floating-ui's
// autoUpdate (used by overlay positioning) needs. Stub them as no-ops.
class ObserverStub {
  observe(): void {
    /* no-op */
  }
  unobserve(): void {
    /* no-op */
  }
  disconnect(): void {
    /* no-op */
  }
  takeRecords(): unknown[] {
    return [];
  }
}

globalThis.ResizeObserver ??= ObserverStub as unknown as typeof ResizeObserver;
globalThis.IntersectionObserver ??= ObserverStub as unknown as typeof IntersectionObserver;

afterEach(() => {
  cleanup();
});
