import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, IconButton } from "@utk09/finra-ui";
import { expect, fn, within } from "storybook/test";

import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EditIcon,
  PlusIcon,
  TrashIcon,
} from "./_icons";

const meta: Meta<typeof ButtonGroup> = {
  title: "Components/ButtonGroup",
  component: ButtonGroup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

//  Basic stories

export const Default: Story = {
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="secondary" onClick={fn()}>
        Left
      </Button>
      <Button variant="secondary" onClick={fn()}>
        Center
      </Button>
      <Button variant="secondary" onClick={fn()}>
        Right
      </Button>
    </ButtonGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group");
    await expect(group).toBeVisible();
    const buttons = canvas.getAllByRole("button");
    await expect(buttons).toHaveLength(3);
  },
};

export const Vertical: Story = {
  args: {
    orientation: "vertical",
  },
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="secondary" onClick={fn()}>
        Top
      </Button>
      <Button variant="secondary" onClick={fn()}>
        Middle
      </Button>
      <Button variant="secondary" onClick={fn()}>
        Bottom
      </Button>
    </ButtonGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group");
    await expect(group).toBeVisible();
  },
};

//  Composition stories

export const WithIconButtons: Story = {
  render: (args) => (
    <ButtonGroup {...args}>
      <IconButton
        variant="secondary"
        icon={<ChevronLeftIcon />}
        aria-label="Previous"
        onClick={fn()}
      />
      <IconButton
        variant="secondary"
        icon={<ChevronRightIcon />}
        aria-label="Next"
        onClick={fn()}
      />
    </ButtonGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole("button");
    await expect(buttons).toHaveLength(2);
  },
};

export const Mixed: Story = {
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="secondary" startIcon={<PlusIcon />} onClick={fn()}>
        Add
      </Button>
      <Button variant="secondary" startIcon={<EditIcon />} onClick={fn()}>
        Edit
      </Button>
      <IconButton variant="secondary" icon={<TrashIcon />} aria-label="Delete" onClick={fn()} />
    </ButtonGroup>
  ),
};

export const WithVariants: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Primary buttons</p>
        <ButtonGroup>
          <Button variant="primary" onClick={fn()}>
            Save
          </Button>
          <Button variant="primary" onClick={fn()}>
            Save &amp; Close
          </Button>
          <Button variant="primary" onClick={fn()}>
            Publish
          </Button>
        </ButtonGroup>
      </div>
      <div>
        <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Secondary buttons</p>
        <ButtonGroup>
          <Button variant="secondary" onClick={fn()}>
            Copy
          </Button>
          <Button variant="secondary" onClick={fn()}>
            Cut
          </Button>
          <Button variant="secondary" onClick={fn()}>
            Paste
          </Button>
        </ButtonGroup>
      </div>
      <div>
        <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Tertiary buttons</p>
        <ButtonGroup>
          <Button variant="tertiary" onClick={fn()}>
            Undo
          </Button>
          <Button variant="tertiary" onClick={fn()}>
            Redo
          </Button>
        </ButtonGroup>
      </div>
    </div>
  ),
};

export const WithSentiments: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Danger actions</p>
        <ButtonGroup>
          <Button sentiment="danger" startIcon={<TrashIcon />} onClick={fn()}>
            Delete
          </Button>
          <Button variant="secondary" onClick={fn()}>
            Cancel
          </Button>
        </ButtonGroup>
      </div>
      <div>
        <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Success actions</p>
        <ButtonGroup>
          <Button sentiment="success" startIcon={<CheckIcon />} onClick={fn()}>
            Approve
          </Button>
          <Button variant="secondary" onClick={fn()}>
            Review
          </Button>
        </ButtonGroup>
      </div>
      <div>
        <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Navigation with icons</p>
        <ButtonGroup>
          <IconButton
            variant="secondary"
            icon={<ChevronLeftIcon />}
            aria-label="Previous page"
            onClick={fn()}
          />
          <Button variant="secondary" onClick={fn()}>
            Page 1
          </Button>
          <Button variant="secondary" onClick={fn()}>
            Page 2
          </Button>
          <Button variant="secondary" onClick={fn()}>
            Page 3
          </Button>
          <IconButton
            variant="secondary"
            icon={<ChevronRightIcon />}
            aria-label="Next page"
            onClick={fn()}
          />
        </ButtonGroup>
      </div>
    </div>
  ),
};
