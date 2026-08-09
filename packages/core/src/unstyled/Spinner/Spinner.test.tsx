import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SpinnerBase } from "./Spinner";

describe("SpinnerBase", () => {
  it("stamps its own id", () => {
    render(<SpinnerBase label="Loading" />);
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  it("lets a caller replace the id", () => {
    render(<SpinnerBase label="Loading" {...{ "data-finra-ui": "my-spinner" }} />);
    expect(screen.getByTestId("my-spinner")).toBeInTheDocument();
  });

  it("announces through a live region when labelled", () => {
    render(<SpinnerBase label="Loading positions" />);
    const spinner = screen.getByRole("status");
    expect(spinner).toHaveTextContent("Loading positions");
  });

  it("renders the label as text when there is no indicator to show", () => {
    // The unstyled layer ships no icon, so the label is the only thing to
    // render. It names the region as content, and a duplicate aria-label would
    // have it read twice.
    render(<SpinnerBase label="Loading" />);
    expect(screen.getByRole("status")).not.toHaveAttribute("aria-label");
  });

  it("names the region with aria-label once an indicator supplies the visual", () => {
    render(<SpinnerBase label="Loading" renderIndicator={() => <span>spin</span>} />);
    const spinner = screen.getByRole("status");
    expect(spinner).toHaveAttribute("aria-label", "Loading");
    expect(spinner).toHaveTextContent("spin");
    expect(spinner).not.toHaveTextContent("Loading");
  });

  it("treats an indicator that renders nothing as no indicator", () => {
    // `renderIndicator={() => null}` is how a caller suppresses the glyph. The
    // label has to come back as text, or the spinner is empty and silent.
    render(<SpinnerBase label="Loading" renderIndicator={() => null} />);
    const spinner = screen.getByRole("status");
    expect(spinner).toHaveTextContent("Loading");
    expect(spinner).not.toHaveAttribute("aria-label");
  });

  it("hides itself entirely with no label", () => {
    // Inside something that already announces the loading state, a second
    // announcement is noise.
    render(<SpinnerBase />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByTestId("spinner")).toHaveAttribute("aria-hidden", "true");
  });

  it("accepts children as the indicator", () => {
    render(<SpinnerBase label="Loading">{<span>dots</span>}</SpinnerBase>);
    expect(screen.getByRole("status")).toHaveTextContent("dots");
  });
});
