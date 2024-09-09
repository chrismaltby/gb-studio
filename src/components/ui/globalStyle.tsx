import "focus-visible";
import { createGlobalStyle } from "styled-components";
import pixelFont from "assets/fonts/PublicPixel.woff2";
import React from "react";

// Load font for use in Canvas elements
new FontFace("Public Pixel", `url("${pixelFont}")`).load().then((font) => {
  document.fonts.add(font);
});

const GlobalStyle = createGlobalStyle`
  @font-face {
      font-family: 'Public Pixel';
      src: url('${pixelFont}') format('woff2');
      font-weight: normal;
      font-style: normal;
  }

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

  input {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  }

  #App {
    width: 100%;
    height: 100%;
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
    background: ${(props) => props.theme.colors.document.background};
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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

  .MentionsInput__suggestions {
    background-color: transparent !important;
    z-index: 1000 !important;
  }

  .MentionsInput__suggestions__list {
    display: flex;
    flex-direction: column;
    border-radius: 4px;
    width: max-content;
    min-width: 100px;
    user-select: none;
    box-shadow: 0 0 0 1px rgba(150, 150, 150, 0.3),
      0 4px 11px hsla(0, 0%, 0%, 0.1);
    background: ${(props) => props.theme.colors.menu.background};
    color: ${(props) => props.theme.colors.text};
    font-size: ${(props) => props.theme.typography.fontSize};
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
      "Segoe UI Symbol";
    padding: 4px 0;
  }

  .MentionsInput__suggestions__item {
    display: flex;
    align-items: center;
    padding: 5px 10px;
    font-size: ${(props) => props.theme.typography.menuFontSize};
    &:focus {
      background: ${(props) => props.theme.colors.menu.hoverBackground};
      outline: none;
      box-shadow: none;
    }
  }

  .MentionsInput__suggestions__item:hover {
    background-color: ${(props) => props.theme.colors.menu.hoverBackground};
  }

  .MentionsInput__suggestions__item--focused {
    background-color: ${(props) => props.theme.colors.menu.activeBackground};
  }
`;

const AllowScrollGlobalStyle = createGlobalStyle`
  body {
    overflow: scroll;
  }
`;

export const StorybookGlobalStyles = () => {
  return (
    <>
      <GlobalStyle />
      <AllowScrollGlobalStyle />
    </>
  );
};

export default GlobalStyle;
