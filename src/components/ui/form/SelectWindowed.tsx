import React, {
  Children,
  cloneElement,
  CSSProperties,
  isValidElement,
  memo,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactSelect, {
  GroupBase,
  InputActionMeta,
  MenuListProps,
  Props as ReactSelectProps,
  SelectComponentsConfig,
  SelectInstance,
} from "react-select";
import { List, RowComponentProps, useListCallbackRef } from "react-window";
import styled from "styled-components";

interface MenuChildProps {
  children?: ReactNode;
  data?: {
    label?: string;
    options?: unknown[];
  };
  isDisabled?: boolean;
  isFocused?: boolean;
  isSelected?: boolean;
  type?: "group" | "option";
}

interface InternalSelectProps {
  windowedShouldScrollToFocusedOption?: React.MutableRefObject<boolean>;
  windowedRenderToken?: object;
}

type MenuChild = ReactElement<MenuChildProps>;

interface MenuRowProps {
  readonly heights: number[];
  readonly items: MenuChild[];
}

const MenuRowComponent = ({
  index,
  style,
  items,
}: RowComponentProps<MenuRowProps>) => <div style={style}>{items[index]}</div>;

const MenuRow = memo(
  MenuRowComponent,
  (previous, next) =>
    previous.index === next.index &&
    previous.items[previous.index] === next.items[next.index],
) as typeof MenuRowComponent;

const getRowHeight = (index: number, props: MenuRowProps) =>
  props.heights[index] ?? 35;

const flattenMenuChildren = (children: ReactNode): MenuChild[] =>
  Children.toArray(children)
    .filter(isValidElement)
    .flatMap((child) => {
      const item = child as MenuChild;

      if (!Array.isArray(item.props.data?.options)) {
        return [item];
      }

      const options = Children.toArray(item.props.children).filter(
        isValidElement,
      ) as MenuChild[];

      if (item.props.data?.label === "") {
        return options;
      }

      return [cloneElement(item, { type: "group" }, []), ...options];
    });

const canReuseMenuChild = (previous: MenuChild, next: MenuChild) =>
  previous.key === next.key &&
  previous.type === next.type &&
  previous.props.data === next.props.data &&
  previous.props.type === next.props.type &&
  previous.props.isDisabled === next.props.isDisabled &&
  previous.props.isFocused === next.props.isFocused &&
  previous.props.isSelected === next.props.isSelected;

const numericHeight = (height: unknown, fallback: number) =>
  typeof height === "number" ? height : fallback;

const FORMATTED_OPTION_WIDTH_ALLOWANCE = 52;

const MenuWidthSizer = styled.div<{ $formatted: boolean }>`
  box-sizing: border-box;
  width: max-content;
  height: 0;
  padding: 0
    ${(props) =>
      10 + (props.$formatted ? FORMATTED_OPTION_WIDTH_ALLOWANCE : 0)}px
    0 10px;
  visibility: hidden;
  pointer-events: none;
  white-space: nowrap;
`;

const setRef = (
  ref: React.Ref<HTMLDivElement>,
  value: HTMLDivElement | null,
) => {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
};

const SelectWindowedMenuList = <
  Option,
  IsMulti extends boolean,
  Group extends GroupBase<Option>,
>(
  props: MenuListProps<Option, IsMulti, Group>,
) => {
  const { children, getStyles, innerProps, innerRef, selectProps } = props;

  const previousRender = useRef<{
    items: MenuChild[];
    renderToken?: object;
  }>(undefined);

  const renderToken = (selectProps as InternalSelectProps).windowedRenderToken;
  const shouldScrollToFocusedOption = (selectProps as InternalSelectProps)
    .windowedShouldScrollToFocusedOption;
  const nextItems = flattenMenuChildren(children);
  const isInternalSelectUpdate =
    previousRender.current?.renderToken === renderToken;

  const items = nextItems.map((item, index) => {
    const previousItem = previousRender.current?.items[index];
    if (
      isInternalSelectUpdate &&
      previousItem &&
      canReuseMenuChild(previousItem, item)
    ) {
      return previousItem;
    }
    return item;
  });

  useLayoutEffect(() => {
    previousRender.current = { items, renderToken };
  }, [items, renderToken]);

  const optionHeight = numericHeight(
    getStyles("option", props as never).height,
    35,
  );

  const groupHeight = numericHeight(
    getStyles("groupHeading", props as never).height,
    25,
  );

  const heights = items.map((item) => {
    if (item.props.type === "group") {
      return groupHeight;
    }
    if (item.props.type === "option") {
      return optionHeight;
    }
    return 35;
  });

  const totalHeight = heights.reduce((total, height) => total + height, 0);
  const menuListStyles = getStyles("menuList", props);
  const maxHeight = numericHeight(menuListStyles.maxHeight, props.maxHeight);
  const height = Math.min(maxHeight, totalHeight);
  const currentIndex = Math.max(
    items.findIndex((item) => item.props.isFocused),
    0,
  );
  const longestLabel = items.reduce((longest, item) => {
    const label = item.props.data?.label ?? "";
    return label.length > longest.length ? label : longest;
  }, "");
  const hasFormattedLabels = items.some(
    (item) =>
      item.props.type === "option" &&
      typeof item.props.children !== "string" &&
      typeof item.props.children !== "number",
  );

  const hasScrolledToInitialItem = useRef(false);
  const [listApi, setListApi] = useListCallbackRef(null);

  useEffect(() => {
    setRef(innerRef, listApi?.element ?? null);
    return () => setRef(innerRef, null);
  }, [innerRef, listApi]);

  useEffect(() => {
    if (!listApi || items.length === 0) {
      return;
    }

    const isInitialScroll = !hasScrolledToInitialItem.current;
    if (!isInitialScroll && shouldScrollToFocusedOption?.current === false) {
      return;
    }

    const animationFrame = requestAnimationFrame(() => {
      listApi.scrollToRow({
        align: isInitialScroll ? "center" : "auto",
        index: currentIndex,
      });
      hasScrolledToInitialItem.current = true;
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [currentIndex, items.length, listApi, shouldScrollToFocusedOption]);

  const handleMouseMoveCapture = useCallback<
    React.MouseEventHandler<HTMLDivElement>
  >(
    (event) => {
      if (shouldScrollToFocusedOption) {
        shouldScrollToFocusedOption.current = false;
      }
      innerProps.onMouseMoveCapture?.(event);
    },
    [innerProps, shouldScrollToFocusedOption],
  );

  const { maxHeight: _maxHeight, ...style } = menuListStyles;
  const classNamePrefix = selectProps.classNamePrefix;

  return (
    <>
      {longestLabel && (
        <MenuWidthSizer aria-hidden inert $formatted={hasFormattedLabels}>
          {longestLabel}
        </MenuWidthSizer>
      )}
      <List
        {...innerProps}
        onMouseMoveCapture={handleMouseMoveCapture}
        className={
          classNamePrefix
            ? `${classNamePrefix}__menu-list${
                selectProps.isMulti
                  ? ` ${classNamePrefix}__menu-list--is-multi`
                  : ""
              }`
            : undefined
        }
        defaultHeight={height}
        listRef={setListApi}
        rowComponent={MenuRow}
        rowCount={items.length}
        rowHeight={getRowHeight}
        rowProps={{ heights, items }}
        style={{
          ...(style as CSSProperties),
          height,
          width: "100%",
        }}
      />
    </>
  );
};

const countOptions = <Option, Group extends GroupBase<Option>>(
  options: readonly (Option | Group)[],
) =>
  options.reduce((total, option) => {
    const groupOptions = (option as Group).options;
    return total + (Array.isArray(groupOptions) ? groupOptions.length : 1);
  }, 0);

export interface SelectWindowedProps<
  Option = unknown,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
> extends ReactSelectProps<Option, IsMulti, Group> {
  windowThreshold?: number;
}

export const SelectWindowed = React.forwardRef(
  <
    Option,
    IsMulti extends boolean,
    Group extends GroupBase<Option> = GroupBase<Option>,
  >(
    {
      components,
      onKeyDown,
      onInputChange,
      options = [],
      windowThreshold = 100,
      ...props
    }: SelectWindowedProps<Option, IsMulti, Group>,
    ref: React.ForwardedRef<SelectInstance<Option, IsMulti, Group>>,
  ) => {
    // Make uncontrolled search changes visible to the menu-list memoization.
    const [, setInputRevision] = useState(0);
    const shouldScrollToFocusedOption = useRef(true);
    const handleInputChange = useCallback(
      (value: string, action: InputActionMeta) => {
        if (action.action === "input-change") {
          shouldScrollToFocusedOption.current = true;
        }
        setInputRevision((revision) => revision + 1);
        return onInputChange?.(value, action);
      },
      [onInputChange],
    );
    const handleKeyDown = useCallback<
      React.KeyboardEventHandler<HTMLDivElement>
    >(
      (event) => {
        shouldScrollToFocusedOption.current = true;
        onKeyDown?.(event);
      },
      [onKeyDown],
    );
    const isWindowed = countOptions(options) >= windowThreshold;
    const windowedRenderToken = {};
    const selectComponents = useMemo<
      SelectComponentsConfig<Option, IsMulti, Group>
    >(
      () => ({
        ...components,
        ...(isWindowed && { MenuList: SelectWindowedMenuList }),
      }),
      [components, isWindowed],
    );

    const reactSelectProps = {
      ...props,
      windowedShouldScrollToFocusedOption: shouldScrollToFocusedOption,
      windowedRenderToken,
    } as ReactSelectProps<Option, IsMulti, Group> & InternalSelectProps;

    return (
      <ReactSelect
        {...reactSelectProps}
        ref={ref}
        components={selectComponents}
        onKeyDown={handleKeyDown}
        onInputChange={handleInputChange}
        options={options}
      />
    );
  },
) as <
  Option = unknown,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(
  props: SelectWindowedProps<Option, IsMulti, Group> & {
    ref?: React.ForwardedRef<SelectInstance<Option, IsMulti, Group>>;
  },
) => ReactElement;
