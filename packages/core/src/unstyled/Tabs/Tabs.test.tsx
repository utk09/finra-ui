import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Tab, TabList, TabPanel, Tabs, type TabsProps } from "./Tabs";

function Fixture({
  disabledTwo = false,
  ...props
}: TabsProps & { disabledTwo?: boolean }): React.ReactElement {
  return (
    <Tabs {...props}>
      <TabList aria-label="Sections">
        <Tab value="one">One</Tab>
        <Tab value="two" disabled={disabledTwo}>
          Two
        </Tab>
        <Tab value="three">Three</Tab>
      </TabList>
      <TabPanel value="one">Panel One content</TabPanel>
      <TabPanel value="two">Panel Two content</TabPanel>
      <TabPanel value="three">Panel Three content</TabPanel>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("wires aria roles and ids between tabs and panels", () => {
    render(<Fixture defaultValue="one" />);
    const tab = screen.getByRole("tab", { name: "One" });
    const panel = screen.getByRole("tabpanel");
    expect(screen.getByRole("tablist")).toHaveAttribute("aria-orientation", "horizontal");
    expect(tab).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveAttribute("aria-labelledby", tab.id);
    expect(tab).toHaveAttribute("aria-selected", "true");
  });

  it("shows only the selected panel and marks the selected tab tabbable", () => {
    render(<Fixture defaultValue="two" />);
    expect(screen.getByText("Panel Two content")).toBeVisible();
    expect(screen.getByText("Panel One content")).not.toBeVisible();
    expect(screen.getByRole("tab", { name: "Two" })).toHaveProperty("tabIndex", 0);
    expect(screen.getByRole("tab", { name: "One" })).toHaveProperty("tabIndex", -1);
  });

  it("selects on click (uncontrolled)", async () => {
    const user = userEvent.setup();
    render(<Fixture defaultValue="one" />);
    await user.click(screen.getByRole("tab", { name: "Three" }));
    expect(screen.getByRole("tab", { name: "Three" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Panel Three content")).toBeVisible();
  });

  it("is controlled when value is supplied", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(<Fixture value="one" onValueChange={onValueChange} />);
    await user.click(screen.getByRole("tab", { name: "Two" }));
    expect(onValueChange).toHaveBeenCalledWith("two");
    // Still on "one" until the prop updates.
    expect(screen.getByRole("tab", { name: "One" })).toHaveAttribute("aria-selected", "true");
    rerender(<Fixture value="two" onValueChange={onValueChange} />);
    expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute("aria-selected", "true");
  });

  describe("automatic activation", () => {
    it("ArrowRight/ArrowLeft move focus and selection, wrapping", async () => {
      const user = userEvent.setup();
      render(<Fixture defaultValue="one" />);
      screen.getByRole("tab", { name: "One" }).focus();

      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("tab", { name: "Two" })).toHaveFocus();
      expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute("aria-selected", "true");

      await user.keyboard("{ArrowLeft}");
      expect(screen.getByRole("tab", { name: "One" })).toHaveFocus();

      await user.keyboard("{ArrowLeft}"); // wrap to last
      expect(screen.getByRole("tab", { name: "Three" })).toHaveFocus();
    });

    it("Home/End jump to the ends", async () => {
      const user = userEvent.setup();
      render(<Fixture defaultValue="two" />);
      screen.getByRole("tab", { name: "Two" }).focus();

      await user.keyboard("{End}");
      expect(screen.getByRole("tab", { name: "Three" })).toHaveFocus();

      await user.keyboard("{Home}");
      expect(screen.getByRole("tab", { name: "One" })).toHaveFocus();
    });

    it("skips disabled tabs", async () => {
      const user = userEvent.setup();
      render(<Fixture defaultValue="one" disabledTwo />);
      screen.getByRole("tab", { name: "One" }).focus();

      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("tab", { name: "Three" })).toHaveFocus();
      expect(screen.getByRole("tab", { name: "Three" })).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("manual activation", () => {
    it("moves focus without selecting, then activates on Enter", async () => {
      const user = userEvent.setup();
      render(<Fixture defaultValue="one" activationMode="manual" />);
      screen.getByRole("tab", { name: "One" }).focus();

      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("tab", { name: "Two" })).toHaveFocus();
      // Selection has NOT followed focus.
      expect(screen.getByRole("tab", { name: "One" })).toHaveAttribute("aria-selected", "true");

      await user.keyboard("{Enter}");
      expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute("aria-selected", "true");
    });

    it("activates on Space", async () => {
      const user = userEvent.setup();
      render(<Fixture defaultValue="one" activationMode="manual" />);
      screen.getByRole("tab", { name: "Three" }).focus();
      await user.keyboard(" ");
      expect(screen.getByRole("tab", { name: "Three" })).toHaveAttribute("aria-selected", "true");
    });
  });

  it("navigates with Up/Down when vertical", async () => {
    const user = userEvent.setup();
    render(<Fixture defaultValue="one" orientation="vertical" />);
    expect(screen.getByRole("tablist")).toHaveAttribute("aria-orientation", "vertical");
    screen.getByRole("tab", { name: "One" }).focus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("tab", { name: "Two" })).toHaveFocus();
  });

  it("makes the first tab tabbable when nothing is selected", () => {
    render(<Fixture />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveProperty("tabIndex", 0);
    expect(tabs[1]).toHaveProperty("tabIndex", -1);
  });

  it("does not select a disabled tab on click", async () => {
    const user = userEvent.setup();
    render(<Fixture defaultValue="one" disabledTwo />);
    await user.click(screen.getByRole("tab", { name: "Two" }));
    expect(screen.getByRole("tab", { name: "One" })).toHaveAttribute("aria-selected", "true");
  });

  it("forwards handlers and respects preventDefault", async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn((e: React.KeyboardEvent) => e.preventDefault());
    render(
      <Tabs defaultValue="one">
        <TabList onKeyDown={onKeyDown}>
          <Tab value="one" onClick={(e) => e.preventDefault()}>
            One
          </Tab>
          <Tab value="two">Two</Tab>
        </TabList>
        <TabPanel value="one">P1</TabPanel>
        <TabPanel value="two">P2</TabPanel>
      </Tabs>,
    );

    // Consumer onClick preventDefault blocks selection.
    await user.click(screen.getByRole("tab", { name: "One" }));
    expect(screen.getByRole("tab", { name: "One" })).toHaveAttribute("aria-selected", "true");

    // Consumer onKeyDown preventDefault blocks arrow navigation.
    screen.getByRole("tab", { name: "One" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(onKeyDown).toHaveBeenCalled();
    expect(screen.getByRole("tab", { name: "One" })).toHaveFocus();
  });

  it("ignores unhandled keys without moving focus", async () => {
    const user = userEvent.setup();
    render(<Fixture defaultValue="one" />);
    const one = screen.getByRole("tab", { name: "One" });
    one.focus();
    await user.keyboard("a"); // not an arrow / Home / End
    expect(one).toHaveFocus();
    expect(one).toHaveAttribute("aria-selected", "true");
  });

  it("bails out of a tab's key handler when the event is already defaulted", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="one">
        <TabList>
          <Tab value="one" onKeyDown={(e) => e.preventDefault()}>
            One
          </Tab>
          <Tab value="two">Two</Tab>
        </TabList>
        <TabPanel value="one">P1</TabPanel>
        <TabPanel value="two">P2</TabPanel>
      </Tabs>,
    );
    const one = screen.getByRole("tab", { name: "One" });
    one.focus();
    await user.keyboard("{ArrowRight}"); // preventDefault bubbles, roving is blocked
    expect(one).toHaveFocus();
  });

  it("throws when a part is used outside <Tabs>", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Tab value="x">x</Tab>)).toThrow(/must be used within a <Tabs>/);
    spy.mockRestore();
  });
});
