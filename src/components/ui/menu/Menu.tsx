import { ReactNode } from "react";
import styled, { css } from "styled-components";
import { ThemeInterface } from "../theme/ThemeInterface";

export interface MenuProps {
  readonly children?: ReactNode;
  readonly theme?: ThemeInterface;
}

export const Menu = styled.div<MenuProps>`
  display: flex;
  flex-direction: column;
  border-radius: ${(props) => props.theme.borderRadius}px;
  width: max-content;
  min-width: 100px;
  user-select: none;
  box-shadow: ${(props) => props.theme.colors.menu.boxShadow};
  background: ${(props) => props.theme.colors.menu.background};
  color: ${(props) => props.theme.colors.text};
  font-size: ${(props) => props.theme.typography.menuFontSize};
  padding: 4px 0;
  font-weight: normal;
  line-height: 15px;
`;

export interface MenuItemProps {
  readonly focus?: boolean;
  readonly selected?: boolean;
  readonly onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  readonly onMouseEnter?: (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => void;
}

export const MenuItem = styled.div<MenuItemProps>`
  display: flex;
  align-items: center;
  padding: 5px 10px;
  font-size: ${(props) => props.theme.typography.menuFontSize};
  white-space: nowrap;

  &:hover,
  &:focus {
    background: ${(props) => props.theme.colors.menu.hoverBackground};
    outline: none;
    box-shadow: none;
  }

  &:active {
    background: ${(props) => props.theme.colors.menu.activeBackground};
  }

  ${Menu}:hover &:focus&:not(:hover) {
    background: ${(props) => props.theme.colors.menu.activeBackground};
  }

  ${(props) =>
    props.selected
      ? css`
          background: ${(props) => props.theme.colors.menu.hoverBackground};
          outline: none;
          box-shadow: none;
        `
      : ""}
`;

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
  }
  &:nth-child(1) {
    margin-left: -5px;
    margin-right: 5px;
  }
`;

export const MenuGroup = styled.div`
  display: flex;
  align-items: center;
  padding: 5px 10px;
  font-size: 10px;
  text-transform: uppercase;
  opacity: 0.8;

  ${MenuItem} + & {
    margin-top: 10px;
  }
`;

export const MenuDivider = styled.div`
  border-bottom: 1px solid ${(props) => props.theme.colors.menu.divider};
`;

export interface MenuAcceleratorProps {
  accelerator: string;
}

export const acceleratorForPlatform = (accelerator: string) => {
  if (process.platform === "darwin") {
    return accelerator
      .replace(/CommandOrControl\+/g, "⌘")
      .replace(/Shift\+/g, "⇧")
      .replace(/Alt\+/g, "⌥");
  }
  return accelerator
    .replace(/CommandOrControl\+/g, "Ctrl+")
    .replace(/Shift\+/g, "Shift+")
    .replace(/Alt\+/g, "Alt+");
};

export const MenuAccelerator = styled.div.attrs<MenuAcceleratorProps>(
  (props) => ({
    children: acceleratorForPlatform(props.accelerator),
  })
)<MenuAcceleratorProps>`
  flex-grow: 1;
  font-size: 0.8em;
  text-align: right;
  margin-left: 20px;
  color: ${(props) => props.theme.colors.secondaryText};
`;

export const MenuOverlay = styled.div`
  position: fixed;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  z-index: 1000;
`;
