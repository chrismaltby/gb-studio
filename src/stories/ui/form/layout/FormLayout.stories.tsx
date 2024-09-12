import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import {
  FormContainer,
  FormDivider,
  FormHeader,
  FormRow,
  FormSectionTitle,
} from "ui/form/layout/FormLayout";
import { TextField } from "ui/form/TextField";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof FormContainer> = {
  title: "UI/Forms/FormLayout",
  component: FormContainer,
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
      <div style={{ minWidth: 300 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FormContainer>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Layout: Story = {
  args: {
    children: (
      <>
        <FormHeader>Form Title</FormHeader>
        <FormSectionTitle>Section</FormSectionTitle>
        <FormRow>
          <TextField
            name="name"
            label="Project Name"
            info="Lorem ipsum"
          ></TextField>
        </FormRow>
        <FormDivider />
        <FormRow>
          <TextField name="author" label="Author"></TextField>
        </FormRow>
      </>
    ),
  },
};
