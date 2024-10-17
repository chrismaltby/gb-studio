import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { ScriptEventBranchHeader } from "ui/scripting/ScriptEvents";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof ScriptEventBranchHeader> = {
  title: "UI/Scripting/ScriptEventBranchHeader",
  component: ScriptEventBranchHeader,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    isOpen: { control: "boolean" },
    nestLevel: { control: "number" },
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: {},
  decorators: [
    (Story) => (
      <div style={{ minWidth: 300 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ScriptEventBranchHeader>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  args: {
    children: "Display Dialogue",
  },
};

export const Open: Story = {
  args: {
    children: "Display Dialogue",
    isOpen: true,
  },
};

export const ConditionalLevel0: Story = {
  args: {
    children: "If X == Y",
    nestLevel: 0,
  },
};

export const ConditionalLevel1: Story = {
  args: {
    children: "If X == Y",
    nestLevel: 1,
  },
};

export const ConditionalLevel2: Story = {
  args: {
    children: "If X == Y",
    nestLevel: 2,
  },
};

export const ConditionalLevel3: Story = {
  args: {
    children: "If X == Y",
    nestLevel: 3,
  },
};

export const ConditionalLevel4: Story = {
  args: {
    children: "If X == Y",
    nestLevel: 4,
  },
};
