import React, { Children, forwardRef, isValidElement, ReactNode } from "react";
import styled from "styled-components";
import { CaretRightIcon } from "ui/icons/Icons";
import {
  StyledMenu,
  StyledMenuAccelerator,
  StyledMenuDivider,
  StyledMenuGroup,
  StyledMenuItem,
  StyledMenuItemCaret,
  StyledMenuItemIcon,
} from "ui/menu/style";

export const extractMenuAccelerator = (children: ReactNode): string | null => {
  let accelerator: string | null = null;

  Children.forEach(children, (child) => {
    if (
      isValidElement(child) &&
      child.type === MenuAccelerator &&
      typeof child.props.accelerator === "string"
    ) {
      accelerator = child.props.accelerator;
    }
  });

  return accelerator;
};

export const normalizeMenuAccelerator = (accelerator: string) =>
  accelerator
    .replace("CommandOrControl", "ctrl")
    .split("+")
    .map((p) => p.toLowerCase())
    .sort()
    .join("+");

export const normalizeMenuEvent = (e: KeyboardEvent | React.KeyboardEvent) => {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) {
    parts.push("ctrl");
  }
  if (e.shiftKey) parts.push("shift");
  if (e.altKey) parts.push("alt");
  parts.push(e.key.toLowerCase());
  return parts.sort().join("+");
};

export const Menu = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, outerRef) => <StyledMenu ref={outerRef} role="menu" {...props} />);

export interface MenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly "data-index"?: number;
  readonly "data-accelerator"?: string;
  readonly selected?: boolean;
  readonly onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  readonly onMouseEnter?: (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => void;
  readonly subMenu?: React.ReactElement[];
  readonly icon?: ReactNode;
  readonly children?: ReactNode;
}

export const MenuItem = ({
  selected,
  subMenu,
  children,
  icon,
  ...props
}: MenuItemProps) => (
  <StyledMenuItem $selected={selected} {...props}>
    {icon && <StyledMenuItemIcon>{icon}</StyledMenuItemIcon>}
    {children}
    {subMenu && <MenuItemCaret />}
  </StyledMenuItem>
);

interface MenuItemIconProps {
  readonly children?: ReactNode;
}

export const MenuItemIcon = ({ children }: MenuItemIconProps) => (
  <StyledMenuItemIcon children={children} />
);

interface MenuGroupProps {
  children?: ReactNode;
}

export const MenuGroup = ({ children }: MenuGroupProps) => (
  <StyledMenuGroup children={children} />
);

export const MenuSection = styled.div`
  display: flex;
  align-items: center;
  padding: 5px 10px;
  font-size: ${(props) => props.theme.typography.menuFontSize};
  white-space: nowrap;
`;

export const MenuDivider = () => <StyledMenuDivider />;

interface MenuAcceleratorProps {
  accelerator: string;
}

export const MenuAccelerator = ({ accelerator }: MenuAcceleratorProps) => (
  <StyledMenuAccelerator $accelerator={accelerator} />
);

export const MenuOverlay = styled.div`
  position: fixed;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  z-index: 1000;
`;

export const MenuItemCaret = () => (
  <StyledMenuItemCaret>
    <CaretRightIcon />
  </StyledMenuItemCaret>
);
