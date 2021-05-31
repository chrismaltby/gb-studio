// Imports
import React, { useState, useRef, createRef, useEffect } from "react";
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
export default function useDropdownMenu(itemCount: number) {
  // Use state
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const currentFocusIndex = useRef<number | null>(null);
  const firstRun = useRef(true);
  const clickedOpen = useRef(false);
  const windowFocus = useWindowFocus();

  // Create refs
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<React.RefObject<HTMLAnchorElement>[]>([]);

  // Initialize refs and update them when the item count changes
  useEffect(() => {
    itemRefs.current = [...Array(itemCount)].map(() =>
      createRef<HTMLAnchorElement>()
    );
  }, [itemCount]);

  // Create type guard
  const isKeyboardEvent = (
    e: React.KeyboardEvent | React.MouseEvent
  ): e is React.KeyboardEvent => (e as React.KeyboardEvent).key !== undefined;

  // Handles moving the focus between menu items
  const moveFocus = (itemIndex: number) => {
    currentFocusIndex.current = itemIndex;
    itemRefs.current[itemIndex].current?.focus();
  };

  // Focus the first item when the menu opens
  useEffect(() => {
    // Stop if this is the first fire of the Hook, and update the ref
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    // If the menu is currently open focus on the first item in the menu
    if (isOpen && !clickedOpen.current) {
      moveFocus(0);
    } else if (!isOpen) {
      clickedOpen.current = false;
    }
  }, [isOpen]);

  // Close menu if window loses focus
  useEffect(() => {
    if (!windowFocus && isOpen) {
      setIsOpen(false);
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
  const buttonListener = (e: React.KeyboardEvent | React.MouseEvent) => {
    // Detect if event was a keyboard event or a mouse event
    if (isKeyboardEvent(e)) {
      const { key } = e;

      if (!["Enter", " ", "Tab", "ArrowDown"].includes(key)) {
        return;
      }

      if (
        (key === "Tab" || key === "ArrowDown") &&
        clickedOpen.current &&
        isOpen
      ) {
        e.preventDefault();
        moveFocus(0);
      } else if (key !== "Tab") {
        e.preventDefault();
        setIsOpen(true);
      }
    } else {
      clickedOpen.current = !isOpen;
      setIsOpen(!isOpen);
    }
  };

  // Create a function that handles menu logic based on keyboard events that occur on menu items
  const itemListener = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    // Destructure the key property from the event object
    const { key } = e;

    // Ignore keys that we shouldn't handle
    if (
      !["Tab", "Shift", "Enter", "Escape", "ArrowUp", "ArrowDown"].includes(key)
    ) {
      return;
    }

    // Create mutable value that initializes as the currentFocusIndex value
    let newFocusIndex = currentFocusIndex.current;

    // Controls whether the menu is open or closed, if the button should regain focus on close, and if a handler function should be called
    if (key === "Escape") {
      setIsOpen(false);
      buttonRef.current?.focus();
      return;
    } else if (key === "Tab") {
      setIsOpen(false);
      return;
    } else if (key === "Enter") {
      if (!e.currentTarget.href) {
        e.currentTarget.click();
      }

      setIsOpen(false);
      return;
    }

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
      moveFocus(newFocusIndex);
    }
  };

  // Define spreadable props for button and items
  const buttonProps: ButtonProps = {
    onKeyDown: buttonListener,
    onClick: buttonListener,
    tabIndex: 0,
    ref: buttonRef,
    role: "button",
    "aria-haspopup": true,
    "aria-expanded": isOpen,
  };

  const itemProps = [...Array(itemCount)].map((_ignore, index) => ({
    onKeyDown: itemListener,
    tabIndex: -1,
    role: "menuitem",
    ref: itemRefs.current[index],
  }));

  // Return a listener for the button, individual list items, and the state of the menu
  return { buttonProps, itemProps, isOpen, setIsOpen, moveFocus } as const;
}
