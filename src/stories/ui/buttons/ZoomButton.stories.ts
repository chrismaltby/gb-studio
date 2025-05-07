import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ZoomButton } from "ui/buttons/ZoomButton";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof ZoomButton> = {
  title: "UI/Buttons/ZoomButton",
  component: ZoomButton,
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
  args: { onZoomIn: fn(), onZoomOut: fn(), onZoomReset: fn() },
};

export default meta;
type Story = StoryObj<typeof ZoomButton>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Normal: Story = {
  args: {
    variant: "normal",
    zoom: 100,
  },
};

export const Small: Story = {
  args: {
    size: "small",
  },
};
