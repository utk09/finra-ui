import { render, screen } from "@testing-library/react";
import type { ReactElement, SVGProps } from "react";
import { describe, expect, it } from "vitest";

import type { IconData } from "./index";
import * as iconData from "./index";
import * as reactIcons from "./react";

const dataEntries = Object.entries(iconData).filter(
  (entry): entry is [string, IconData] =>
    typeof entry[1] === "object" && entry[1] !== null && "viewBox" in entry[1],
);

/**
 * Every export of `./react` is an icon component. A cast rather than a type
 * predicate, because the module's inferred type is a 127-member union of
 * structurally identical signatures and a predicate has to be assignable to it.
 */
type IconComponent = (props: SVGProps<SVGSVGElement>) => ReactElement;
const componentEntries = Object.entries(reactIcons) as [string, IconComponent][];

describe("icon data", () => {
  it("exports the full set", () => {
    // Guards the denominator: a suite that silently scanned nothing would pass
    // every assertion below.
    expect(dataEntries.length).toBe(127);
  });

  it.each(dataEntries)("%s declares a 1em default size", (_name, icon) => {
    expect(icon.width).toBe("1em");
    expect(icon.height).toBe("1em");
  });

  it.each(dataEntries)("%s declares a 24-unit viewBox", (_name, icon) => {
    expect(icon.viewBox).toBe("0 0 24 24");
  });

  it.each(dataEntries)("%s strokes with currentColor so it inherits text colour", (_name, icon) => {
    expect(icon.stroke).toBe("currentColor");
  });
});

describe("react icon wrappers", () => {
  it("exports one component per icon", () => {
    expect(componentEntries.length).toBe(dataEntries.length);
  });

  it.each(componentEntries)("%s renders an svg sized in em", (_name, Icon) => {
    render(<Icon data-testid="icon" />);
    const svg = screen.getByTestId("icon");

    expect(svg.tagName.toLowerCase()).toBe("svg");
    // Without an intrinsic size an svg with only a viewBox resolves to the CSS
    // default for a replaced element, around 300px.
    expect(svg).toHaveAttribute("width", "1em");
    expect(svg).toHaveAttribute("height", "1em");
  });

  it.each(componentEntries)("%s lets a caller override the size", (_name, Icon) => {
    render(<Icon data-testid="icon" width={32} height={32} />);
    const svg = screen.getByTestId("icon");

    // The defaults sit before the prop spread, so consumer props still win.
    expect(svg).toHaveAttribute("width", "32");
    expect(svg).toHaveAttribute("height", "32");
  });

  it.each(componentEntries)("%s forwards arbitrary svg props", (_name, Icon) => {
    render(<Icon data-testid="icon" aria-label="named" role="img" />);
    const svg = screen.getByTestId("icon");

    expect(svg).toHaveAttribute("aria-label", "named");
    expect(svg).toHaveAttribute("role", "img");
  });
});
