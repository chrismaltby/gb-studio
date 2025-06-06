import type { Meta } from "@storybook/react";
import React, { useMemo, useState } from "react";
import { SortableList } from "ui/lists/SortableList";
import AppContainerDnD from "components/app/AppContainerDnD";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof SortableList> = {
  title: "UI/Lists/SortableList",
  component: SortableList,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  decorators: [
    (Story) => (
      <AppContainerDnD>
        <div style={{ width: 600, height: 460 }}>
          <Story />
        </div>
      </AppContainerDnD>
    ),
  ],
};

export default meta;

const moveItems = <T,>(arr: T[], fromIndexes: number[], to: number): T[] => {
  const sortedIndexes = [...fromIndexes].sort((a, b) => a - b);
  const selectedItems = sortedIndexes.map((index) => arr[index]);

  const remainingItems = arr.filter(
    (_, index) => !sortedIndexes.includes(index),
  );

  const adjustedIndex =
    to > sortedIndexes[sortedIndexes.length - 1]
      ? to - sortedIndexes.length + 1
      : to;

  return [
    ...remainingItems.slice(0, adjustedIndex),
    ...selectedItems,
    ...remainingItems.slice(adjustedIndex),
  ];
};

const ItemType = "ITEM";

const initialItems = [
  {
    id: "1",
    text: "one",
  },
  {
    id: "2",
    text: "two",
  },
  {
    id: "3",
    text: "three",
  },
  {
    id: "4",
    text: "Four",
  },
  {
    id: "5",
    text: "Five",
  },
  {
    id: "6",
    text: "Six",
  },
  {
    id: "7",
    text: "Seven",
  },
];

export const Horizontal = () => {
  const [selectedId, setSelectedId] = useState("");
  const [multiSelectionIds, setMultiSelectionIds] = useState<string[]>([]);
  const [items, setItems] = useState(initialItems);
  const selectedIndex = useMemo(
    () => items.findIndex((i) => i.id === selectedId),
    [items, selectedId],
  );
  return (
    <SortableList
      itemType={ItemType}
      items={items}
      extractKey={(item) => item.id}
      selectedIndex={selectedIndex}
      onSelect={(item, e) => {
        if (e?.shiftKey) {
          if (multiSelectionIds.includes(item.id)) {
            setMultiSelectionIds(
              multiSelectionIds.filter((i) => i !== item.id),
            );
          } else {
            setMultiSelectionIds(
              ([] as string[]).concat(multiSelectionIds, item.id),
            );
          }
        } else {
          setSelectedId(item.id);
          if (!multiSelectionIds.includes(item.id)) {
            setMultiSelectionIds([item.id]);
          }
        }
      }}
      moveItems={(from, to) => {
        const multiSelectionIndexes = multiSelectionIds.map((id) =>
          items.findIndex((i) => i.id === id),
        );
        if (multiSelectionIndexes.includes(to)) {
          return;
        }
        const newArr = moveItems(items, multiSelectionIndexes, to);
        setItems(newArr);
      }}
      renderItem={(item, { isDragging, isDraggingAny }) => (
        <div
          style={{
            width: 50,
            height: 50,
            background: "#ddd",
            opacity:
              isDragging ||
              (isDraggingAny &&
                item.id !== selectedId &&
                multiSelectionIds.includes(item.id))
                ? 0
                : 1,
            color: isDragging ? "red" : "green",
            outline:
              selectedId === item.id
                ? "3px solid red"
                : multiSelectionIds.includes(item.id)
                  ? "1px solid red"
                  : "none",
          }}
        >
          {item.text}
        </div>
      )}
    />
  );
};

export const Vertical = () => {
  const [selectedId, setSelectedId] = useState("");
  const [multiSelectionIds, setMultiSelectionIds] = useState<string[]>([]);
  const [items, setItems] = useState(initialItems);
  const selectedIndex = useMemo(
    () => items.findIndex((i) => i.id === selectedId),
    [items, selectedId],
  );
  return (
    <SortableList
      orientation="vertical"
      itemType={ItemType}
      items={items}
      extractKey={(item) => item.id}
      selectedIndex={selectedIndex}
      onSelect={(item, e) => {
        if (e?.shiftKey) {
          if (multiSelectionIds.includes(item.id)) {
            setMultiSelectionIds(
              multiSelectionIds.filter((i) => i !== item.id),
            );
          } else {
            setMultiSelectionIds(
              ([] as string[]).concat(multiSelectionIds, item.id),
            );
          }
        } else {
          setSelectedId(item.id);
          if (!multiSelectionIds.includes(item.id)) {
            setMultiSelectionIds([item.id]);
          }
        }
      }}
      moveItems={(from, to) => {
        const multiSelectionIndexes = multiSelectionIds.map((id) =>
          items.findIndex((i) => i.id === id),
        );
        if (multiSelectionIndexes.includes(to)) {
          return;
        }
        const newArr = moveItems(items, multiSelectionIndexes, to);
        setItems(newArr);
      }}
      renderItem={(item, { isDragging, isDraggingAny }) => (
        <div
          style={{
            width: 50,
            height: 50,
            background: "#ddd",
            opacity:
              isDragging ||
              (isDraggingAny &&
                item.id !== selectedId &&
                multiSelectionIds.includes(item.id))
                ? 0
                : 1,
            outline:
              selectedId === item.id
                ? "3px solid red"
                : multiSelectionIds.includes(item.id)
                  ? "1px solid red"
                  : "none",
          }}
        >
          {item.text}
        </div>
      )}
    />
  );
};

export const HorizontalWithAppended = () => {
  const [selectedId, setSelectedId] = useState("");
  const [multiSelectionIds, setMultiSelectionIds] = useState<string[]>([]);
  const [items, setItems] = useState(initialItems);
  const selectedIndex = useMemo(
    () => items.findIndex((i) => i.id === selectedId),
    [items, selectedId],
  );
  return (
    <SortableList
      itemType={ItemType}
      items={items}
      extractKey={(item) => item.id}
      gap={2}
      selectedIndex={selectedIndex}
      onSelect={(item, e) => {
        if (e?.shiftKey) {
          if (multiSelectionIds.includes(item.id)) {
            setMultiSelectionIds(
              multiSelectionIds.filter((i) => i !== item.id),
            );
          } else {
            setMultiSelectionIds(
              ([] as string[]).concat(multiSelectionIds, item.id),
            );
          }
        } else {
          setSelectedId(item.id);
          if (!multiSelectionIds.includes(item.id)) {
            setMultiSelectionIds([item.id]);
          }
        }
      }}
      moveItems={(from, to) => {
        const multiSelectionIndexes = multiSelectionIds.map((id) =>
          items.findIndex((i) => i.id === id),
        );
        if (multiSelectionIndexes.includes(to)) {
          return;
        }
        const newArr = moveItems(items, multiSelectionIndexes, to);
        setItems(newArr);
      }}
      renderItem={(item, { isDragging, isDraggingAny }) => (
        <div
          style={{
            width: 50,
            height: 50,
            background: "#ddd",
            opacity:
              isDragging ||
              (isDraggingAny &&
                item.id !== selectedId &&
                multiSelectionIds.includes(item.id))
                ? 0
                : 1,
            outline:
              selectedId === item.id
                ? "3px solid red"
                : multiSelectionIds.includes(item.id)
                  ? "1px solid red"
                  : "none",
          }}
        >
          {item.text}
        </div>
      )}
      appendComponent={
        <button
          onClick={() => {
            setItems(
              ([] as { id: string; text: string }[]).concat(items, {
                id: String(items.length + 1),
                text: "New item" + (items.length + 1),
              }),
            );
          }}
        >
          Add
        </button>
      }
    />
  );
};

export const VerticalWithAppended = () => {
  const [selectedId, setSelectedId] = useState("");
  const [multiSelectionIds, setMultiSelectionIds] = useState<string[]>([]);
  const [items, setItems] = useState(initialItems);
  const selectedIndex = useMemo(
    () => items.findIndex((i) => i.id === selectedId),
    [items, selectedId],
  );
  return (
    <SortableList
      orientation="vertical"
      itemType={ItemType}
      items={items}
      extractKey={(item) => item.id}
      selectedIndex={selectedIndex}
      onSelect={(item, e) => {
        if (e?.shiftKey) {
          if (multiSelectionIds.includes(item.id)) {
            setMultiSelectionIds(
              multiSelectionIds.filter((i) => i !== item.id),
            );
          } else {
            setMultiSelectionIds(
              ([] as string[]).concat(multiSelectionIds, item.id),
            );
          }
        } else {
          setSelectedId(item.id);
          if (!multiSelectionIds.includes(item.id)) {
            setMultiSelectionIds([item.id]);
          }
        }
      }}
      moveItems={(from, to) => {
        const multiSelectionIndexes = multiSelectionIds.map((id) =>
          items.findIndex((i) => i.id === id),
        );
        if (multiSelectionIndexes.includes(to)) {
          return;
        }
        const newArr = moveItems(items, multiSelectionIndexes, to);
        setItems(newArr);
      }}
      renderItem={(item, { isDragging, isDraggingAny }) => (
        <div
          style={{
            width: 50,
            height: 50,
            background: "#ddd",
            opacity:
              isDragging ||
              (isDraggingAny &&
                item.id !== selectedId &&
                multiSelectionIds.includes(item.id))
                ? 0
                : 1,
            outline:
              selectedId === item.id
                ? "3px solid red"
                : multiSelectionIds.includes(item.id)
                  ? "1px solid red"
                  : "none",
          }}
        >
          {item.text}
        </div>
      )}
      appendComponent={
        <button
          onClick={() => {
            setItems(
              ([] as { id: string; text: string }[]).concat(items, {
                id: String(items.length + 1),
                text: "New item" + (items.length + 1),
              }),
            );
          }}
        >
          Add
        </button>
      }
    />
  );
};
