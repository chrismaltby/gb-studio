import API from "renderer/lib/api";
import styled, { css } from "styled-components";

export interface StyledMenuAcceleratorProps {
  $accelerator: string;
}

export const acceleratorForPlatform = (accelerator: string) => {
  if (API.platform === "darwin") {
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

export const StyledMenuAccelerator = styled.div.attrs<StyledMenuAcceleratorProps>(
  (props) => ({
    children: acceleratorForPlatform(props.$accelerator),
  }),
)<StyledMenuAcceleratorProps>`
  flex-grow: 1;
  font-size: 0.8em;
  text-align: right;
  margin-left: 20px;
  color: ${(props) => props.theme.colors.secondaryText};
`;

// #region MenuItemCaret

export const StyledMenuItemCaret = styled.div`
  flex-grow: 1;
  text-align: right;
  margin-left: 5px;
  svg {
    display: inline-block;
    width: 10px;
    height: 10px;
    fill: ${(props) => props.theme.colors.text};
  }
`;

// #endregion MenuItemCaret

// #region Menu

export const StyledMenu = styled.div`
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

// #endregion Menu

// #region MenuItem

export interface StyledMenuItemProps {
  readonly $selected?: boolean;
}

export const StyledMenuItem = styled.div<StyledMenuItemProps>`
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

  ${StyledMenu}:hover &:focus&:not(:hover) {
    background: ${(props) => props.theme.colors.menu.activeBackground};
  }

  ${(props) =>
    props.$selected
      ? css`
          background: ${(props) => props.theme.colors.menu.hoverBackground};
          outline: none;
          box-shadow: none;
        `
      : ""}
`;

export const StyledMenuItemIcon = styled.div`
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

// #endregion MenuItem

// #region MenuGroup

export const StyledMenuGroup = styled.div`
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

// #endregion MenuGroup

// #region MenuDivider

export const StyledMenuDivider = styled.div`
  border-bottom: 1px solid ${(props) => props.theme.colors.menu.divider};
`;

// #region MenuDivider
