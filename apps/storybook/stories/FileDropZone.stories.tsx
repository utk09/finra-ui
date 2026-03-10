import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileDropZone } from "@utk09/finra-ui";
import { fn, expect, within } from "storybook/test";

const meta: Meta<typeof FileDropZone> = {
  title: "Components/FileDropZone",
  component: FileDropZone,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    disabled: {
      control: "boolean",
    },
    multiple: {
      control: "boolean",
    },
    accept: {
      control: "text",
    },
  },
  args: {
    onChange: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ minInlineSize: 400 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Basic stories ───

export const Default: Story = {
  args: {
    "aria-label": "Upload files",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Drop files here or click to browse")).toBeVisible();
  },
};

export const AcceptPDF: Story = {
  args: {
    "aria-label": "Upload PDF",
    accept: ".pdf",
  },
};

export const Multiple: Story = {
  args: {
    "aria-label": "Upload multiple files",
    multiple: true,
  },
};

export const Disabled: Story = {
  args: {
    "aria-label": "Upload disabled",
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toHaveAttribute("aria-disabled", "true");
  },
};

export const CustomContent: Story = {
  args: {
    "aria-label": "Upload images",
    accept: "image/*",
    children: (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBlockEnd: "0.5rem" }}>📷</div>
        <div style={{ fontWeight: 600 }}>Upload images</div>
        <div style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}>
          PNG, JPG, GIF up to 10MB
        </div>
      </div>
    ),
  },
};

// ─── Interactive ───

export const WithFileList: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <FileDropZone
          aria-label="Upload documents"
          multiple
          accept=".pdf,.csv,.xlsx"
          onChange={(newFiles) => setFiles((prev) => [...prev, ...newFiles])}
        />
        {files.length > 0 ? (
          <ul style={{ margin: 0, paddingInlineStart: "1.25rem", fontSize: "0.875rem" }}>
            {files.map((file) => (
              <li key={file.name}>
                {file.name}{" "}
                <span style={{ color: "var(--color-neutral-500)" }}>
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  },
};

// ─── Showcase ───

export const AllStates: Story = {
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div style={{ minInlineSize: 500 }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <FileDropZone aria-label="Default" />
      <FileDropZone aria-label="Disabled" disabled />
      <FileDropZone aria-label="Custom" accept="image/*">
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem" }}>🖼️</div>
          <div>Drop images here</div>
        </div>
      </FileDropZone>
    </div>
  ),
};
