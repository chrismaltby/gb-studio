import { ReactNode } from "react";
import styled from "styled-components";
import { ThemeInterface } from "../theme/ThemeInterface";

export interface MenuProps {
  readonly children?: ReactNode;
  readonly theme?: ThemeInterface;
}

export const Menu = styled.div<MenuProps>`
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  width: max-content;
  min-width: 100px;
  user-select: none;
  box-shadow: 0 0 0 1px rgba(150, 150, 150, 0.3),
    0 4px 11px hsla(0, 0%, 0%, 0.1);
  background: ${props => props.theme.colors.menu.background};
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.typography.fontSize};
  padding: 4px 0;
`;

export interface MenuItemProps {
  readonly focus?: boolean;
  readonly onClick?: (e: any) => void;
  readonly onMouseEnter?: (e: any) => void;
}

export const MenuItem = styled.div<MenuItemProps>`
  display: flex;
  align-items: center;
  padding: 5px 10px;

  &:hover,
  &:focus {
    background: ${props => props.theme.colors.menu.hoverBackground};
    outline: none;
    box-shadow: none;
  }

  &:active {
    background: ${props => props.theme.colors.menu.activeBackground};
  }

  ${Menu}:hover &:focus&:not(:hover) {
    background: ${props => props.theme.colors.menu.activeBackground};
  }
`;

export const MenuDivider = styled.div`
  border-bottom: 1px solid ${props => props.theme.colors.menu.divider};
`;

export const MenuAccelerator = styled.div`
  flex-grow: 1;
  font-size: 0.8em;
  text-align: right;
  margin-left: 20px;
  color: ${props => props.theme.colors.secondaryText};
`;

export const MenuOverlay = styled.div`
  position: fixed;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  z-index: 1000;
`;
