import "focus-visible";
import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  html,
  body {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    font-size: 13px;
    user-select: none;
    caret-color: ${(props) => props.theme.colors.highlight};
    background: ${(props) => props.theme.colors.background};
    color: ${(props) => props.theme.colors.text};
  }

  #App {
    width: 100%;
    height: 100%;
  }
  
  .App {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .App__Content {
    width: 100%;
    height: calc(100% - 38px);
    display: flex;
    flex-direction: row;
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

  // Island Joy 16 Palette by Kerrie Lake
  // https://lospec.com/palette-list/island-joy-16

  .label--instrument-0 {
    background: #6df7c1;
  }

  .label--instrument-1 {
    background: #11adc1;
  }

  .label--instrument-2 {
    background: #606c81;
  }

  .label--instrument-3 {
    background: #393457;
  }

  .label--instrument-4 {
   background: #1e8875;
  }

  .label--instrument-5 {
   background: #5bb361;
  }

  .label--instrument-6 {
    background: #a1e55a;
  }

  .label--instrument-7 {
    background: #f7e476;
  }

  .label--instrument-8 {
    background: #f99252;
  }

  .label--instrument-9 {
    background: #cb4d68;
  }

  .label--instrument-10 {
    background: #6a3771;
  }

  .label--instrument-11 {
    background: #c92464;
  }

  .label--instrument-12 {
    background: #f48cb6;
  }

  .label--instrument-13 {
    background: #f7b69e;
  }

  .label--instrument-14 {
    background: #9b9c82;
  }

  .GlobalError {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    height: 100%;
    padding: 30px;
    overflow: auto;
    box-sizing: border-box;
    -webkit-app-region: drag;
  }
  
  .GlobalError__Content {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    -webkit-app-region: none;
  }
  
  .GlobalError__Icon {
    width: 192px;
    height: 192px;
  }
  
  .GlobalError__Icon svg {
    width: 100%;
    height: 100%;
  }
  
  .GlobalError__Buttons .Button {
    margin: 20px 10px;
  }
  
  .GlobalError__StackTrace {
    background: #fff;
    padding: 30px;
    border-radius: 4px;
    max-height: 270px;
    margin-top: 20px;
    max-width: 860px;
    overflow: auto;
  }
  
  .GlobalError h1,
  .GlobalError h2,
  .GlobalError p,
  .GlobalError__StackTrace {
    user-select: text;
  }  

  `;

export default GlobalStyle;
