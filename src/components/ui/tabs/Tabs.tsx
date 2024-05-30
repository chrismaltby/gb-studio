import React, { ReactNode } from "react";
import styled, { css } from "styled-components";

interface TabBarProps<T extends string> {
  value?: T;
  values: Record<T, string>;
  onChange?: (newValue: T) => void;
  buttons?: ReactNode;
  variant?: "normal" | "secondary" | "scriptEvent";
  overflowActiveTab?: boolean;
}

interface WrapperProps {
  variant?: "normal" | "secondary" | "scriptEvent";
}

interface TabsProps {
  overflowActiveTab?: boolean;
  variant?: "normal" | "secondary" | "scriptEvent";
}

interface TabProps {
  selected: boolean;
  variant?: "normal" | "secondary" | "scriptEvent";
}

const Wrapper = styled.div<WrapperProps>`
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
    props.variant === "secondary"
      ? css`
          background-color: ${(props) => props.theme.colors.input.background};
        `
      : ""}

  ${(props) =>
    props.variant === "scriptEvent"
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

const Tabs = styled.div<TabsProps>`
  display: flex;
  height: 100%;
  overflow: hidden;
  height: 36px;
  padding-right: 10px;
  width: 100%;
  box-sizing: border-box;
  align-self: flex-start;

  ${(props) =>
    props.overflowActiveTab
      ? css`
          height: 37px;
        `
      : ""}

  ${(props) =>
    props.variant === "scriptEvent"
      ? css`
          height: 25px;
        `
      : ""}
`;

const Tab = styled.button<TabProps>`
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

  :hover {
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
    props.selected && props.variant !== "secondary"
      ? css`
          background: ${(props) => props.theme.colors.input.background};
          opacity: 1;
          border-right: 1px solid ${(props) => props.theme.colors.input.border};
          border-top: 1px solid ${(props) => props.theme.colors.input.border};
          margin-top: -1px;
          overflow: visible;
          -webkit-mask-image: none;
          &:not(:first-child) {
            border-left: 1px solid ${(props) => props.theme.colors.input.border};
          }
        `
      : ""}

  ${(props) =>
    props.selected && props.variant === "secondary"
      ? css`
          background: ${(props) => props.theme.colors.input.background};
          opacity: 1;
          overflow: visible;
          -webkit-mask-image: none;
        `
      : ""}

${(props) =>
    props.variant === "secondary"
      ? css`
          padding-right: 5px;
          height: 36px;
        `
      : ""}


      ${(props) =>
    props.variant === "scriptEvent"
      ? css`
          padding: 0 10px;
          margin-top: 0px;
        `
      : ""}

      ${(props) =>
    props.selected && props.variant === "scriptEvent"
      ? css`
          border-left: 1px solid ${(props) => props.theme.colors.input.border};
          border-right: 1px solid ${(props) => props.theme.colors.input.border};
          border-top: 1px solid ${(props) => props.theme.colors.input.border};
        `
      : ""}

  ${Tabs}:hover > &:not(:hover) {
    overflow: hidden;
  }
`;

const Spacer = styled.div`
  flex-grow: 1;
`;

export const TabBar = <T extends string>({
  value,
  values,
  onChange,
  buttons,
  variant,
  overflowActiveTab,
}: TabBarProps<T>) => {
  const tabKeys = Object.keys(values) as T[];

  const onClickTab = (tab: T) => () => {
    onChange?.(tab);
  };

  return (
    <Wrapper variant={variant}>
      <Tabs overflowActiveTab={overflowActiveTab} variant={variant}>
        {tabKeys.map((tab, index) => (
          <Tab
            key={values[tab]}
            selected={value !== undefined ? tab === value : index === 0}
            variant={variant}
            onClick={onClickTab(tab)}
          >
            <span>{values[tab]}</span>
          </Tab>
        ))}
      </Tabs>
      <Spacer />
      {buttons}
    </Wrapper>
  );
};

export const StickyTabs = styled.div`
  position: sticky;
  top: 0;
  z-index: 1;
  background: ${(props) => props.theme.colors.sidebar.background};
  box-shadow: ${(props) => props.theme.colors.sidebar.well.boxShadow};
`;

export const TabSettings = styled.div`
  background-color: ${(props) => props.theme.colors.input.background};
  border-bottom: 1px solid ${(props) => props.theme.colors.sidebar.border};
  padding: 10px;
`;
