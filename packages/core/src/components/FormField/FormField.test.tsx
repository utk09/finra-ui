import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FormField } from "./FormField";

// A simple input child for testing
function TestInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />;
}

describe("FormField", () => {
  it("renders label and child input", () => {
    render(
      <FormField label="Email">
        <TestInput placeholder="Enter email" />
      </FormField>,
    );
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter email")).toBeInTheDocument();
  });

  it('has data-finra-ui="form-field" attribute', () => {
    render(
      <FormField label="Name">
        <TestInput />
      </FormField>,
    );
    expect(screen.getByTestId("form-field")).toBeInTheDocument();
  });

  it('has data-finra-ui="form-field-label" on the label', () => {
    render(
      <FormField label="Name">
        <TestInput />
      </FormField>,
    );
    expect(screen.getByTestId("form-field-label")).toBeInTheDocument();
  });

  it("forwards ref", () => {
    const ref = vi.fn();
    render(
      <FormField ref={ref} label="Name">
        <TestInput />
      </FormField>,
    );
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });

  it("associates label with input via htmlFor", () => {
    render(
      <FormField label="Username" htmlFor="username-field">
        <TestInput />
      </FormField>,
    );
    const label = screen.getByText("Username");
    expect(label).toHaveAttribute("for", "username-field");
  });

  it("auto-generates id when htmlFor is not provided", () => {
    render(
      <FormField label="Auto ID">
        <TestInput />
      </FormField>,
    );
    const label = screen.getByText("Auto ID");
    expect(label.getAttribute("for")).toBeTruthy();
  });

  it("injects id onto child input", () => {
    render(
      <FormField label="Field" htmlFor="my-input">
        <TestInput />
      </FormField>,
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("id", "my-input");
  });

  it("renders helper text", () => {
    render(
      <FormField label="Email" helperText="We will never share your email.">
        <TestInput />
      </FormField>,
    );
    expect(screen.getByText("We will never share your email.")).toBeInTheDocument();
  });

  it('has data-finra-ui="form-field-helper" on helper text', () => {
    render(
      <FormField label="Email" helperText="Helper">
        <TestInput />
      </FormField>,
    );
    expect(screen.getByTestId("form-field-helper")).toBeInTheDocument();
  });

  it("renders error message when validationStatus is error", () => {
    render(
      <FormField label="Email" validationStatus="error" errorMessage="Invalid email">
        <TestInput />
      </FormField>,
    );
    const errorEl = screen.getByText("Invalid email");
    expect(errorEl).toBeInTheDocument();
    expect(errorEl).toHaveAttribute("role", "alert");
  });

  it('has data-finra-ui="form-field-error" on error message', () => {
    render(
      <FormField label="Email" validationStatus="error" errorMessage="Error">
        <TestInput />
      </FormField>,
    );
    expect(screen.getByTestId("form-field-error")).toBeInTheDocument();
  });

  it("does not render error message when validationStatus is not error", () => {
    render(
      <FormField label="Email" validationStatus="success" errorMessage="Invalid email">
        <TestInput />
      </FormField>,
    );
    expect(screen.queryByText("Invalid email")).not.toBeInTheDocument();
  });

  it("injects aria-describedby referencing error and helper", () => {
    render(
      <FormField
        label="Email"
        htmlFor="email-field"
        validationStatus="error"
        errorMessage="Invalid email"
        helperText="Enter your email">
        <TestInput />
      </FormField>,
    );
    const input = screen.getByRole("textbox");
    expect(input.getAttribute("aria-describedby")).toContain("email-field-error");
    expect(input.getAttribute("aria-describedby")).toContain("email-field-helper");
  });

  it("injects aria-invalid when validationStatus is error", () => {
    render(
      <FormField label="Email" validationStatus="error" errorMessage="Invalid">
        <TestInput />
      </FormField>,
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("applies required class to label", () => {
    render(
      <FormField label="Required Field" required>
        <TestInput />
      </FormField>,
    );
    const label = screen.getByTestId("form-field-label");
    expect(label.className).toMatch(/required/);
  });

  it("applies fullWidth class", () => {
    render(
      <FormField label="Full" fullWidth>
        <TestInput />
      </FormField>,
    );
    const wrapper = screen.getByTestId("form-field");
    expect(wrapper.className).toMatch(/fullWidth/);
  });

  it("applies disabled class and injects disabled prop", () => {
    render(
      <FormField label="Disabled" disabled>
        <TestInput />
      </FormField>,
    );
    const wrapper = screen.getByTestId("form-field");
    expect(wrapper.className).toMatch(/disabled/);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("applies custom className", () => {
    render(
      <FormField label="Custom" className="my-class">
        <TestInput />
      </FormField>,
    );
    const wrapper = screen.getByTestId("form-field");
    expect(wrapper.className).toContain("my-class");
  });
});
