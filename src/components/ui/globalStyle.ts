import "focus-visible";
import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    font-size: 13px;
    user-select: none;
    caret-color: ${(props) => props.theme.colors.highlight};
  }

  #MenuPortal {
    z-index: 10000;
    position: absolute;
    top: 0;
    bottom: 0;
  }

  * {
    transition: box-shadow 0.2s cubic-bezier(0.175, 0.885, 0.710, 2.650);
  }

  :focus {
    outline: none;
    box-shadow: 0 0 0px 2px ${(props) => props.theme.colors.highlight};
    z-index: 10000;
  }

  .js-focus-visible :focus:not(.focus-visible):not(select) {
    outline: none;
    box-shadow: none !important;
  }

  div::-webkit-scrollbar-track {
    border-radius: 0px;
    background-color: transparent;
  }

  div::-webkit-scrollbar {
    width: 17px;
    height: 17px;
    background-color: transparent;
  }

  div::-webkit-scrollbar-thumb {
    border-radius: 17px;
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
    background-color: rgba(180, 180, 180, 0.3);
    border: 4px solid transparent;
    background-clip: content-box;
  }

  div::-webkit-scrollbar-corner {
    background: var(--main-bg-color);
  }

  body .CustomSelect__menu {
    z-index: 100;
    min-width: 200px;
    right: 0;
  }

  body .CustomSelect__menu-list {
    background: ${(props) => props.theme.colors.menu.background};
    color: ${(props) => props.theme.colors.text};
    font-size: ${(props) => props.theme.typography.menuFontSize};
    border-radius: 4px;
  }

  body .CustomSelect__option {
    padding: 5px 10px;
    background: ${(props) => props.theme.colors.menu.background};
  }

  body .CustomSelect__option--is-selected {
    color: ${(props) => props.theme.colors.highlight};
  }

  body .CustomSelect__option--is-focused {
    background: ${(props) => props.theme.colors.menu.hoverBackground};
  }

  body .CustomSelect__option:active {
    background: ${(props) => props.theme.colors.menu.activeBackground};
  }

  .label--red {
    background: #e20e2b;
  }

  .label--orange {
    background: #ff5722;
  }

  .label--yellow {
    background: #ffc107;
  }

  .label--green {
    background: #4caf50;
  }

  .label--blue {
    background: #03a9f4;
  }

  .label--purple {
    background: #9c27b0;
  }

  .label--gray {
    background: #9e9e9e;
  }

  .label--cyan {
    background: #00bcd4;
  }

  .label--red-alt {
    background: #b71c1c;
  }

  .label--orange-alt {
    background: #e65100;
  }

  .label--yellow-alt {
    background: #f57f17;
  }

  .label--green-alt {
    background: #1b5e20;
  }

  .label--blue-alt {
    background: #0d47a1;
  }

  .label--purple-alt {
    background: #4a148c;
  }

  .label--gray-alt {
    background: #424242;
  }

  .label-cyan-alt {
    background: #006064;
  }
`;

export default GlobalStyle;
