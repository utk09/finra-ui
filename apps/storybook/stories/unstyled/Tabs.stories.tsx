import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tab, TabList, TabPanel, Tabs } from "@utk09/finra-ui/unstyled";
import { expect, userEvent, within } from "storybook/test";

const meta: Meta<typeof Tabs> = {
  title: "Unstyled/Tabs",
  component: Tabs,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview" style={{ maxWidth: 360 }}>
      <TabList
        aria-label="Sections"
        style={{ display: "flex", gap: "0.25rem", borderBottom: "1px solid #ccc" }}>
        <Tab value="overview" style={{ padding: "0.5rem 0.75rem", cursor: "pointer" }}>
          Overview
        </Tab>
        <Tab value="activity" style={{ padding: "0.5rem 0.75rem", cursor: "pointer" }}>
          Activity
        </Tab>
        <Tab value="settings" style={{ padding: "0.5rem 0.75rem", cursor: "pointer" }}>
          Settings
        </Tab>
      </TabList>
      <TabPanel value="overview" style={{ padding: "0.75rem 0" }}>
        Overview panel.
      </TabPanel>
      <TabPanel value="activity" style={{ padding: "0.75rem 0" }}>
        Activity panel.
      </TabPanel>
      <TabPanel value="settings" style={{ padding: "0.75rem 0" }}>
        Settings panel.
      </TabPanel>
    </Tabs>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const overview = canvas.getByRole("tab", { name: "Overview" });
    overview.focus();
    // Roving arrow keys; automatic activation follows focus.
    await userEvent.keyboard("{ArrowRight}");
    const activity = canvas.getByRole("tab", { name: "Activity" });
    await expect(activity).toHaveFocus();
    await expect(activity).toHaveAttribute("aria-selected", "true");
  },
};
