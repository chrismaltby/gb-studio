import React, { useEffect, useRef } from "react";
import useNestedMenu from "ui/hooks/use-nested-menu";
import { PositionedPortal } from "ui/layout/PositionedPortal";
import { Menu } from "ui/menu/Menu";

interface ContextMenuProps {
  readonly x: number;
  readonly y: number;
  readonly children?: JSX.Element[];
  readonly onClose?: () => void;
}

export const ContextMenu = ({ x, y, children, onClose }: ContextMenuProps) => {
  const { menuRef, isOpen, childrenWithProps } = useNestedMenu(
    children,
    true,
    "right"
  );
  const wasOpen = useRef(isOpen);
  useEffect(() => {
    if (wasOpen.current && !isOpen) {
      onClose?.();
    }
    wasOpen.current = isOpen;
  }, [isOpen, onClose]);
  return isOpen ? (
    <PositionedPortal x={x} y={y} offsetX={-2} offsetY={-10}>
      <Menu ref={menuRef}>{childrenWithProps}</Menu>
    </PositionedPortal>
  ) : null;
};
