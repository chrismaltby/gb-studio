import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import React from "react";
import { EntityListItem } from "ui/lists/EntityListItem";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof EntityListItem> = {
  title: "UI/Lists/EntityListItem",
  component: EntityListItem,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: {
    onToggleCollapse: fn(),
    onContextMenu: fn(),
    onRename: fn(),
    onRenameCancel: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 300, minHeight: 30 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EntityListItem>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Open: Story = {
  args: {
    item: {
      name: "Scene 1",
    },
    type: "scene",
    collapsable: true,
    collapsed: false,
  },
};

export const Collapsed: Story = {
  args: {
    item: {
      name: "Scene 1",
    },
    type: "scene",
    collapsable: true,
    collapsed: true,
  },
};

export const Nested: Story = {
  args: {
    item: {
      name: "Scene 1",
    },
    type: "scene",
    collapsable: true,
    collapsed: true,
    nestLevel: 3,
  },
};

export const Renaming: Story = {
  args: {
    item: {
      name: "Scene 1",
    },
    type: "scene",
    rename: true,
  },
};

export const NoIcon: Story = {
  args: {
    item: {
      name: "Scene 1",
    },
    collapsable: true,
    collapsed: true,
  },
};

export const TextOnly: Story = {
  args: {
    item: {
      name: "Scene 1",
    },
  },
};
