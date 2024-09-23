import styled, { css } from "styled-components";

export type TabBarVariant =
  | "normal"
  | "secondary"
  | "eventSection"
  | "scriptEvent";

interface StyledTabBarProps {
  $variant?: TabBarVariant;
}

interface StyledTabsProps {
  $overflowActiveTab?: boolean;
  $variant?: TabBarVariant;
}

interface StyledTabProps {
  $selected: boolean;
  $variant?: TabBarVariant;
}

export const StyledTabBar = styled.div<StyledTabBarProps>`
  height: 36px;
  margin: 0px;
  font-size: 12px;
  font-weight: bold;
  border-bottom: 1px solid ${(props) => props.theme.colors.sidebar.border};
  text-align: left;
  padding: 0;
  padding-right: 10px;
  display: flex;
  align-items: center;
  padding-top: 0px;

  ${(props) =>
    props.$variant === "secondary"
      ? css`
          background-color: ${(props) => props.theme.colors.tabs.background};
        `
      : ""}

  ${(props) =>
    props.$variant === "eventSection"
      ? css`
          height: 25px;
          max-width: none;
          margin-left: -5px;
          margin-right: -5px;
          padding: 0px;
          margin-top: -5px;
          margin-bottom: 5px;
          flex-basis: 100%;
          width: 100%;
          background: ${(props) => props.theme.colors.sidebar.background};
        `
      : ""}

  ${(props) =>
    props.$variant === "scriptEvent"
      ? css`
          border: 0;
          border-bottom: 0;
          margin-bottom: -5px;
          margin-left: 5px;
          margin-top: 5px;
          height: 25px;
          flex-basis: 100%;
          padding-left: 12px;
        `
      : ""}
`;

export const StyledTabs = styled.div<StyledTabsProps>`
  display: flex;
  height: 100%;
  overflow: hidden;
  height: 36px;
  padding-right: 10px;
  width: 100%;
  box-sizing: border-box;
  align-self: flex-start;

  ${(props) =>
    props.$overflowActiveTab
      ? css`
          height: 37px;
        `
      : ""}

  ${(props) =>
    props.$variant === "eventSection"
      ? css`
          height: 26px;
        `
      : ""}

  ${(props) =>
    props.$variant === "scriptEvent"
      ? css`
          height: 25px;
        `
      : ""}
`;

export const StyledTab = styled.button<StyledTabProps>`
  color: ${(props) => props.theme.colors.text};
  border: 0;
  font-size: 12px;
  font-weight: bold;
  background: transparent;
  display: flex;
  align-items: center;
  padding: 0 10px;
  opacity: 0.5;
  border-top: 1px solid transparent;
  white-space: nowrap;
  overflow: hidden;
  -webkit-mask-image: -webkit-gradient(
    linear,
    90% top,
    right top,
    from(rgba(0, 0, 0, 1)),
    to(rgba(0, 0, 0, 0))
  );

  &:hover {
    overflow: visible;
    -webkit-mask-image: none;
  }

  &.focus-visible:focus {
    position: relative;
    z-index: 100;
    border-bottom: 4px solid ${(props) => props.theme.colors.highlight};
    box-shadow: none;
    opacity: 1;
    overflow: visible;
    -webkit-mask-image: none;
  }

  ${(props) =>
    props.$selected && props.$variant !== "secondary"
      ? css`
          background: ${(props) => props.theme.colors.tabs.background};
          opacity: 1;
          border-right: 1px solid ${(props) => props.theme.colors.tabs.border};
          border-top: 1px solid ${(props) => props.theme.colors.tabs.border};
          margin-top: -1px;
          overflow: visible;
          -webkit-mask-image: none;
          &:not(:first-child) {
            border-left: 1px solid ${(props) => props.theme.colors.tabs.border};
          }
        `
      : ""}

  ${(props) =>
    props.$selected && props.$variant === "secondary"
      ? css`
          background: ${(props) => props.theme.colors.tabs.background};
          opacity: 1;
          overflow: visible;
          -webkit-mask-image: none;
        `
      : ""}

${(props) =>
    props.$variant === "secondary"
      ? css`
          padding-right: 5px;
          height: 36px;
        `
      : ""}

      ${(props) =>
    props.$selected && props.$variant === "eventSection"
      ? css`
          background: ${(props) =>
            props.theme.colors.scripting.form.background};
          overflow: visible;
          &:focus {
            z-index: auto;
          }
        `
      : ""}


      ${(props) =>
    props.$variant === "scriptEvent"
      ? css`
          padding: 0 10px;
          margin-top: 0px;
        `
      : ""}

      ${(props) =>
    props.$selected && props.$variant === "scriptEvent"
      ? css`
          border-left: 1px solid ${(props) => props.theme.colors.tabs.border};
          border-right: 1px solid ${(props) => props.theme.colors.tabs.border};
          border-top: 1px solid ${(props) => props.theme.colors.tabs.border};
        `
      : ""}

  ${StyledTabs}:hover > &:not(:hover) {
    overflow: hidden;
  }
`;

export const StyledStickyTabs = styled.div`
  position: sticky;
  top: 0px;
  z-index: 1;
  background: ${(props) => props.theme.colors.sidebar.background};
  box-shadow: ${(props) => props.theme.colors.sidebar.well.boxShadow};
`;

export const StyledTabSettings = styled.div`
  background-color: ${(props) => props.theme.colors.tabs.background};
  border-bottom: 1px solid ${(props) => props.theme.colors.sidebar.border};
  padding: 10px;
`;
