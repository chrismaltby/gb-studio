import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import React from "react";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof SplitPaneHeader> = {
  title: "UI/SplitPane/SplitPaneHeader",
  component: SplitPaneHeader,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    variant: {
      control: "select",
      options: ["normal", "primary", "transparent", "underlined"],
    },
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: {},
  decorators: [
    (Story) => (
      <div style={{ width: 300, minHeight: 30 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SplitPaneHeader>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Normal: Story = {
  args: {
    variant: "normal",
    children: "Scenes",
  },
};

export const NoBottomBorder: Story = {
  args: {
    variant: "normal",
    children: "Scenes",
    borderBottom: false,
  },
};

export const Collapsible: Story = {
  args: {
    variant: "normal",
    children: "Scenes",
    onToggle: fn(),
  },
};

export const CollapsibleCollapsed: Story = {
  args: {
    variant: "normal",
    children: "Scenes",
    onToggle: fn(),
    collapsed: true,
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Scenes",
  },
};
