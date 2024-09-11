import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import React from "react";
import { Menu, MenuDivider, MenuItem, MenuGroup } from "ui/menu/Menu";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof Menu> = {
  title: "UI/Menu/Menu",
  component: Menu,
  subcomponents: { MenuItem, MenuDivider },
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
    onClick: fn(),
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
type Story = StoryObj<typeof Menu>;

export const Default: Story = {
  args: {
    children: (
      <>
        <MenuItem>Item 1</MenuItem>
        <MenuItem>Item 2</MenuItem>
        <MenuDivider />
        <MenuItem subMenu={[<MenuItem key="sub-1">Item4</MenuItem>]}>
          Item 3
        </MenuItem>
      </>
    ),
  },
};

export const WithGroups: Story = {
  args: {
    children: (
      <>
        <MenuGroup>Group 1</MenuGroup>
        <MenuItem>Item 1</MenuItem>
        <MenuItem>Item 2</MenuItem>
        <MenuGroup>Group 2</MenuGroup>
        <MenuItem subMenu={[<MenuItem key="sub-1">Item4</MenuItem>]}>
          Item 3
        </MenuItem>
      </>
    ),
  },
};
