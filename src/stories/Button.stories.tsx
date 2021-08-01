import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import { Button } from "ui/buttons/Button";
import { darkThemeDecorator } from "./helpers";
import { FolderIcon } from "ui/icons/Icons";

export default {
  title: "Components/Button",
  component: Button,
  argTypes: {
    onClick: { action: "clicked" },
  },
} as ComponentMeta<typeof Button>;

const Template: ComponentStory<typeof Button> = (args) => <Button {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: "Button",
};

export const DefaultDark = Template.bind({});
DefaultDark.args = Default.args;
DefaultDark.decorators = [darkThemeDecorator];

export const WithIcon = Template.bind({});
WithIcon.args = {
  children: <FolderIcon />,
};

export const WithIconDark = Template.bind({});
WithIconDark.args = WithIcon.args;
WithIconDark.decorators = [darkThemeDecorator];

export const Primary = Template.bind({});
Primary.args = {
  variant: "primary",
  size: "large",
  children: "Button",
};

export const Large = Template.bind({});
Large.args = {
  size: "large",
  children: "Button",
};
export const LargeDark = Template.bind({});
LargeDark.args = Large.args;
LargeDark.decorators = [darkThemeDecorator];

export const Small = Template.bind({});
Small.args = {
  size: "small",
  children: "Button",
};

export const SmallDark = Template.bind({});
SmallDark.args = Small.args;
SmallDark.decorators = [darkThemeDecorator];

export const Transparent = Template.bind({});
Transparent.args = {
  variant: "transparent",
  children: "Button",
};
