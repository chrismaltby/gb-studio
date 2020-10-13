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
    caret-color: ${props => props.theme.colors.highlight};
  }

  * {
    transition: box-shadow 0.2s cubic-bezier(0.175, 0.885, 0.710, 2.650);
  }

  :focus {
    outline: none;
    box-shadow: 0 0 0px 2px ${props => props.theme.colors.highlight};
    z-index: 10000;
  }

  .js-focus-visible :focus:not(.focus-visible) {
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
`;

export default GlobalStyle;
