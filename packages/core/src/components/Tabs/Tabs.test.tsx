import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Tab, TabList, TabPanel, Tabs } from "./Tabs";

describe("Tabs (styled)", () => {
  it("applies data-finra-ui hooks and classes to every part", () => {
    render(
      <Tabs defaultValue="one" className="my-root">
        <TabList className="my-list">
          <Tab value="one" className="my-tab">
            One
          </Tab>
        </TabList>
        <TabPanel value="one" className="my-panel">
          Content
        </TabPanel>
      </Tabs>,
    );

    // Test setup configures testIdAttribute = "data-finra-ui", so getByTestId
    // resolves each part by its component id (and asserts the hook is present).
    const root = screen.getByTestId("tabs");
    const list = screen.getByTestId("tab-list");
    const tab = screen.getByTestId("tab");
    const panel = screen.getByTestId("tab-panel");

    expect(root).toHaveAttribute("data-orientation", "horizontal");
    expect(root.className).toContain("my-root");
    expect(list).toHaveAttribute("role", "tablist");
    expect(list.className).toContain("my-list");
    expect(tab).toHaveAttribute("role", "tab");
    expect(tab.className).toContain("my-tab");
    expect(panel).toHaveAttribute("role", "tabpanel");
    expect(panel.className).toContain("my-panel");
  });
});
