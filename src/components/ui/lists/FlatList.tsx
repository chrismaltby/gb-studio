import throttle from "lodash/throttle";
import React, {
  CSSProperties,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { FixedSizeList as List } from "react-window";
import styled from "styled-components";
import { ThemeInterface } from "ui/theme/ThemeInterface";
import { ListItem } from "./ListItem";
import { getEventNodeName } from "renderer/lib/helpers/dom";

export interface FlatListItem {
  id: string;
  name: string;
}

interface RowProps<T extends FlatListItem> {
  readonly index: number;
  readonly style: CSSProperties;
  readonly data: {
    readonly items: T[];
    readonly selectedId: string;
    readonly highlightIds?: string[];
    readonly setSelectedId?: (value: string, item: T) => void;
    readonly renderItem: (props: {
      selected: boolean;
      item: T;
      index: number;
    }) => React.ReactNode;
  };
}

export interface FlatListProps<T extends FlatListItem> {
  readonly height: number;
  readonly items: T[];
  readonly selectedId?: string;
  readonly highlightIds?: string[];
  readonly setSelectedId?: (id: string, item: T) => void;
  readonly onKeyDown?: (e: KeyboardEvent, item?: T) => void;
  readonly children: (props: {
    selected: boolean;
    item: T;
    index: number;
  }) => React.ReactNode;
  readonly theme?: ThemeInterface;
}

const Wrapper = styled.div`
  padding: 0;
  width: 100%;
  box-sizing: border-box;
`;

const Row = <T extends FlatListItem>({ index, style, data }: RowProps<T>) => {
  const item = data.items[index];
  if (!item) {
    return <div style={style} />;
  }
  return (
    <div
      key={item.id}
      style={style}
      onClick={() => data.setSelectedId?.(item.id, item)}
      data-id={item.id}
    >
      <ListItem
        data-selected={data.selectedId === item.id}
        data-highlighted={data.highlightIds?.includes(item.id)}
      >
        {data.renderItem
          ? data.renderItem({
              item,
              selected: data.selectedId === item.id,
              index,
            })
          : item.name}
      </ListItem>
    </div>
  );
};

export const FlatList = <T extends FlatListItem>({
  items,
  selectedId,
  highlightIds,
  setSelectedId,
  height,
  onKeyDown,
  children,
}: FlatListProps<T>) => {
  const typedSetSelectedId = setSelectedId as <T extends FlatListItem>(
    id: string,
    item: T
  ) => void | undefined;
  const typedItems = items as T[];

  const ref = useRef<HTMLDivElement>(null);
  const [hasFocus, setHasFocus] = useState(false);
  const list = useRef<List>(null);

  const selectedIndex = items.findIndex((item) => item.id === selectedId);

  const handleKeys = (e: KeyboardEvent) => {
    if (!hasFocus || getEventNodeName(e) === "INPUT") {
      return;
    }
    if (e.metaKey || e.ctrlKey) {
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      throttledNext.current(items, selectedId || "");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      throttledPrev.current(items, selectedId || "");
    } else if (e.key === "Home") {
      const nextItem = items[0];
      setSelectedId?.(nextItem.id, nextItem);
      setFocus(nextItem.id);
    } else if (e.key === "End") {
      const nextItem = items[items.length - 1];
      setSelectedId?.(nextItem.id, nextItem);
      setFocus(nextItem.id);
    } else {
      handleSearch(e.key);
    }
    onKeyDown?.(e, items[selectedIndex]);
  };

  const throttledNext = useRef(
    throttle((items: T[], selectedId: string) => {
      const currentIndex = items.findIndex((item) => item.id === selectedId);
      const nextIndex = currentIndex + 1;
      const nextItem = items[nextIndex];
      if (nextItem) {
        setSelectedId?.(nextItem.id, nextItem);
        setFocus(nextItem.id);
      }
    }, 150)
  );

  const throttledPrev = useRef(
    throttle((items: T[], selectedId: string) => {
      const currentIndex = items.findIndex((item) => item.id === selectedId);
      const nextIndex = currentIndex - 1;
      const nextItem = items[nextIndex];
      if (nextItem) {
        setSelectedId?.(nextItem.id, nextItem);
        setFocus(nextItem.id);
      }
    }, 150)
  );

  const handleSearch = (key: string) => {
    const search = key.toLowerCase();
    const index = selectedIndex + 1;
    let next = items.slice(index).find((node) => {
      const name = String(node.name).toLowerCase();
      return name.startsWith(search);
    });
    if (!next) {
      next = items.slice(0, index).find((node) => {
        const name = String(node.name).toLowerCase();
        return name.startsWith(search);
      });
    }
    if (next) {
      setSelectedId?.(next.id, next);
      setFocus(next.id);
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (ref.current && hasFocus && !ref.current.contains(e.target as Node)) {
      setHasFocus(false);
    }
  };

  const setFocus = (id: string) => {
    if (ref.current) {
      const el = ref.current.querySelector('[data-id="' + id + '"]');
      if (el) {
        (el as HTMLDivElement).focus();
      }
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeys);
    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeys);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  });

  useEffect(() => {
    /**
     * enables scrolling on key down arrow
     */
    if (selectedIndex >= 0 && list.current !== null) {
      list.current.scrollToItem(selectedIndex);
    }
  }, [selectedIndex, items, list]);

  if (height <= 0) {
    return <Wrapper ref={ref} style={{ height }}></Wrapper>;
  }

  return (
    <Wrapper
      ref={ref}
      role="listbox"
      onFocus={() => setHasFocus(true)}
      onBlur={() => setHasFocus(false)}
      tabIndex={0}
      style={{ height }}
    >
      <List
        ref={list}
        width="100%"
        height={Math.max(0, height)}
        itemCount={items.length}
        itemSize={25}
        itemData={{
          items: typedItems,
          selectedId: selectedId ?? "",
          highlightIds,
          setSelectedId: typedSetSelectedId,
          renderItem: ((props: { selected: boolean; item: T; index: number }) =>
            children(props)) as (props: {
            selected: boolean;
            item: FlatListItem;
            index: number;
          }) => ReactNode,
        }}
      >
        {Row}
      </List>
    </Wrapper>
  );
};
