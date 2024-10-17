import React from "react";
import {
  useRef,
  useState,
  Children,
  isValidElement,
  ReactElement,
  useCallback,
  useEffect,
  cloneElement,
  useMemo,
  useLayoutEffect,
} from "react";
import { StyledDropdownSubMenu } from "ui/buttons/style";
import { RelativePortal } from "ui/layout/RelativePortal";
import { Menu, MenuItem, MenuItemProps } from "ui/menu/Menu";

const emptyArr: React.ReactNode[] = [];

const useNestedMenu = (
  children: React.ReactNode,
  initiallyOpen: boolean,
  menuDirection: "left" | "right",
  onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => boolean
) => {
  const isInitialMount = useRef(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const subMenuRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [menuWidth, setMenuWidth] = useState(0);
  const [parentMenuIndex, setParentMenuIndex] = useState(-1);

  const currentMenuIndex = useRef<number>(initiallyOpen ? 0 : -1);
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
    const onWindowBlur = () => {
      if (isOpen) {
        closeMenu();
      }
    };
    window.addEventListener("blur", onWindowBlur);
    return () => {
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [closeMenu, isOpen]);

  // Handle listening for clicks and auto-hiding the menu
  useEffect(() => {
    const handleEveryClick = (event: MouseEvent) => {
      if (isInitialMount.current) {
        return;
      }

      // Ignore if the menu isn't open
      if (!isOpen) {
        return;
      }

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
    };

    // Add listener
    document.addEventListener("click", handleEveryClick);
    document.addEventListener("contextmenu", handleEveryClick);

    // Return function to remove listener
    return () => {
      document.removeEventListener("click", handleEveryClick);
      document.removeEventListener("contextmenu", handleEveryClick);
    };
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
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
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
        closeMenu();
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
    const itemIndex = subMenuItemChildren.indexOf(child);
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
          !isValidElement<MenuItemProps & React.HTMLAttributes<HTMLDivElement>>(
            child
          ) ||
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
              {itemIndex === parentMenuIndex && child.props.subMenu && (
                <StyledDropdownSubMenu $menuDirection={menuDirection}>
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
                </StyledDropdownSubMenu>
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
    if (isOpen) {
      moveFocus(0, -1);
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
  // Delay setting isInitialMount to false by one frame
  // to prevent issues where contextmenu event handler will fire
  // during the mount (especially in React.StrictMode)
  const mountDelayRequest = React.useRef<number>();

  useEffect(() => {
    isInitialMount.current = true;
    mountDelayRequest.current = requestAnimationFrame(() => {
      isInitialMount.current = false;
    });
    return () => {
      if (mountDelayRequest.current !== undefined) {
        cancelAnimationFrame(mountDelayRequest.current);
      }
    };
  }, []);

  return {
    menuRef,
    closeMenu,
    isOpen,
    childrenWithProps,
  };
};

export default useNestedMenu;
