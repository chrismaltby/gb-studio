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
import { CaretDownIcon } from "ui/icons/Icons";
import { Menu, MenuItem, MenuItemProps } from "ui/menu/Menu";
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
    const buttonRef = useRef<HTMLButtonElement>(null);
    // const menuItemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
    // const subMenuItemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
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

    // Close menu if window loses focus
    useEffect(() => {
      if (!windowFocus && isOpen) {
        setIsOpen(false);
        setParentMenuIndex(-1);
      }
    }, [isOpen, windowFocus]);

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
          setIsOpen(false);
          setParentMenuIndex(-1);
        }, 10);
      };

      // Add listener
      document.addEventListener("click", handleEveryClick);

      // Return function to remove listener
      return () => document.removeEventListener("click", handleEveryClick);
    }, [isOpen]);

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

    const closeTimer = useRef<number>();
    useEffect(() => {
      const currentTimer = closeTimer.current;
      return () => {
        if (currentTimer) {
          clearTimeout(currentTimer);
        }
      };
    }, []);

    const onMenuItemHover = useCallback(
      (itemIndex: number) => {
        console.log("onMenuItemHover 1");
        const currentTimer = closeTimer.current;
        if (currentTimer) {
          console.log("onMenuItemHover 2");
          clearTimeout(currentTimer);
        }

        console.log("onMenuItemHover 3", { itemIndex, parentMenuIndex });
        if (itemIndex !== parentMenuIndex) {
          console.log("WAS", { itemIndex, parentMenuIndex });
          closeTimer.current = setTimeout(() => {
            setParentMenuIndex(itemIndex);
          }, 300);
        }
      },
      [parentMenuIndex]
    );

    const moveFocus = useCallback((itemIndex: number, subItemIndex: number) => {
      console.warn(
        "MY MOVE FOCUS",
        itemIndex,
        subItemIndex,
        subMenuRef.current
      );
      currentMenuIndex.current = itemIndex;
      currentSubMenuIndex.current = subItemIndex;

      // const currentTimer = closeTimer.current;
      // if (currentTimer) {
      //   clearTimeout(currentTimer);
      // }

      // if (itemIndex !== parentMenuIndex) {
      //   console.log("WAS", { itemIndex, parentMenuIndex });
      //   closeTimer.current = setTimeout(() => {
      //     setParentMenuIndex(itemIndex);
      //   }, 300);
      // }

      // setTimeout(() => {
      if (menuRef.current && itemIndex > -1) {
        const el = menuRef.current.querySelector(
          `[data-index="${itemIndex}"]`
        ) as HTMLDivElement;
        console.log("menuRef.current", menuRef.current, "EL", el);
        if (el) {
          console.log("FOCUS EL!!", el);

          el.focus();
        }
      }
      // setTimeout(() => {
      if (subMenuRef.current && subItemIndex > -1) {
        const el = subMenuRef.current.querySelector(
          `[data-index="${subItemIndex}"]`
        ) as HTMLDivElement;
        console.log("SUB menuRef.current", menuRef.current, "EL", el);
        if (el) {
          console.log("SUB FOCUS EL!!", el);
          el.focus();
        }
      }
      // }, 100);

      // }, 1000);
    }, []);

    // const {
    //   buttonProps,
    //   itemProps,
    //   subItemProps,
    //   isOpen,
    //   setIsOpen,
    //   isSubMenuOpen,
    //   setIsSubMenuOpen,
    //   moveFocus,
    // } = useDropdownMenu(
    //   menuItemChildren.length,
    //   subMenuItemChildren?.length ?? 0
    // );

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
            // setIsSubMenuOpen(false);
            setParentMenuIndex(-1);
            // moveFocus(currentMenuIndex.current ?? 0, -1);
          } else {
            setIsOpen(false);
            buttonRef.current?.focus();
          }
          return;
        } else if (key === "Tab") {
          setIsOpen(false);
          return;
        } else if (key === "Enter") {
          e.currentTarget.click();
          // setIsOpen(false);
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
        menuItemChildren.length,
        moveFocus,
        parentMenuIndex,
        subMenuItemChildren.length,
      ]
    );

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
        // ...subItemProps[itemIndex],
        // ...{
        //   ref: (a: unknown) => {
        //     console.log("SUB HERE???", itemIndex, a);
        //     subMenuItemRefs.current[itemIndex] = a as HTMLAnchorElement;
        //   },
        // },
        "data-index": itemIndex,
        tabIndex: -1,
        role: "menuitem",
        onKeyDown: onMenuKeyDown,
        onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
          setIsOpen(false);
          child.props.onClick?.(e);
        },
        onMouseEnter: () => {
          console.log("MOVE CHILD FOCUS", itemIndex);
          moveFocus(parentMenuIndex, itemIndex);
        },
      });
    });

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
            // ...itemProps[itemIndex],
            // ...{
            //   ref: (a: unknown) => {
            //     console.log("HERE???", itemIndex, a);
            //     menuItemRefs.current[itemIndex] = a as HTMLAnchorElement;
            //   },
            // },
            "data-index": itemIndex,
            tabIndex: -1,
            role: "menuitem",
            onKeyDown: onMenuKeyDown,
            onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
              if (child.props.subMenu) {
                // if (parentMenuIndex === itemIndex) {
                //   // setIsSubMenuOpen(false);
                //   setParentMenuIndex(-1);
                // } else {
                setParentMenuIndex(itemIndex);
                // setIsSubMenuOpen(true);
                // }
              } else {
                console.log("AAA");
                setIsOpen(false);
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

    // console.log("childrenWithProps", childrenWithProps);

    // console.log(
    //   "subMenuRefs.currentsubMenuRefs.currentsubMenuRefs.current",
    //   menuItemRefs.current
    // );

    const onButtonKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLButtonElement>) => {
        console.log("IS KEYBOARD EVENT!!!!");

        if (onKeyDown?.(e)) {
          setIsOpen(false);
        } else {
          const { key } = e;
          console.warn("IS KEYBOARD EVENT", key);
          if (!["Enter", " ", "Tab", "ArrowDown", "Escape"].includes(key)) {
            return;
          }

          if (
            (key === "Tab" || key === "ArrowDown") &&
            clickedOpen.current &&
            isOpen
          ) {
            console.log("TRIED TO PREVENT DEFAUT");
            e.preventDefault();
            moveFocus(0, -1);
          } else if (key === "Escape") {
            setIsOpen(false);
            // setIsSubMenuOpen(false);
            setParentMenuIndex(-1);
          } else if (key !== "Tab") {
            e.preventDefault();
            console.log("TRIED TO PREVENT DEFAUT2");

            setIsOpen(true);
            // setIsSubMenuOpen(false);
            setParentMenuIndex(-1);
          }
        }
      },
      [isOpen, moveFocus, onKeyDown, setIsOpen, setParentMenuIndex]
    );

    const onButtonClick = useCallback(
      (_e: React.MouseEvent) => {
        clickedOpen.current = !isOpen;
        setIsOpen(!isOpen);
        // setIsSubMenuOpen(false);
        setParentMenuIndex(-1);
      },
      [isOpen, setIsOpen]
    );

    useLayoutEffect(() => {
      // const rect = menuRef.current?.getBoundingClientRect();
      const contentsWidth = menuRef.current?.offsetWidth || 0;
      setMenuWidth(contentsWidth);
    }, [isOpen]);

    // Focus the first item when the menu opens
    const firstRun = useRef(true);
    useEffect(() => {
      // Stop if this is the first fire of the Hook, and update the ref
      if (firstRun.current) {
        firstRun.current = false;
        return;
      }

      // If the menu is currently open focus on the first item in the menu
      if (isOpen && !clickedOpen.current) {
        moveFocus(0, -1);
      } else if (!isOpen) {
        clickedOpen.current = false;
      }
    }, [isOpen, moveFocus]);

    const isFirstSubMenuChange = useRef(true);
    useEffect(() => {
      if (isFirstSubMenuChange.current) {
        isFirstSubMenuChange.current = false;
        return;
      }
      if (parentMenuIndex > -1) {
        console.log("NOW OPEN!!", currentMenuIndex.current);
        moveFocus(currentMenuIndex.current, 0);
      } else {
        console.log("NOW CLOSED!!", currentMenuIndex.current);
        moveFocus(currentMenuIndex.current, -1);
        setParentMenuIndex(-1);
      }
    }, [parentMenuIndex, moveFocus]);

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
          {menuWidth}

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
                {/* {isSubMenuOpen && (
                  <SubMenuWrapper menuDirection={menuDirection}>
                    <RelativePortal
                      pin={menuDirection === "left" ? "top-left" : "top-right"}
                      offsetX={offsetX}
                      offsetY={offsetY}
                    >
                      <Menu role="menu" ref={subMenuRef}>
                        {subMenuChildrenWithProps}
                      </Menu>
                    </RelativePortal>
                  </SubMenuWrapper>
                )} */}
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
