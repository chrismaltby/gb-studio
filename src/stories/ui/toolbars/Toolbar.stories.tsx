import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { FlexGrow } from "ui/spacing/Spacing";
import { Toolbar, ToolbarTitle } from "ui/toolbar/Toolbar";
import { Normal as DropdownButtonNormal } from "../buttons/DropdownButton.stories";
import { DropdownButton } from "ui/buttons/DropdownButton";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof Toolbar> = {
  title: "UI/Toolbars/Toolbar",
  component: Toolbar,
  subcomponents: {
    ToolbarTitle,
  },
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: {},
  decorators: [
    (Story) => (
      <div style={{ minWidth: 700 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Toolbar>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  args: {
    children: (
      <>
        <DropdownButton {...DropdownButtonNormal.args} />
        <FlexGrow />
        <ToolbarTitle>Title</ToolbarTitle>
        <FlexGrow />
        <DropdownButton {...DropdownButtonNormal.args} />
      </>
    ),
  },
};

export const Unfocused: Story = {
  args: {
    children: (
      <>
        <DropdownButton {...DropdownButtonNormal.args} />
        <FlexGrow />
        <ToolbarTitle>Title</ToolbarTitle>
        <FlexGrow />
        <DropdownButton {...DropdownButtonNormal.args} />
      </>
    ),
    focus: false,
  },
};
