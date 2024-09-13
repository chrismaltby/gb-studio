import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { MenuItem } from "ui/menu/Menu";
import { ScriptEventHeader } from "ui/scripting/ScriptEvents";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof ScriptEventHeader> = {
  title: "UI/Scripting/ScriptEventHeader",
  component: ScriptEventHeader,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    isOpen: { control: "boolean" },
    isMoveable: { control: "boolean" },
    nestLevel: { control: "number" },
    isBreakpoint: { control: "boolean" },
    breakpointTitle: { control: "text" },
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: {
    breakpointTitle: "Breakpoint",
  },
  decorators: [
    (Story) => (
      <div style={{ minWidth: 300 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ScriptEventHeader>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  args: {
    children: "Display Dialogue",
    menuItems: (
      <>
        <MenuItem>Item 1</MenuItem>
        <MenuItem>Item 2</MenuItem>
      </>
    ),
  },
};

export const Open: Story = {
  args: {
    children: "Display Dialogue",
    isOpen: true,
    menuItems: (
      <>
        <MenuItem>Item 1</MenuItem>
        <MenuItem>Item 2</MenuItem>
      </>
    ),
  },
};

export const Commented: Story = {
  args: {
    children: "Display Dialogue",
    isComment: true,
    menuItems: (
      <>
        <MenuItem>Item 1</MenuItem>
        <MenuItem>Item 2</MenuItem>
      </>
    ),
  },
};

export const Immovable: Story = {
  args: {
    children: "Display Dialogue",
    isMoveable: false,
    menuItems: (
      <>
        <MenuItem>Item 1</MenuItem>
        <MenuItem>Item 2</MenuItem>
      </>
    ),
  },
};

export const Breakpoint: Story = {
  args: {
    children: "Display Dialogue",
    isBreakpoint: true,
    menuItems: (
      <>
        <MenuItem>Item 1</MenuItem>
        <MenuItem>Item 2</MenuItem>
      </>
    ),
  },
};

export const ConditionalLevel0: Story = {
  args: {
    children: "If X == Y",
    isConditional: true,
    nestLevel: 0,
    menuItems: (
      <>
        <MenuItem>Item 1</MenuItem>
        <MenuItem>Item 2</MenuItem>
      </>
    ),
  },
};

export const ConditionalLevel1: Story = {
  args: {
    children: "If X == Y",
    isConditional: true,
    nestLevel: 1,
    menuItems: (
      <>
        <MenuItem>Item 1</MenuItem>
        <MenuItem>Item 2</MenuItem>
      </>
    ),
  },
};

export const ConditionalLevel2: Story = {
  args: {
    children: "If X == Y",
    isConditional: true,
    nestLevel: 2,
    menuItems: (
      <>
        <MenuItem>Item 1</MenuItem>
        <MenuItem>Item 2</MenuItem>
      </>
    ),
  },
};

export const ConditionalLevel3: Story = {
  args: {
    children: "If X == Y",
    isConditional: true,
    nestLevel: 3,
    menuItems: (
      <>
        <MenuItem>Item 1</MenuItem>
        <MenuItem>Item 2</MenuItem>
      </>
    ),
  },
};

export const ConditionalLevel4: Story = {
  args: {
    children: "If X == Y",
    isConditional: true,
    nestLevel: 4,
    menuItems: (
      <>
        <MenuItem>Item 1</MenuItem>
        <MenuItem>Item 2</MenuItem>
      </>
    ),
  },
};
