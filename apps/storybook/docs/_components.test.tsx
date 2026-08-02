import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  Card,
  CardGrid,
  Command,
  Hero,
  Note,
  Sampler,
  Support,
  Swatch,
  SwatchGrid,
} from "./_components";

const html = (node: React.ReactElement) => renderToStaticMarkup(node);

describe("Card", () => {
  it("renders an anchor when given an href", () => {
    const out = html(
      <Card title="Tokens" href="?path=/docs/foundations-design-tokens--docs">
        Body
      </Card>,
    );
    expect(out).toContain("<a");
    expect(out).toContain('target="_top"');
    expect(out).toContain("Tokens");
    expect(out).toContain("Body");
  });

  it("renders a plain div when there is nowhere to go", () => {
    const out = html(<Card title="Static">Body</Card>);
    expect(out).not.toContain("<a");
    expect(out).toContain("Static");
  });
});

describe("Note", () => {
  it("defaults to the info palette", () => {
    expect(html(<Note>Body</Note>)).toContain("--finra-color-info");
  });

  it("uses the palette matching its kind", () => {
    expect(html(<Note kind="warning">Body</Note>)).toContain("--finra-color-warning");
    expect(html(<Note kind="success">Body</Note>)).toContain("--finra-color-success");
  });

  it("renders the title only when one is given", () => {
    expect(html(<Note title="Heads up">Body</Note>)).toContain("Heads up");
    expect(html(<Note>Body</Note>)).toContain("Body");
  });
});

describe("Support", () => {
  it("links to both issue templates and the issue list", () => {
    const out = html(<Support />);
    expect(out).toContain("bug_report.yml");
    expect(out).toContain("feature_request.yml");
    expect(out).toContain("browse open issues");
  });

  it("prepends a component-specific note when given one", () => {
    expect(html(<Support>Accessibility problems count as bugs.</Support>)).toContain(
      "Accessibility problems count as bugs.",
    );
  });
});

describe("Swatch", () => {
  it("paints from the token so it follows the theme", () => {
    expect(html(<Swatch token="--finra-actionable-accent" />)).toContain(
      "var(--finra-actionable-accent)",
    );
  });

  it("shows the note only when supplied", () => {
    expect(html(<Swatch token="--x" note="focus ring" />)).toContain("focus ring");
    expect(html(<Swatch token="--x" />)).not.toContain("focus ring");
  });
});

describe("layout furniture", () => {
  it("renders its children", () => {
    expect(html(<Hero title="finra-ui" tagline="Tagline" />)).toContain("finra-ui");
    expect(
      html(
        <Hero title="T" tagline="G">
          <span>extra</span>
        </Hero>,
      ),
    ).toContain("extra");
    expect(html(<CardGrid>cells</CardGrid>)).toContain("cells");
    expect(html(<SwatchGrid>chips</SwatchGrid>)).toContain("chips");
    expect(html(<Sampler>row</Sampler>)).toContain("row");
    expect(html(<Command>npm install</Command>)).toContain("npm install");
  });

  it("honours the narrowest-column override", () => {
    expect(html(<CardGrid min="300px">x</CardGrid>)).toContain("300px");
    expect(html(<SwatchGrid min="90px">x</SwatchGrid>)).toContain("90px");
  });
});
