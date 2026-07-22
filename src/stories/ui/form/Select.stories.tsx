import type { Meta, StoryObj } from "@storybook/react-webpack5";
import React from "react";
import { Option, OptGroup, Select } from "ui/form/Select";

const options: Option[] = Array.from({ length: 40 }, (_, index) => ({
  value: `option-${index + 1}`,
  label: `Option ${index + 1}`,
}));

const groupedOptions: OptGroup[] = Array.from(
  { length: 4 },
  (_, groupIndex) => ({
    label: `Group ${groupIndex + 1}`,
    options: Array.from({ length: 20 }, (_, optionIndex) => ({
      value: `group-${groupIndex + 1}-option-${optionIndex + 1}`,
      label: `Group ${groupIndex + 1}, Option ${optionIndex + 1}`,
    })),
  }),
);

let previewMountId = 0;

const MemoizedPreview = React.memo(({ value }: { value: string }) => {
  const mountId = React.useRef<number | undefined>(undefined);
  if (mountId.current === undefined) {
    mountId.current = ++previewMountId;
  }
  return (
    <span data-preview={value} data-mount-id={mountId.current}>
      ■
    </span>
  );
});

const formatOptionWithPreview = (data: unknown) => {
  const option = data as Option;
  return (
    <>
      <MemoizedPreview value={option.value} /> {option.label}
    </>
  );
};

const meta: Meta<typeof Select> = {
  title: "UI/Forms/Select",
  component: Select,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div style={{ width: 300, minHeight: 360 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Flat: Story = {
  args: {
    name: "flat",
    options,
    value: options[options.length - 1],
    menuIsOpen: true,
    menuPortalTarget: null,
    maxMenuHeight: 130,
  },
};

export const Grouped: Story = {
  args: {
    name: "grouped",
    options: groupedOptions,
    value: groupedOptions[3].options[19],
    menuIsOpen: true,
    menuPortalTarget: null,
    maxMenuHeight: 130,
  },
};

export const Centered: Story = {
  args: {
    name: "centered",
    options,
    value: options[19],
    menuIsOpen: true,
    menuPortalTarget: null,
    maxMenuHeight: 130,
  },
};

export const PortaledCentered: Story = {
  args: {
    name: "portaled-centered",
    options,
    value: options[19],
    menuIsOpen: true,
    maxMenuHeight: 130,
  },
  render: (args) => <Select {...args} menuPortalTarget={document.body} />,
};

export const MemoizedPreviews: Story = {
  args: {
    name: "memoized-previews",
    options,
    value: options[19],
    formatOptionLabel: formatOptionWithPreview,
    menuIsOpen: true,
    menuPortalTarget: null,
    maxMenuHeight: 130,
  },
};

export const UngroupedThenGrouped: Story = {
  args: {
    name: "ungrouped-then-grouped",
    options: [
      {
        label: "",
        options: options.slice(0, 5),
      },
      {
        label: "Plugin",
        options: options.slice(5, 10),
      },
    ],
    value: options[0],
    menuIsOpen: true,
    menuPortalTarget: null,
    maxMenuHeight: 130,
  },
};
