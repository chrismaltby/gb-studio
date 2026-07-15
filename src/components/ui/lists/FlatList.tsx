import throttle from "lodash/throttle";
import React, { useEffect, useRef, useState } from "react";
import { List, RowComponentProps, useListRef } from "react-window";
import styled from "styled-components";
import { ThemeInterface } from "ui/theme/ThemeInterface";
import { ListItem } from "./ListItem";
import { getEventNodeName } from "renderer/lib/helpers/dom";

export interface FlatListItem {
  id: string;
  name: string;
}

interface RowProps {
  readonly items: FlatListItem[];
  readonly selectedId: string;
  readonly highlightIds?: string[];
  readonly setSelectedId?: (value: string, item: FlatListItem) => void;
  readonly renderItem: (props: {
    selected: boolean;
    item: FlatListItem;
    index: number;
  }) => React.ReactNode;
}

type WrapperElementProps = React.PropsWithChildren<
  React.HTMLAttributes<HTMLDivElement>
>;

interface FlatListProps<T extends FlatListItem> {
  readonly height: number;
  readonly items: T[];
  readonly selectedId?: string;
  readonly highlightIds?: string[];
  readonly setSelectedId?: (id: string, item: T) => void;
  readonly onKeyDown?: (e: KeyboardEvent, item?: T) => void;
  readonly outerElementType?: React.ComponentType<WrapperElementProps>;
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

const PassThrough = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

const Row = ({
  index,
  style,
  ariaAttributes,
  items,
  selectedId,
  setSelectedId,
  renderItem,
  highlightIds,
}: RowComponentProps<RowProps>) => {
  const item = items[index];
  if (!item) {
    return <div style={style} {...ariaAttributes} />;
  }

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("input, textarea, select, button")) {
      return;
    }
    setSelectedId?.(item.id, item);
  };

  return (
    <div {...ariaAttributes} style={style} onClick={onClick} data-id={item.id}>
      <ListItem
        data-selected={selectedId === item.id}
        data-highlighted={highlightIds?.includes(item.id)}
      >
        {renderItem({
          item,
          selected: selectedId === item.id,
          index,
        })}
      </ListItem>
    </div>
  );
};

export const FlatList = <T extends FlatListItem>({
  items,
  selectedId,
  highlightIds,
  setSelectedId,
  outerElementType,
  height,
  onKeyDown,
  children,
}: FlatListProps<T>) => {
  const typedSetSelectedId = setSelectedId as
    ((id: string, item: FlatListItem) => void) | undefined;

  const ref = useRef<HTMLDivElement>(null);
  const [hasFocus, setHasFocus] = useState(false);
  const listRef = useListRef(null);

  const WrapperElement = outerElementType ?? PassThrough;

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
      if (nextItem) {
        setSelectedId?.(nextItem.id, nextItem);
        setFocus(nextItem.id);
      }
    } else if (e.key === "End") {
      const nextItem = items[items.length - 1];
      if (nextItem) {
        setSelectedId?.(nextItem.id, nextItem);
        setFocus(nextItem.id);
      }
    } else {
      handleSearch(e.key);
    }
    onKeyDown?.(e, items[selectedIndex]);
  };

  const setSelectedIdRef = useRef(setSelectedId);
  useEffect(() => {
    setSelectedIdRef.current = setSelectedId;
  }, [setSelectedId]);

  const throttledNext = useRef(
    throttle((items: T[], currentSelectedId: string) => {
      const currentIndex = items.findIndex(
        (item) => item.id === currentSelectedId,
      );
      const nextItem = items[currentIndex + 1];
      if (nextItem) {
        setSelectedIdRef.current?.(nextItem.id, nextItem);
        setFocus(nextItem.id);
      }
    }, 150),
  );

  const throttledPrev = useRef(
    throttle((items: T[], currentSelectedId: string) => {
      const currentIndex = items.findIndex(
        (item) => item.id === currentSelectedId,
      );
      const nextItem = items[currentIndex - 1];
      if (nextItem) {
        setSelectedIdRef.current?.(nextItem.id, nextItem);
        setFocus(nextItem.id);
      }
    }, 150),
  );

  const handleSearch = (key: string) => {
    const search = key.toLowerCase();
    const index = selectedIndex + 1;

    let next = items.slice(index).find((node) => {
      return String(node.name).toLowerCase().startsWith(search);
    });

    if (!next) {
      next = items.slice(0, index).find((node) => {
        return String(node.name).toLowerCase().startsWith(search);
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
      const el = ref.current.querySelector(`[data-id="${id}"]`);
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
    if (selectedIndex >= 0 && listRef.current) {
      listRef.current.scrollToRow({ index: selectedIndex });
    }
  }, [selectedIndex, items, listRef]);

  if (height <= 0) {
    return <Wrapper ref={ref} style={{ height }} />;
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
      <WrapperElement>
        <List
          listRef={listRef}
          rowCount={items.length}
          rowHeight={25}
          rowComponent={Row}
          rowProps={{
            items: items as FlatListItem[],
            selectedId: selectedId ?? "",
            highlightIds,
            setSelectedId: typedSetSelectedId,
            renderItem: (props) =>
              children(
                props as {
                  selected: boolean;
                  item: T;
                  index: number;
                },
              ),
          }}
        />
      </WrapperElement>
    </Wrapper>
  );
};
