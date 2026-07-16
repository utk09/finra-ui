import { describe, expect, it } from "vitest";

import {
  computeDescribedBy,
  computeFieldIds,
  type FormFieldState,
  mergeControlA11y,
} from "./formField";

describe("computeFieldIds", () => {
  it("derives label/helper/error ids from the field id", () => {
    expect(computeFieldIds("email")).toEqual({
      labelId: "email-label",
      helperId: "email-helper",
      errorId: "email-error",
    });
  });
});

describe("computeDescribedBy", () => {
  const ids = { errorId: "f-error", helperId: "f-helper" };

  it("is undefined when neither error nor helper is present", () => {
    expect(computeDescribedBy({ showError: false, hasHelper: false, ...ids })).toBeUndefined();
  });

  it("lists the error id first, then the helper id", () => {
    expect(computeDescribedBy({ showError: true, hasHelper: true, ...ids })).toBe(
      "f-error f-helper",
    );
  });

  it("includes only the error id when there is no helper", () => {
    expect(computeDescribedBy({ showError: true, hasHelper: false, ...ids })).toBe("f-error");
  });

  it("includes only the helper id when there is no error", () => {
    expect(computeDescribedBy({ showError: false, hasHelper: true, ...ids })).toBe("f-helper");
  });
});

describe("mergeControlA11y", () => {
  function field(overrides: Partial<FormFieldState> = {}): FormFieldState {
    return {
      fieldId: "f",
      labelId: "f-label",
      helperId: "f-helper",
      errorId: "f-error",
      describedBy: undefined,
      invalid: false,
      required: false,
      disabled: false,
      ...overrides,
    };
  }

  it("applies the field id when the control has none", () => {
    expect(mergeControlA11y(field())).toEqual({ id: "f" });
  });

  it("lets the control's own id win", () => {
    expect(mergeControlA11y(field(), { id: "own" })).toMatchObject({ id: "own" });
  });

  it("passes the field describedBy through", () => {
    expect(mergeControlA11y(field({ describedBy: "f-error f-helper" }))).toMatchObject({
      "aria-describedby": "f-error f-helper",
    });
  });

  it("appends the control's own aria-describedby without clobbering, deduped", () => {
    expect(
      mergeControlA11y(field({ describedBy: "f-error f-helper" }), {
        "aria-describedby": "hint f-error",
      }),
    ).toMatchObject({ "aria-describedby": "f-error f-helper hint" });
  });

  it("sets aria-invalid when the field is invalid", () => {
    expect(mergeControlA11y(field({ invalid: true }))).toMatchObject({ "aria-invalid": true });
  });

  it("sets aria-invalid when the control marks itself invalid", () => {
    expect(mergeControlA11y(field(), { "aria-invalid": true })).toMatchObject({
      "aria-invalid": true,
    });
  });

  it("passes a granular aria-invalid token through when the field is valid", () => {
    expect(mergeControlA11y(field(), { "aria-invalid": "grammar" })).toMatchObject({
      "aria-invalid": "grammar",
    });
  });

  it('treats an aria-invalid of "false" as not invalid', () => {
    expect(mergeControlA11y(field(), { "aria-invalid": "false" })["aria-invalid"]).toBeUndefined();
  });

  it("an invalid field overrides a granular own token with plain true", () => {
    expect(mergeControlA11y(field({ invalid: true }), { "aria-invalid": "grammar" })).toMatchObject(
      { "aria-invalid": true },
    );
  });

  it("omits aria-invalid when neither is invalid", () => {
    expect(mergeControlA11y(field())["aria-invalid"]).toBeUndefined();
  });

  it("sets aria-required from the field", () => {
    expect(mergeControlA11y(field({ required: true }))).toMatchObject({ "aria-required": true });
  });

  it("disables when the field is disabled", () => {
    expect(mergeControlA11y(field({ disabled: true }))).toMatchObject({ disabled: true });
  });

  it("disables when the control disables itself", () => {
    expect(mergeControlA11y(field(), { disabled: true })).toMatchObject({ disabled: true });
  });

  it("omits disabled when neither disables", () => {
    expect(mergeControlA11y(field()).disabled).toBeUndefined();
  });

  it("is idempotent when re-merged with its own output (context + injection overlap)", () => {
    const f = field({ describedBy: "f-error f-helper", invalid: true, disabled: true });
    const once = mergeControlA11y(f);
    const twice = mergeControlA11y(f, once);
    expect(twice).toEqual(once);
  });
});
