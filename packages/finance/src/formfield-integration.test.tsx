import { render, screen } from "@testing-library/react";
import { FormField } from "@utk09/finra-ui";
import { describe, expect, it } from "vitest";

import { DateInput } from "./components/DateInput/DateInput";
import { DateTenorInput } from "./components/DateTenorInput/DateTenorInput";

/**
 * Finance composites consume the FormField context (via useFormField) and route
 * the field's a11y to their inner date input. aria-required travels via context
 * only (it is stripped from FormField's injection because it is role-restricted
 * and would be invalid on the composite's wrapper div).
 */
describe("finance controls inside a FormField", () => {
  it("DateInput: input gets id association, aria-required and aria-describedby from a required field", () => {
    render(
      <FormField label="Trade date" htmlFor="td" required helperText="Pick a date">
        <DateInput />
      </FormField>,
    );

    const input = screen.getByPlaceholderText("YYYY-MM-DD");
    expect(input).toHaveAttribute("id", "td");
    expect(input).toHaveAttribute("aria-required", "true");
    expect(input.getAttribute("aria-describedby")).toContain("td-helper");
    // The wrapper div must NOT carry aria-required (role-restricted).
    expect(screen.getByText("Trade date")).toHaveAttribute("for", "td");
  });

  it("DateInput: no aria-required outside a required field", () => {
    render(
      <FormField label="Trade date" htmlFor="td2">
        <DateInput />
      </FormField>,
    );

    expect(screen.getByPlaceholderText("YYYY-MM-DD")).not.toHaveAttribute("aria-required");
  });

  it("DateTenorInput: date input gets the field id and aria-required from a required field", () => {
    render(
      <FormField label="Settlement" htmlFor="settle" required>
        <DateTenorInput dateAriaLabel="Settlement date" />
      </FormField>,
    );

    const input = screen.getByPlaceholderText("YYYY-MM-DD");
    expect(input).toHaveAttribute("id", "settle");
    expect(input).toHaveAttribute("aria-required", "true");
  });

  it("DateTenorInput: falls back to dateId when standalone", () => {
    render(<DateTenorInput dateId="my-date" dateAriaLabel="Date" />);
    expect(screen.getByPlaceholderText("YYYY-MM-DD")).toHaveAttribute("id", "my-date");
  });
});
