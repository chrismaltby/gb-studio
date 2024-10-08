import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { MenuItem } from "ui/menu/Menu";
import { ExportIcon } from "ui/icons/Icons";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof DropdownButton> = {
  title: "UI/Buttons/DropdownButton",
  component: DropdownButton,
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
};

export default meta;
type Story = StoryObj<typeof DropdownButton>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Normal: Story = {
  args: {
    variant: "normal",
    label: "Button",
    children: [
      <MenuItem key="item1">Item 1</MenuItem>,
      <MenuItem key="item2">Item 2</MenuItem>,
    ],
  },
};

export const WithIcon: Story = {
  args: {
    variant: "normal",
    label: <ExportIcon />,
    children: [
      <MenuItem key="item1">Item 1</MenuItem>,
      <MenuItem key="item2">Item 2</MenuItem>,
    ],
  },
};

export const WithIconNoArrow: Story = {
  args: {
    variant: "normal",
    label: <ExportIcon />,
    showArrow: false,
    children: [
      <MenuItem key="item1">Item 1</MenuItem>,
      <MenuItem key="item2">Item 2</MenuItem>,
    ],
  },
};

export const WithSubMenus: Story = {
  args: {
    variant: "normal",
    label: "Button",
    children: [
      <MenuItem
        key="item1"
        subMenu={[
          <MenuItem key="item3">Item 3</MenuItem>,
          <MenuItem key="item4">Item 4</MenuItem>,
        ]}
      >
        Item 1
      </MenuItem>,
      <MenuItem
        key="item2"
        subMenu={[
          <MenuItem key="item5">Item 5</MenuItem>,
          <MenuItem key="item6">Item 6</MenuItem>,
        ]}
      >
        Item 2
      </MenuItem>,
    ],
  },
};
