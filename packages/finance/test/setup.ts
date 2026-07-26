import "@testing-library/jest-dom";

import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

configure({ testIdAttribute: "data-finra-ui" });

// Calendar month/weekday names and day labels come from `Intl.DateTimeFormat`.
// With no explicit `locale` prop they follow the *runtime* default locale, which
// varies with the machine's LANG/LC_ALL - so a developer on de-DE would see
// every "March 20, 2026" assertion fail. Pin the default to en-US for tests;
// an explicit `locale` prop still wins, so the i18n tests stay meaningful.
const NativeDateTimeFormat = Intl.DateTimeFormat;

function PinnedDateTimeFormat(
  locales?: Intl.LocalesArgument,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  return new NativeDateTimeFormat(locales ?? "en-US", options);
}

// Callable with or without `new`, and `supportedLocalesOf` must survive.
Object.defineProperties(PinnedDateTimeFormat, {
  prototype: { value: NativeDateTimeFormat.prototype },
  supportedLocalesOf: { value: NativeDateTimeFormat.supportedLocalesOf },
});

Object.defineProperty(Intl, "DateTimeFormat", {
  value: PinnedDateTimeFormat as unknown as typeof Intl.DateTimeFormat,
  configurable: true,
  writable: true,
});

// jsdom lacks ResizeObserver / IntersectionObserver, which floating-ui's
// autoUpdate (used by core Select's positioning inside the Calendar header)
// needs. Stub them as no-ops.
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
