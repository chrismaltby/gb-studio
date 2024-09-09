import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Provider } from "react-redux";
import AppToolbar from "components/app/AppToolbar";
import { configureStore, createSlice } from "@reduxjs/toolkit";

const Mockstore = ({ children }: { children: React.ReactNode }) => (
  <Provider
    store={configureStore({
      reducer: {
        document: createSlice({
          name: "document",
          initialState: {
            loaded: true,
          },
          reducers: {},
        }).reducer,
        project: createSlice({
          name: "project",
          initialState: {
            present: {
              metadata: {
                name: "My Project",
              },
            },
          },
          reducers: {},
        }).reducer,
        navigation: createSlice({
          name: "navigation",
          initialState: {
            section: "world",
          },
          reducers: {},
        }).reducer,
        editor: createSlice({
          name: "editor",
          initialState: {
            zoom: 100,
          },
          reducers: {},
        }).reducer,
        console: createSlice({
          name: "console",
          initialState: {
            status: "idle",
          },
          reducers: {},
        }).reducer,
      },
    })}
  >
    {children}
  </Provider>
);

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof AppToolbar> = {
  title: "App/AppToolbar",
  component: AppToolbar,
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
  excludeStories: /.*MockedState$/,
};

export default meta;
type Story = StoryObj<typeof AppToolbar>;

(window as any).API = { platform: "darwin" };

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  decorators: [
    (story) => {
      (window as any).API = { platform: "darwin" };
      return <Mockstore>{story()}</Mockstore>;
    },
  ],
};
