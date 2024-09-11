import React, { forwardRef, ReactNode } from "react";
import styled from "styled-components";
import { CaretRightIcon } from "ui/icons/Icons";
import {
  StyledMenu,
  StyledMenuAccelerator,
  StyledMenuItem,
  StyledMenuItemCaret,
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
  readonly children?: ReactNode;
}

export const MenuItem = ({ selected, subMenu: _, ...props }: MenuItemProps) => (
  <StyledMenuItem $selected={selected} {...props} />
);

export const MenuItemIcon = styled.div<MenuItemProps>`
  width: 15px;
  height: 15px;
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  svg {
    width: 12px;
    height: 12px;
    fill: ${(props) => props.theme.colors.text};
  }
  &:nth-child(1) {
    margin-left: -5px;
    margin-right: 5px;
  }
  &:last-child:not(:first-child) {
    margin-left: 5px;
    margin-right: 0px;
  }
`;

export const MenuGroup = styled.div`
  display: flex;
  align-items: center;
  padding: 5px 10px;
  font-size: 10px;
  text-transform: uppercase;
  opacity: 0.8;

  ${StyledMenuItem} + & {
    margin-top: 10px;
  }
`;

export const MenuSection = styled.div`
  display: flex;
  align-items: center;
  padding: 5px 10px;
  font-size: ${(props) => props.theme.typography.menuFontSize};
  white-space: nowrap;
`;

export const MenuDivider = styled.div`
  border-bottom: 1px solid ${(props) => props.theme.colors.menu.divider};
`;

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
