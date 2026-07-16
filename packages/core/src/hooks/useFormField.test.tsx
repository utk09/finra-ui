import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { FormFieldContext } from "../context/FormFieldContext";
import type { FormFieldOwnA11y, FormFieldState } from "../logic/formField";
import { useFormField } from "./useFormField";

const field: FormFieldState = {
  fieldId: "f",
  labelId: "f-label",
  helperId: "f-helper",
  errorId: "f-error",
  describedBy: "f-error f-helper",
  invalid: true,
  required: true,
  disabled: true,
};

function withField(value: FormFieldState) {
  return ({ children }: { children: ReactNode }) => (
    <FormFieldContext.Provider value={value}>{children}</FormFieldContext.Provider>
  );
}

describe("useFormField", () => {
  // Variables, not object literals: excess-property checks only fire on literals,
  // and real controls always pass a props variable/spread.
  const ownProps = { id: "own", placeholder: "p" };
  const noIdProps: FormFieldOwnA11y & { placeholder: string } = { placeholder: "p" };

  it("passes props through unchanged outside a FormField", () => {
    const { result } = renderHook(() => useFormField(ownProps));
    expect(result.current).toEqual({ id: "own", placeholder: "p" });
  });

  it("returns an empty object when called with no args and no field", () => {
    const { result } = renderHook(() => useFormField());
    expect(result.current).toEqual({});
  });

  it("merges the field a11y in when inside a FormField, keeping own props", () => {
    const { result } = renderHook(() => useFormField(noIdProps), {
      wrapper: withField(field),
    });

    expect(result.current).toMatchObject({
      placeholder: "p",
      id: "f",
      "aria-describedby": "f-error f-helper",
      "aria-invalid": true,
      "aria-required": true,
      disabled: true,
    });
  });

  it("lets the control's own id win over the field id", () => {
    const idOnly = { id: "own" };
    const { result } = renderHook(() => useFormField(idOnly), {
      wrapper: withField(field),
    });
    expect(result.current.id).toBe("own");
  });
});
