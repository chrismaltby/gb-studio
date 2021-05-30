import React, { ReactNode } from "react";
import styled, { css } from "styled-components";

interface TabBarProps<T extends string> {
  value?: T;
  values: Record<T, string>;
  onChange?: (newValue: T) => void;
  buttons?: ReactNode;
  variant?: "normal" | "secondary";
  overflowActiveTab?: boolean;
}

interface WrapperProps {
  variant?: "normal" | "secondary";
}

interface TabsProps {
  overflowActiveTab?: boolean;
}

interface TabProps {
  selected: boolean;
  variant?: "normal" | "secondary";
}

const Wrapper = styled.div<WrapperProps>`
  height: 37px;
  margin: 0px;
  font-size: 12px;
  font-weight: bold;
  border-bottom: 1px solid var(--sidebar-border-color);
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
`;

const Tabs = styled.div<TabsProps>`
  display: flex;
  height: 100%;
  overflow: hidden;
  height: 37px;
  padding-top: 1px;
  padding-right: 10px;
  width: 100%;
  box-sizing: border-box;

  ${(props) =>
    props.overflowActiveTab
      ? css`
          height: 38px;
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
          background: var(--input-bg-color);
          opacity: 1;
          outline: 1px solid var(--input-border-color) !important;
          overflow: visible;
          -webkit-mask-image: none;
        `
      : ""}

  ${(props) =>
    props.selected && props.variant === "secondary"
      ? css`
          background: var(--input-bg-color);
          opacity: 1;
          overflow: visible;
          -webkit-mask-image: none;
        `
      : ""}

${(props) =>
    props.variant === "secondary"
      ? css`
          padding-right: 5px;
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
      <Tabs overflowActiveTab={overflowActiveTab}>
        {tabKeys.map((tab, index) => (
          <Tab
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
