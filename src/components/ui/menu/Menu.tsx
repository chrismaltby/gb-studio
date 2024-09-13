import React, { forwardRef, ReactNode } from "react";
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

export const Menu = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, outerRef) => <StyledMenu ref={outerRef} {...props} />);

export interface MenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly "data-index"?: number;
  readonly selected?: boolean;
  readonly onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  readonly onMouseEnter?: (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
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

export interface MenuItemIconProps {
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

export interface MenuAcceleratorProps {
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
