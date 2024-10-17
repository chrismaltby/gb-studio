import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import React, { useContext } from "react";
import { ThemeContext } from "styled-components";
import { StickyTabs, TabBar } from "ui/tabs/Tabs";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof TabBar> = {
  title: "UI/Tabs/TabBar",
  component: TabBar,
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
    },
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: { onChange: fn() },
  decorators: [
    (Story) => (
      <div style={{ width: 300 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TabBar>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Normal: Story = {
  args: {
    value: "script",
    values: { script: "On Interact", init: "On Init", update: "On Update" },
  },
  decorators: [
    (Story) => (
      <StickyTabs>
        <Story />
      </StickyTabs>
    ),
  ],
};

export const Overflowing: Story = {
  args: {
    value: "script",
    values: {
      script: "On Interact",
      init: "On Init",
      update: "On Update",
      enter: "On Enter",
      leave: "On Leave",
    },
  },
  decorators: [
    (Story) => (
      <StickyTabs>
        <Story />
      </StickyTabs>
    ),
  ],
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    value: "script",
    values: { script: "On Interact", init: "On Init", update: "On Update" },
  },
};

export const OverflowingSecondary: Story = {
  args: {
    variant: "secondary",
    value: "script",
    values: {
      script: "On Interact",
      init: "On Init",
      update: "On Update",
      enter: "On Enter",
      leave: "On Leave",
    },
  },
  decorators: [
    (Story) => (
      <StickyTabs>
        <Story />
      </StickyTabs>
    ),
  ],
};

export const ScriptEventTabs: Story = {
  args: {
    variant: "scriptEvent",
    value: "script",
    values: { script: "On Interact", init: "On Init", update: "On Update" },
  },
  decorators: [
    (Story) => {
      const themeContext = useContext(ThemeContext);
      return (
        <div
          style={{
            background: themeContext?.colors.scripting.form.background,
          }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export const OverflowingScriptEventTabs: Story = {
  args: {
    variant: "scriptEvent",
    value: "script",
    values: {
      script: "On Interact",
      init: "On Init",
      update: "On Update",
      enter: "On Enter",
      leave: "On Leave",
    },
  },
  decorators: [
    (Story) => {
      const themeContext = useContext(ThemeContext);
      return (
        <div
          style={{
            background: themeContext?.colors.scripting.form.background,
          }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export const EventSectionTabs: Story = {
  args: {
    variant: "eventSection",
    value: "script",
    values: { script: "On Interact", init: "On Init", update: "On Update" },
  },
};

export const OverflowingEventSectionTabs: Story = {
  args: {
    variant: "eventSection",
    value: "script",
    values: {
      script: "On Interact",
      init: "On Init",
      update: "On Update",
      enter: "On Enter",
      leave: "On Leave",
    },
  },
};
