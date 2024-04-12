// Imports
import React, {
  useState,
  useRef,
  createRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
} from "react";
import useWindowFocus from "./use-window-focus";

// Create interface for button properties
interface ButtonProps
  extends Pick<
    React.DetailedHTMLProps<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      HTMLButtonElement
    >,
    | "onKeyDown"
    | "onClick"
    | "tabIndex"
    | "role"
    | "aria-haspopup"
    | "aria-expanded"
  > {
  ref: React.RefObject<HTMLButtonElement>;
}

// A custom Hook that abstracts away the listeners/controls for dropdown menus
export default function useDropdownMenu(itemCount: number, subItemCount = 0) {
  // Use state
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSubMenuOpen, setIsSubMenuOpen] = useState<boolean>(false);
  const currentFocusIndex = useRef<number | null>(null);
  const currentSubFocusIndex = useRef<number | null>(null);
  const firstRun = useRef(true);
  const clickedOpen = useRef(false);
  const windowFocus = useWindowFocus();

  // Create refs
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<React.RefObject<HTMLAnchorElement>[]>([]);
  const subItemRefs = useRef<React.RefObject<HTMLAnchorElement>[]>([]);

  // Initialize refs and update them when the item count changes
  useEffect(() => {
    itemRefs.current = [...Array(itemCount)].map(() =>
      createRef<HTMLAnchorElement>()
    );
  }, [itemCount]);

  useEffect(() => {
    subItemRefs.current = [...Array(subItemCount)].map(() =>
      createRef<HTMLAnchorElement>()
    );
  }, [subItemCount]);

  // Create type guard
  const isKeyboardEvent = (
    e: React.KeyboardEvent | React.MouseEvent
  ): e is React.KeyboardEvent => (e as React.KeyboardEvent).key !== undefined;

  // Handles moving the focus between menu items
  const moveFocus = useCallback((itemIndex: number, subItemIndex: number) => {
    console.log("MOVE FOCUS!!!");
    currentFocusIndex.current = itemIndex;
    currentSubFocusIndex.current = subItemIndex;
    if (subItemIndex > -1) {
      console.log(
        "SUB ITEMS",
        subItemRefs.current,
        "FOCUSON",
        subItemIndex,
        subItemRefs.current[subItemIndex].current
      );
      subItemRefs.current[subItemIndex].current?.focus();
    } else {
      console.log(
        " ITEMS",
        itemRefs.current,
        itemRefs.current[itemIndex].current
      );

      itemRefs.current[itemIndex].current?.focus();
    }
    // itemRefs.current[itemIndex].current?.focus();
  }, []);

  // Focus the first item when the menu opens
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

  // Focus the first item of submenu when the submenu opens
  useEffect(() => {
    console.log(
      "isSubMenuOpen??",
      isSubMenuOpen,
      subItemRefs.current[0]?.current
    );
    if (isSubMenuOpen && subItemRefs.current[0]?.current) {
      console.log("YES");
      setTimeout(() => {
        console.log("SETTING FOCUS");
        moveFocus(currentFocusIndex.current ?? 0, 0);
      }, 1000);
    }
  }, [isSubMenuOpen, moveFocus]);

  const currentSubItem =
    subItemRefs.current[currentSubFocusIndex.current ?? 0]?.current;
  const firstSubItem = subItemRefs.current[0]?.current;
  console.log("firstSubItemA", firstSubItem);

  useEffect(() => {
    console.log("firstSubItem", firstSubItem);
  }, [firstSubItem]);

  useEffect(() => {
    console.log("currentSubItem", currentSubItem);
  }, [currentSubItem]);

  // Close menu if window loses focus
  useEffect(() => {
    if (!windowFocus && isOpen) {
      setIsOpen(false);
      setIsSubMenuOpen(false);
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
        setIsSubMenuOpen(false);
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

  // Create a handler function for the button's clicks and keyboard events
  const buttonListener = useCallback(
    (e: React.KeyboardEvent | React.MouseEvent) => {
      // Detect if event was a keyboard event or a mouse event
      if (isKeyboardEvent(e)) {
        const { key } = e;

        console.log("IS KEYBOARD EVENT");

        if (!["Enter", " ", "Tab", "ArrowDown"].includes(key)) {
          return;
        }

        if (
          (key === "Tab" || key === "ArrowDown") &&
          clickedOpen.current &&
          isOpen
        ) {
          console.log("TRIED TO PREVENT DEFAUT");
          // e.preventDefault();
          moveFocus(0, -1);
        } else if (key !== "Tab") {
          // e.preventDefault();
          console.log("TRIED TO PREVENT DEFAUT2");

          setIsOpen(true);
          setIsSubMenuOpen(false);
        }
      } else {
        clickedOpen.current = !isOpen;
        setIsOpen(!isOpen);
        setIsSubMenuOpen(false);
      }
    },
    [isOpen, moveFocus]
  );

  // Create a function that handles menu logic based on keyboard events that occur on menu items
  const itemListener = useCallback(
    (e: React.KeyboardEvent<HTMLAnchorElement>) => {
      console.log("ITEM LISTENRR");
      // Destructure the key property from the event object
      const { key } = e;

      // Ignore keys that we shouldn't handle
      if (
        !["Tab", "Shift", "Enter", "Escape", "ArrowUp", "ArrowDown"].includes(
          key
        )
      ) {
        return;
      }

      // Controls whether the menu is open or closed, if the button should regain focus on close, and if a handler function should be called
      if (key === "Escape") {
        if (isSubMenuOpen) {
          setIsSubMenuOpen(false);
          moveFocus(currentFocusIndex.current ?? 0, -1);
        } else {
          setIsOpen(false);
          buttonRef.current?.focus();
        }
        return;
      } else if (key === "Tab") {
        setIsOpen(false);
        return;
      } else if (key === "Enter") {
        if (!e.currentTarget.href) {
          e.currentTarget.click();
        }

        // setIsOpen(false);
        return;
      }

      if (currentSubFocusIndex.current === -1) {
        // Create mutable value that initializes as the currentFocusIndex value
        let newFocusIndex = currentFocusIndex.current;

        // Controls the current index to focus
        if (newFocusIndex !== null) {
          if (key === "ArrowUp") {
            newFocusIndex -= 1;
          } else if (key === "ArrowDown") {
            newFocusIndex += 1;
          }

          if (newFocusIndex > itemRefs.current.length - 1) {
            newFocusIndex = 0;
          } else if (newFocusIndex < 0) {
            newFocusIndex = itemRefs.current.length - 1;
          }
        }

        // After any modification set state to the modified value
        if (newFocusIndex !== null) {
          moveFocus(newFocusIndex, -1);
        }
      } else {
        // Create mutable value that initializes as the currentSubFocusIndex value
        let newSubFocusIndex = currentSubFocusIndex.current;

        // Controls the current index to focus
        if (newSubFocusIndex !== null) {
          if (key === "ArrowUp") {
            newSubFocusIndex -= 1;
          } else if (key === "ArrowDown") {
            newSubFocusIndex += 1;
          }

          if (newSubFocusIndex > subItemRefs.current.length - 1) {
            newSubFocusIndex = 0;
          } else if (newSubFocusIndex < 0) {
            newSubFocusIndex = subItemRefs.current.length - 1;
          }
        }

        // After any modification set state to the modified value
        if (newSubFocusIndex !== null) {
          moveFocus(currentFocusIndex.current ?? 0, newSubFocusIndex);
        }
      }
    },
    [isSubMenuOpen, moveFocus]
  );

  // Define spreadable props for button and items
  const buttonProps: ButtonProps = useMemo(
    () => ({
      onKeyDown: buttonListener,
      onClick: buttonListener,
      tabIndex: 0,
      ref: buttonRef,
      role: "button",
      "aria-haspopup": true,
      "aria-expanded": isOpen,
    }),
    [buttonListener, isOpen]
  );

  const itemProps = useMemo(
    () =>
      [...Array(itemCount)].map((_ignore, index) => ({
        // onKeyDown: itemListener,
        tabIndex: -1,
        // role: "menuitem",
        // ref: itemRefs.current[index],
        // selected: index === currentFocusIndex.current,
      })),
    [itemCount, itemListener]
  );

  const subItemProps = useMemo(
    () =>
      [...Array(subItemCount)].map((_ignore, index) => ({
        // onKeyDown: itemListener,
        tabIndex: -1,
        // role: "menuitem",
        // ref: subItemRefs.current[index],
        // selected: index === currentSubFocusIndex.current,
      })),
    [itemListener, subItemCount]
  );

  console.log("!!!!!!");

  // Return a listener for the button, individual list items, and the state of the menu
  return {
    buttonProps,
    itemProps,
    subItemProps,
    isOpen,
    setIsOpen,
    isSubMenuOpen,
    setIsSubMenuOpen,
    moveFocus,
  } as const;
}
