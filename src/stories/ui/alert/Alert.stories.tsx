import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Alert, AlertItem } from "ui/alerts/Alert";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof Alert> = {
  title: "UI/Alerts/Alert",
  component: Alert,
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
type Story = StoryObj<typeof Alert>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Warning: Story = {
  args: {
    variant: "warning",
    children: "Scenes",
  },
};

export const Info: Story = {
  args: {
    variant: "info",
    children: "Scenes",
  },
};

export const WithItems: Story = {
  args: {
    variant: "warning",
    children: (
      <>
        <AlertItem>Item1</AlertItem>
        <AlertItem>Item2</AlertItem>
        <AlertItem>Item3</AlertItem>
      </>
    ),
  },
};

export const WithOneItem: Story = {
  args: {
    variant: "warning",
    children: (
      <>
        <AlertItem>Item1</AlertItem>
      </>
    ),
  },
};
