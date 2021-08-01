import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import { Menu, MenuAccelerator, MenuDivider, MenuItem } from "ui/menu/Menu";
import { darkThemeDecorator } from "./helpers";
import { Checkbox } from "ui/form/Checkbox";

export default {
  title: "Components/Menu",
  component: Menu,
} as ComponentMeta<typeof Menu>;

const Template: ComponentStory<typeof Menu> = (args) => (
  <Menu {...args} theme={undefined} />
);

export const WithItems = Template.bind({});
WithItems.args = {
  children: (
    <>
      <MenuItem>First</MenuItem>
      <MenuItem>Second</MenuItem>
      <MenuItem>Third</MenuItem>
    </>
  ),
};

export const WithItemsDark = Template.bind({});
WithItemsDark.args = WithItems.args;
WithItemsDark.decorators = [darkThemeDecorator];

export const WithDividers = Template.bind({});
WithDividers.args = {
  children: (
    <>
      <MenuItem>First</MenuItem>
      <MenuDivider />
      <MenuItem>Second</MenuItem>
      <MenuDivider />
      <MenuItem>Third</MenuItem>
    </>
  ),
};

export const WithDividersDark = Template.bind({});
WithDividersDark.args = WithDividers.args;
WithDividersDark.decorators = [darkThemeDecorator];

export const WithAccelerators = Template.bind({});
WithAccelerators.args = {
  children: (
    <>
      <MenuItem>
        First <MenuAccelerator accelerator="CommandOrControl+1" />
      </MenuItem>
      <MenuItem>
        Second <MenuAccelerator accelerator="CommandOrControl+2" />
      </MenuItem>
      <MenuItem>
        Third <MenuAccelerator accelerator="CommandOrControl+3" />
      </MenuItem>
    </>
  ),
};

export const WithAcceleratorsDark = Template.bind({});
WithAcceleratorsDark.args = WithAccelerators.args;
WithAcceleratorsDark.decorators = [darkThemeDecorator];

export const WithCheckboxes = Template.bind({});
WithCheckboxes.args = {
  children: (
    <>
      <MenuItem>
        <Checkbox id="first" name="first" defaultChecked /> First
      </MenuItem>
      <MenuItem>
        <Checkbox id="second" name="second" /> Second
      </MenuItem>
      <MenuItem>
        <Checkbox id="third" name="third" /> Third
      </MenuItem>
    </>
  ),
};

export const WithCheckboxesDark = Template.bind({});
WithCheckboxesDark.args = WithCheckboxes.args;
WithCheckboxesDark.decorators = [darkThemeDecorator];
