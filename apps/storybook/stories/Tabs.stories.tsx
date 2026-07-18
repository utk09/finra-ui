import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge, FormField, Input, Switch, Tab, TabList, TabPanel, Tabs } from "@utk09/finra-ui";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

const meta: Meta<typeof Tabs> = {
  title: "Components/Tabs",
  component: Tabs,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
      table: { defaultValue: { summary: "horizontal" } },
    },
    activationMode: {
      control: "inline-radio",
      options: ["automatic", "manual"],
      table: { defaultValue: { summary: "automatic" } },
    },
    defaultValue: { control: "text" },
    value: { table: { disable: true } },
    onValueChange: { table: { disable: true } },
    children: { table: { disable: true } },
  },
  args: {
    orientation: "horizontal",
    activationMode: "automatic",
    defaultValue: "overview",
  },
  render: (args) => (
    <Tabs {...args} style={{ maxInlineSize: "32rem" }}>
      <TabList aria-label="Account settings">
        <Tab value="overview">Overview</Tab>
        <Tab value="activity">Activity</Tab>
        <Tab value="settings">Settings</Tab>
        <Tab value="billing" disabled>
          Billing
        </Tab>
      </TabList>
      <TabPanel value="overview">
        <p>Summary of the account: balances, recent orders, and open positions.</p>
      </TabPanel>
      <TabPanel value="activity">
        <p>A chronological feed of trades, logins, and configuration changes.</p>
      </TabPanel>
      <TabPanel value="settings">
        <p>Preferences: density, theme, notification channels.</p>
      </TabPanel>
      <TabPanel value="billing">
        <p>Invoices and payment methods.</p>
      </TabPanel>
    </Tabs>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Vertical: Story = {
  args: { orientation: "vertical" },
};

export const ManualActivation: Story = {
  args: { activationMode: "manual" },
};

export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const overview = canvas.getByRole("tab", { name: "Overview" });
    overview.focus();

    // Arrow to the next tab; automatic activation follows focus.
    await userEvent.keyboard("{ArrowRight}");
    const activity = canvas.getByRole("tab", { name: "Activity" });
    await expect(activity).toHaveFocus();
    await expect(activity).toHaveAttribute("aria-selected", "true");

    // The disabled "Billing" tab is skipped by End -> lands on "Settings".
    await userEvent.keyboard("{End}");
    await expect(canvas.getByRole("tab", { name: "Settings" })).toHaveFocus();
  },
};

/** Drive the selected value yourself to sync tabs with other UI. */
export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState("overview");
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          maxInlineSize: "32rem",
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          Active: <Badge>{value}</Badge>
        </div>
        <Tabs value={value} onValueChange={setValue}>
          <TabList aria-label="Sections">
            <Tab value="overview">Overview</Tab>
            <Tab value="activity">Activity</Tab>
            <Tab value="settings">Settings</Tab>
          </TabList>
          <TabPanel value="overview">Overview panel.</TabPanel>
          <TabPanel value="activity">Activity panel.</TabPanel>
          <TabPanel value="settings">Settings panel.</TabPanel>
        </Tabs>
      </div>
    );
  },
};

/** Tabs are a good fit for grouping a settings form into sections. */
export const WithForms: Story = {
  render: () => (
    <Tabs defaultValue="profile" style={{ maxInlineSize: "32rem" }}>
      <TabList aria-label="Settings">
        <Tab value="profile">Profile</Tab>
        <Tab value="notifications">Notifications</Tab>
      </TabList>
      <TabPanel value="profile">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            paddingBlockStart: "0.75rem",
          }}>
          <FormField label="Display name">
            <Input defaultValue="Jordan Lee" />
          </FormField>
          <FormField label="Email">
            <Input type="email" defaultValue="jordan@example.com" />
          </FormField>
        </div>
      </TabPanel>
      <TabPanel value="notifications">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            paddingBlockStart: "0.75rem",
          }}>
          <Switch label="Email me on trade fills" defaultChecked />
          <Switch label="Weekly summary" />
        </div>
      </TabPanel>
    </Tabs>
  ),
};
