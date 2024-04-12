import React, {
  Children,
  cloneElement,
  CSSProperties,
  FC,
  isValidElement,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styled, { css } from "styled-components";
import { RelativePortal } from "ui/layout/RelativePortal";
import { CaretDownIcon, CaretRightIcon } from "ui/icons/Icons";
import { Menu, MenuItem, MenuItemCaret, MenuItemProps } from "ui/menu/Menu";
import { Button, ButtonProps } from "./Button";
import useWindowFocus from "ui/hooks/use-window-focus";

export interface DropdownButtonProps {
  readonly label?: ReactNode;
  readonly title?: string;
  readonly children?: ReactNode;
  readonly showArrow?: boolean;
  readonly menuDirection?: "left" | "right";
  readonly offsetX?: number;
  readonly offsetY?: number;
  readonly style?: CSSProperties;
  readonly onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => boolean;
  readonly onMouseDown?: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => void;
}

interface MenuWrapperProps {
  readonly menuDirection?: "left" | "right";
}

export const MenuWrapper = styled.div<MenuWrapperProps>`
  position: absolute;
  margin-top: 2px;
  z-index: 10001;
  left: 0;

  ${(props) =>
    props.menuDirection === "right"
      ? css`
          left: auto;
          right: 0;
        `
      : ""}
`;

export const SubMenuWrapper = styled.div<MenuWrapperProps>`
  position: absolute;
  margin-top: 2px;
  z-index: 10001;
  background: blue;
  height: 10px;
  right: 0;

  ${(props) =>
    props.menuDirection === "right"
      ? css`
          left: auto;
          right: 0;
        `
      : ""}
`;

export const DropdownButtonWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
  [aria-expanded="false"] + ${MenuWrapper} {
    display: none;
  }
`;

export const ArrowWrapper = styled.div`
  margin-right: -5px;
  margin-top: -1px;
  min-width: 8px;
  &:not(:first-child) {
    padding-left: 5px;
  }
  &&&& > svg {
    height: 8px;
  }
`;

const emptyArr: React.ReactNode[] = [];

export const DropdownButton: FC<DropdownButtonProps & ButtonProps> = React.memo(
  ({
    id,
    size,
    variant,
    label,
    title,
    children,
    showArrow,
    menuDirection,
    offsetX,
    offsetY,
    active,
    style,
    onKeyDown,
    onMouseDown,
  }) => {
    const isInitialMount = useRef(true);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const subMenuRef = useRef<HTMLDivElement>(null);
    const clickedOpen = useRef(false);
    const windowFocus = useWindowFocus();

    const [isOpen, setIsOpen] = useState(false);
    const [menuWidth, setMenuWidth] = useState(0);
    const [parentMenuIndex, setParentMenuIndex] = useState(-1);

    const currentMenuIndex = useRef<number>(-1);
    const currentSubMenuIndex = useRef<number>(-1);

    const childArray = Children.toArray(children);
    const menuItemChildren = childArray.filter((child) => {
      return isValidElement<MenuItemProps>(child) && child.type === MenuItem;
    }) as ReactElement[];

    const parentMenu = menuItemChildren[
      parentMenuIndex
    ] as ReactElement<MenuItemProps>;
    const subMenuChildArray = parentMenu?.props.subMenu ?? emptyArr;

    const subMenuItemChildren = subMenuChildArray.filter(
      (child: React.ReactNode) => {
        return isValidElement<MenuItemProps>(child) && child.type === MenuItem;
      }
    ) as ReactElement[];

    const closeMenu = useCallback(() => {
      setIsOpen(false);
      setParentMenuIndex(-1);
    }, []);

    // Close menu if window loses focus
    useEffect(() => {
      if (!windowFocus && isOpen) {
        closeMenu();
      }
    }, [closeMenu, isOpen, windowFocus]);

    // Handle listening for clicks and auto-hiding the menu
    useEffect(() => {
      // This function is designed to handle every click
      const handleEveryClick = (event: MouseEvent) => {
        // Ignore if the menu isn't open
        if (!isOpen) {
          return;
        }

        // Make this happen asynchronously
        setTimeout(() => {
          // Type guard
          if (!(event.target instanceof Element)) {
            return;
          }

          // Ignore if we're clicking inside the menu
          if (event.target.closest('[role="menu"]') instanceof Element) {
            return;
          }

          // Hide dropdown
          closeMenu();
        }, 10);
      };

      // Add listener
      document.addEventListener("click", handleEveryClick);

      // Return function to remove listener
      return () => document.removeEventListener("click", handleEveryClick);
    }, [closeMenu, isOpen]);

    // Disable scroll when the menu is opened, and revert back when the menu is closed
    useEffect(() => {
      const disableArrowScroll = (event: KeyboardEvent) => {
        if (isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
          event.preventDefault();
        }
      };

      document.addEventListener("keydown", disableArrowScroll);

      return () => document.removeEventListener("keydown", disableArrowScroll);
    }, [isOpen]);

    // Clear submenu timer on unmount
    const closeTimer = useRef<number>();
    useEffect(() => {
      return () => {
        if (closeTimer.current) {
          clearTimeout(closeTimer.current);
        }
      };
    }, []);

    // Handle hover over menu items to display sub menu after a short delay
    // and close submenu if hovered over a new parent item for a period of time
    const onMenuItemHover = useCallback(
      (itemIndex: number) => {
        // Clear current timer
        const currentTimer = closeTimer.current;
        if (currentTimer) {
          clearTimeout(currentTimer);
        }

        // If this is not the currently focused parent item
        // start a timer to open its submenu
        if (itemIndex !== parentMenuIndex) {
          closeTimer.current = setTimeout(() => {
            setParentMenuIndex(itemIndex);
          }, 300);
        }
      },
      [parentMenuIndex]
    );

    const moveFocus = useCallback((itemIndex: number, subItemIndex: number) => {
      currentMenuIndex.current = itemIndex;
      currentSubMenuIndex.current = subItemIndex;
      // Find parent menu item to focus
      if (menuRef.current && itemIndex > -1) {
        const el = menuRef.current.querySelector(
          `[data-index="${itemIndex}"]`
        ) as HTMLDivElement;
        if (el) {
          el.focus();
        }
      }
      // Find sub menu item to focus
      if (subMenuRef.current && subItemIndex > -1) {
        const el = subMenuRef.current.querySelector(
          `[data-index="${subItemIndex}"]`
        ) as HTMLDivElement;
        if (el) {
          el.focus();
        }
      }
    }, []);

    const onMenuKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLElement>) => {
        const { key } = e;

        if (onKeyDown?.(e)) {
          return;
        }

        // Ignore keys that we shouldn't handle
        if (
          !["Tab", "Shift", "Enter", "Escape", "ArrowUp", "ArrowDown"].includes(
            key
          )
        ) {
          return;
        }

        e.stopPropagation();

        if (key === "Escape") {
          if (parentMenuIndex > -1) {
            setParentMenuIndex(-1);
          } else {
            closeMenu();
            buttonRef.current?.focus();
          }
          return;
        } else if (key === "Tab") {
          closeMenu();
          return;
        } else if (key === "Enter") {
          e.currentTarget.click();
          return;
        }

        if (currentSubMenuIndex.current === -1) {
          // Create mutable value that initializes as the currentMenuIndex value
          let newFocusIndex = currentMenuIndex.current;

          // Controls the current index to focus
          if (newFocusIndex !== null) {
            if (key === "ArrowUp") {
              newFocusIndex -= 1;
            } else if (key === "ArrowDown") {
              newFocusIndex += 1;
            }

            if (newFocusIndex > menuItemChildren.length - 1) {
              newFocusIndex = 0;
            } else if (newFocusIndex < 0) {
              newFocusIndex = menuItemChildren.length - 1;
            }
          }

          // After any modification set state to the modified value
          if (newFocusIndex !== null) {
            moveFocus(newFocusIndex, -1);
          }
        } else {
          // Create mutable value that initializes as the currentSubMenuIndex value
          let newSubFocusIndex = currentSubMenuIndex.current;

          // Controls the current index to focus
          if (newSubFocusIndex !== null) {
            if (key === "ArrowUp") {
              newSubFocusIndex -= 1;
            } else if (key === "ArrowDown") {
              newSubFocusIndex += 1;
            }

            if (newSubFocusIndex > subMenuItemChildren.length - 1) {
              newSubFocusIndex = 0;
            } else if (newSubFocusIndex < 0) {
              newSubFocusIndex = subMenuItemChildren.length - 1;
            }
          }

          // After any modification set state to the modified value
          if (newSubFocusIndex !== null) {
            moveFocus(currentMenuIndex.current ?? 0, newSubFocusIndex);
          }
        }
      },
      [
        closeMenu,
        menuItemChildren.length,
        moveFocus,
        onKeyDown,
        parentMenuIndex,
        subMenuItemChildren.length,
      ]
    );

    // Inject sub menu props into sub menu components
    const subMenuChildrenWithProps = subMenuChildArray.map((child) => {
      if (
        !isValidElement<MenuItemProps & React.HTMLAttributes<HTMLDivElement>>(
          child
        ) ||
        child.type !== MenuItem
      ) {
        return child;
      }
      const itemIndex = subMenuChildArray.indexOf(child);
      return cloneElement(child, {
        "data-index": itemIndex,
        tabIndex: -1,
        role: "menuitem",
        onKeyDown: onMenuKeyDown,
        onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
          closeMenu();
          child.props.onClick?.(e);
        },
        onMouseEnter: () => {
          moveFocus(parentMenuIndex, itemIndex);
        },
      });
    });

    // Inject menu props into menu components
    const childrenWithProps = useMemo(
      () =>
        childArray.map((child) => {
          if (
            !isValidElement<
              MenuItemProps & React.HTMLAttributes<HTMLDivElement>
            >(child) ||
            child.type !== MenuItem
          ) {
            return child;
          }
          const itemIndex = menuItemChildren.indexOf(child);
          return cloneElement(child, {
            "data-index": itemIndex,
            tabIndex: -1,
            role: "menuitem",
            onKeyDown: onMenuKeyDown,
            onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
              if (child.props.subMenu) {
                // If menu includes a sub menu open it
                // keeping full menu open
                setParentMenuIndex(itemIndex);
              } else {
                closeMenu();
              }
              child.props.onClick?.(e);
            },
            onMouseEnter: () => {
              moveFocus(itemIndex, -1);
              onMenuItemHover(itemIndex);
            },
            children: (
              <>
                {child.props.children}
                {child.props.subMenu && (
                  <MenuItemCaret>
                    <CaretRightIcon />
                  </MenuItemCaret>
                )}
                {itemIndex === parentMenuIndex && child.props.subMenu && (
                  <SubMenuWrapper menuDirection={menuDirection}>
                    <RelativePortal
                      pin={"parent-edge"}
                      parentWidth={menuWidth - 15}
                      offsetX={0}
                      offsetY={-12}
                    >
                      <Menu role="menu" ref={subMenuRef}>
                        {subMenuChildrenWithProps}
                      </Menu>
                    </RelativePortal>
                  </SubMenuWrapper>
                )}
              </>
            ),
          });
        }),
      [
        childArray,
        closeMenu,
        menuDirection,
        menuItemChildren,
        menuWidth,
        moveFocus,
        onMenuItemHover,
        onMenuKeyDown,
        parentMenuIndex,
        subMenuChildrenWithProps,
      ]
    );

    // Handle keyboard events when button has focus
    const onButtonKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLButtonElement>) => {
        // If keydown handler has been provided and it returns true
        // override default keyboard handling and close any open menus
        if (onKeyDown?.(e)) {
          closeMenu();
        } else {
          const { key } = e;

          // Ignore any keys not handled by button
          if (!["Enter", " ", "Tab", "ArrowDown", "Escape"].includes(key)) {
            return;
          }

          if (
            (key === "Tab" || key === "ArrowDown") &&
            clickedOpen.current &&
            isOpen
          ) {
            // Handle the case when the button was clicked to open menu
            // Tab or ArrowDown should focus on first item
            e.preventDefault();
            moveFocus(0, -1);
          } else if (key === "Escape") {
            // Pressing escape on button focus will always close the menu
            closeMenu();
          } else if (key !== "Tab") {
            e.preventDefault();
            setIsOpen(true);
            setParentMenuIndex(-1);
          }
        }
      },
      [closeMenu, isOpen, moveFocus, onKeyDown]
    );

    // When clicking button toggle open state
    // and close any sub menus
    const onButtonClick = useCallback(
      (_e: React.MouseEvent) => {
        clickedOpen.current = !isOpen;
        setIsOpen(!isOpen);
        setParentMenuIndex(-1);
      },
      [isOpen, setIsOpen]
    );

    // Store menu width for using to offset sub menu to
    // left or right depending on space available
    useLayoutEffect(() => {
      const contentsWidth = menuRef.current?.offsetWidth || 0;
      setMenuWidth(contentsWidth);
    }, [isOpen]);

    // Focus the first item when the menu opens
    useEffect(() => {
      if (isInitialMount.current) {
        return;
      }
      // If opened menu without clicking auto focus on first element
      if (isOpen && !clickedOpen.current) {
        moveFocus(0, -1);
      } else if (!isOpen) {
        clickedOpen.current = false;
      }
    }, [isOpen, moveFocus]);

    // Focus on first submenu item when submenu first opens
    useEffect(() => {
      if (isInitialMount.current) {
        return;
      }
      if (
        parentMenuIndex > -1 &&
        menuItemChildren[parentMenuIndex]?.props.subMenu
      ) {
        // If sub menu open focus on first element
        moveFocus(currentMenuIndex.current, 0);
      } else {
        // If sub menu closed focus on previous parent
        moveFocus(currentMenuIndex.current, -1);
        setParentMenuIndex(-1);
      }
    }, [parentMenuIndex, moveFocus, menuItemChildren]);

    // Track if this is the initial mount for auto focus handling
    useEffect(() => {
      isInitialMount.current = false;
    }, []);

    return (
      <DropdownButtonWrapper>
        <Button
          id={id}
          title={title}
          size={size}
          variant={variant}
          active={active}
          onKeyDown={onButtonKeyDown}
          onClick={onButtonClick}
          tabIndex={0}
          ref={buttonRef}
          role={"button"}
          aria-haspopup={true}
          aria-expanded={isOpen}
          onMouseDown={onMouseDown}
          style={{
            ...style,
            ...(showArrow && !label
              ? {
                  paddingLeft: 0,
                  paddingRight: 5,
                }
              : {}),
          }}
        >
          {label}
          {showArrow && (
            <ArrowWrapper>
              <CaretDownIcon />
            </ArrowWrapper>
          )}
        </Button>
        {isOpen && (
          <MenuWrapper menuDirection={menuDirection}>
            <RelativePortal
              pin={menuDirection === "left" ? "top-left" : "top-right"}
              offsetX={offsetX}
              offsetY={offsetY}
            >
              <Menu role="menu" ref={menuRef}>
                {childrenWithProps}
              </Menu>
            </RelativePortal>
          </MenuWrapper>
        )}
      </DropdownButtonWrapper>
    );
  }
);

DropdownButton.defaultProps = {
  showArrow: true,
  menuDirection: "left",
};
