import { describe, expect, it } from "vitest";

import { createDisclosureStore, type DisclosureAction, disclosureReducer } from "./disclosure";

describe("disclosureReducer", () => {
  it("returns the same state object for an action it does not know", () => {
    // The type system rules this out at every call site the library owns, but
    // the reducer is exported: a consumer's own store, or an action added to
    // the union and not yet handled here, must be inert rather than a crash or
    // a silent reset. Identity matters - a fresh object would re-render.
    const state = { open: true };
    const unknown = { type: "explode" } as unknown as DisclosureAction;
    expect(disclosureReducer(state, unknown)).toBe(state);
  });

  it("opens and closes", () => {
    expect(disclosureReducer({ open: false }, { type: "open" })).toEqual({ open: true });
    expect(disclosureReducer({ open: true }, { type: "close" })).toEqual({ open: false });
  });

  it("toggles", () => {
    expect(disclosureReducer({ open: false }, { type: "toggle" })).toEqual({ open: true });
    expect(disclosureReducer({ open: true }, { type: "toggle" })).toEqual({ open: false });
  });

  it("sets an explicit value", () => {
    expect(disclosureReducer({ open: false }, { type: "set", open: true })).toEqual({ open: true });
  });

  it("returns the same reference for no-op transitions", () => {
    const openState = { open: true };
    expect(disclosureReducer(openState, { type: "open" })).toBe(openState);
    const closedState = { open: false };
    expect(disclosureReducer(closedState, { type: "close" })).toBe(closedState);
    expect(disclosureReducer(closedState, { type: "set", open: false })).toBe(closedState);
  });
});

describe("createDisclosureStore", () => {
  it("defaults to closed", () => {
    expect(createDisclosureStore().getState()).toEqual({ open: false });
  });

  it("honours the initial open value", () => {
    expect(createDisclosureStore(true).getState()).toEqual({ open: true });
  });

  it("drives state through actions", () => {
    const store = createDisclosureStore();
    store.send({ type: "toggle" });
    expect(store.getState().open).toBe(true);
    store.send({ type: "close", reason: "escape" });
    expect(store.getState().open).toBe(false);
  });
});
