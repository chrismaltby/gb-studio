import React, { useCallback, useEffect, useRef } from "react";
import useNestedMenu from "ui/hooks/use-nested-menu";
import { PositionedPortal } from "ui/layout/PositionedPortal";
import { Menu } from "ui/menu/Menu";

interface ContextMenuProps {
  readonly x: number;
  readonly y: number;
  readonly children?: JSX.Element[];
  readonly onClose?: () => void;
  readonly onKeyDown?: (e: React.KeyboardEvent) => boolean;
}

export const ContextMenu = ({
  x,
  y,
  children,
  onClose,
  onKeyDown,
}: ContextMenuProps) => {
  const { menuRef, isOpen, childrenWithProps } = useNestedMenu(
    children,
    true,
    "right",
    onKeyDown,
  );
  const wasOpen = useRef(isOpen);
  useEffect(() => {
    if (wasOpen.current && !isOpen) {
      onClose?.();
    }
    wasOpen.current = isOpen;
  }, [isOpen, onClose]);

  const onHotkeyHandled = useCallback(() => {
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("gbs::hotkey", onHotkeyHandled);
    }
    return () => {
      document.removeEventListener("gbs::hotkey", onHotkeyHandled);
    };
  }, [isOpen, onHotkeyHandled]);

  return isOpen ? (
    <PositionedPortal x={x} y={y} offsetX={-2} offsetY={-10}>
      <Menu ref={menuRef}>{childrenWithProps}</Menu>
    </PositionedPortal>
  ) : null;
};
