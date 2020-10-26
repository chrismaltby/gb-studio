import styled from "styled-components";
import WindowedSelect from "react-windowed-select";
import { CSSProperties } from "react";
export { components } from "react-select";

export interface Option {
  value: string;
  label: string;
}

export interface OptGroup {
  label: string;
  options: Option[];
}

const menuPortalEl = document.getElementById("MenuPortal");

export const Select = styled(WindowedSelect).attrs({
  classNamePrefix: "CustomSelect",
  styles: {
    option: (base: CSSProperties) => ({
      ...base,
      height: 25,
    }),
  },
  menuPlacement: "auto",
  menuPortalTarget: menuPortalEl,
})`
  .CustomSelect__control {
    height: 28px;
    min-height: 28px;
    background: ${(props) => props.theme.colors.input.background};
    color: ${(props) => props.theme.colors.input.text};
    border: 1px solid ${(props) => props.theme.colors.input.border};
    font-size: ${(props) => props.theme.typography.fontSize};
    border-radius: 4px;
  }

  .CustomSelect__control:hover {
    border: 1px solid ${(props) => props.theme.colors.input.border};
  }

  .CustomSelect__control--is-focused {
    outline: none;
    border: 1px solid ${(props) => props.theme.colors.highlight} !important;
    box-shadow: 0 0 0px 2px ${(props) => props.theme.colors.highlight} !important;
    transition: box-shadow 0.2s cubic-bezier(0.175, 0.885, 0.71, 2.65);
  }

  .CustomSelect__value-container {
    padding-top: 0px;
    padding-left: 3px;
    margin-top: -1px;
  }

  .CustomSelect__single-value {
    color: ${(props) => props.theme.colors.input.text};
  }

  .CustomSelect__placeholder {
    margin: 0;
  }

  .CustomSelect__indicator-separator {
    display: none;
  }

  .CustomSelect__dropdown-indicator {
    padding: 0;
    width: 20px;
    display: flex;
    justify-content: center;
  }

  .CustomSelect__dropdown-indicator svg {
    width: 16px;
    height: 16px;
  }

  .CustomSelect__menu-list {
    background: ${(props) => props.theme.colors.menu.background};
    color: ${(props) => props.theme.colors.text};
    font-size: ${(props) => props.theme.typography.menuFontSize};
    border-radius: 4px;
  }

  .CustomSelect__option {
    padding: 5px 10px;
    background: ${(props) => props.theme.colors.menu.background};
  }

  .CustomSelect__option--is-selected {
    color: ${(props) => props.theme.colors.highlight};
  }

  .CustomSelect__option--is-focused {
    background: ${(props) => props.theme.colors.menu.hoverBackground};
  }

  .CustomSelect__option:active {
    background: ${(props) => props.theme.colors.menu.activeBackground};
  }

  input:focus {
    box-shadow: none !important;
  }
`;
