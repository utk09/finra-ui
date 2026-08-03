import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileDropZoneBase } from "@utk09/finra-ui/unstyled";
import { expect, within } from "storybook/test";

const meta: Meta<typeof FileDropZoneBase> = {
  title: "Unstyled/FileDropZoneBase",
  component: FileDropZoneBase,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 400 }}>
      <FileDropZoneBase
        style={{ border: "2px dashed #ccc", padding: "2rem", textAlign: "center" }}
        aria-label="Upload files"
      />
      <FileDropZoneBase
        accept=".pdf,.csv"
        style={{ border: "2px dashed #ccc", padding: "2rem", textAlign: "center" }}
        aria-label="Upload documents">
        <span>Drop PDFs or CSVs here</span>
      </FileDropZoneBase>
      <FileDropZoneBase
        disabled
        style={{
          border: "2px dashed #ccc",
          padding: "2rem",
          textAlign: "center",
          opacity: 0.5,
        }}
        aria-label="Disabled upload">
        <span>Disabled</span>
      </FileDropZoneBase>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const zone = canvas.getByLabelText("Upload files");
    await expect(zone).toBeVisible();
  },
};
