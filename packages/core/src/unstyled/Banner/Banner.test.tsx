import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FINRA_UI_ATTR } from "../../componentIds";
import { BannerBase } from "./Banner";

describe("BannerBase", () => {
  it("renders the title and the body", () => {
    render(<BannerBase title="Market closed">Orders queue until 09:30.</BannerBase>);
    expect(screen.getByTestId("banner-title")).toHaveTextContent("Market closed");
    expect(screen.getByTestId("banner-description")).toHaveTextContent("Orders queue until 09:30.");
  });

  it("omits the title and the body when neither is given", () => {
    render(<BannerBase />);
    expect(screen.queryByTestId("banner-title")).not.toBeInTheDocument();
    expect(screen.queryByTestId("banner-description")).not.toBeInTheDocument();
    expect(screen.getByTestId("banner-content")).toBeInTheDocument();
  });

  //  Announcement

  it.each(["danger", "warning"] as const)("announces %s assertively", (sentiment) => {
    render(<BannerBase sentiment={sentiment}>Trade rejected.</BannerBase>);
    const banner = screen.getByRole("alert");
    expect(banner).toHaveAttribute("aria-live", "assertive");
    expect(banner).toHaveAttribute("data-sentiment", sentiment);
  });

  it.each(["success", "info"] as const)("announces %s politely", (sentiment) => {
    render(<BannerBase sentiment={sentiment}>Trade booked.</BannerBase>);
    const banner = screen.getByRole("status");
    expect(banner).toHaveAttribute("aria-live", "polite");
    expect(banner).toHaveAttribute("data-sentiment", sentiment);
  });

  it("gives a banner with no sentiment no live-region role", () => {
    // A banner that is part of the page rather than news about it must not
    // interrupt a screen reader on mount.
    render(<BannerBase>Scheduled maintenance on Sunday.</BannerBase>);
    const banner = screen.getByTestId("banner");
    expect(banner).not.toHaveAttribute("role");
    expect(banner).not.toHaveAttribute("aria-live");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  //  Icon

  it("renders no icon slot until renderIcon returns a node", () => {
    render(<BannerBase sentiment="info">Heads up.</BannerBase>);
    expect(screen.queryByTestId("banner-icon")).not.toBeInTheDocument();
  });

  it("passes the sentiment to renderIcon and hides the glyph from assistive tech", () => {
    const renderIcon = vi.fn(() => <svg role="presentation" />);
    render(
      <BannerBase sentiment="danger" renderIcon={renderIcon}>
        Trade rejected.
      </BannerBase>,
    );
    expect(renderIcon).toHaveBeenCalledWith("danger");
    // The body already carries the meaning, so the glyph repeats it visually only.
    expect(screen.getByTestId("banner-icon")).toHaveAttribute("aria-hidden", "true");
  });

  it("renders no icon slot when renderIcon returns null", () => {
    render(
      <BannerBase sentiment="danger" renderIcon={() => null}>
        Trade rejected.
      </BannerBase>,
    );
    expect(screen.queryByTestId("banner-icon")).not.toBeInTheDocument();
  });

  //  Dismiss

  it("renders no dismiss button by default", () => {
    render(<BannerBase>Scheduled maintenance.</BannerBase>);
    expect(screen.queryByTestId("banner-close")).not.toBeInTheDocument();
  });

  it("fires onDismiss once per activation and leaves the banner mounted", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <BannerBase dismissible onDismiss={onDismiss}>
        Scheduled maintenance.
      </BannerBase>,
    );

    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    // Removing the banner is the caller's job, so it is still on the page.
    expect(screen.getByTestId("banner")).toBeInTheDocument();
  });

  it("reaches the dismiss button by keyboard", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <BannerBase dismissible onDismiss={onDismiss}>
        Scheduled maintenance.
      </BannerBase>,
    );

    await user.tab();
    expect(screen.getByTestId("banner-close")).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("names the dismiss button through dismissLabel", () => {
    render(
      <BannerBase dismissible dismissLabel="Hide notice">
        Scheduled maintenance.
      </BannerBase>,
    );
    expect(screen.getByRole("button", { name: "Hide notice" })).toBeInTheDocument();
  });

  it("defaults the dismiss glyph to a text character, shipping no icon", () => {
    render(<BannerBase dismissible>Scheduled maintenance.</BannerBase>);
    expect(screen.getByTestId("banner-close")).toHaveTextContent("×");
  });

  //  Action

  it("renders an action only when one is given", () => {
    const { rerender } = render(<BannerBase>Scheduled maintenance.</BannerBase>);
    expect(screen.queryByTestId("banner-action")).not.toBeInTheDocument();

    rerender(<BannerBase action={<button type="button">Retry</button>}>Failed.</BannerBase>);
    expect(screen.getByTestId("banner-action")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  //  Passthrough

  it("lets a caller replace the root id", () => {
    // The base stamps its own root and lets a caller's attributes follow, so an
    // id is present at every call site rather than only where one is passed in.
    render(<BannerBase {...{ [FINRA_UI_ATTR]: "my-banner" }}>Scheduled maintenance.</BannerBase>);
    expect(screen.getByTestId("my-banner")).toBeInTheDocument();
    expect(screen.queryByTestId("banner")).not.toBeInTheDocument();
  });

  it("forwards a ref to the root", () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<BannerBase ref={ref}>Scheduled maintenance.</BannerBase>);
    expect(ref.current).toBe(screen.getByTestId("banner"));
  });

  it("applies classNames to each part it renders", () => {
    render(
      <BannerBase
        title="Market closed"
        dismissible
        action={<span>Retry</span>}
        renderIcon={() => <svg role="presentation" />}
        classNames={{
          icon: "i",
          content: "c",
          title: "t",
          description: "d",
          action: "a",
          close: "x",
        }}>
        Body
      </BannerBase>,
    );
    expect(screen.getByTestId("banner-icon")).toHaveClass("i");
    expect(screen.getByTestId("banner-content")).toHaveClass("c");
    expect(screen.getByTestId("banner-title")).toHaveClass("t");
    expect(screen.getByTestId("banner-description")).toHaveClass("d");
    expect(screen.getByTestId("banner-action")).toHaveClass("a");
    expect(screen.getByTestId("banner-close")).toHaveClass("x");
  });
});
