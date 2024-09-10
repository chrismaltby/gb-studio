import React, { ReactNode } from "react";
import { FlexGrow } from "ui/spacing/Spacing";
import {
  StyledStickyTabs,
  StyledTab,
  StyledTabBar,
  StyledTabs,
  StyledTabSettings,
} from "ui/tabs/style";

export type TabBarVariant =
  | "normal"
  | "secondary"
  | "eventSection"
  | "scriptEvent";

interface TabBarProps<T extends string> {
  value?: T;
  values: Record<T, string>;
  onChange?: (newValue: T) => void;
  buttons?: ReactNode;
  variant?: TabBarVariant;
  overflowActiveTab?: boolean;
}

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
    <StyledTabBar $variant={variant}>
      <StyledTabs $overflowActiveTab={overflowActiveTab} $variant={variant}>
        {tabKeys.map((tab, index) => (
          <StyledTab
            key={values[tab]}
            $selected={value !== undefined ? tab === value : index === 0}
            $variant={variant}
            onClick={onClickTab(tab)}
          >
            <span>{values[tab]}</span>
          </StyledTab>
        ))}
      </StyledTabs>
      <FlexGrow />
      {buttons}
    </StyledTabBar>
  );
};

interface StickyTabsProps {
  children?: ReactNode;
  top?: number;
}

export const StickyTabs = ({ children, top }: StickyTabsProps) => (
  <StyledStickyTabs children={children} style={top ? { top } : undefined} />
);

interface TabSettingsProps {
  children?: ReactNode;
}

export const TabSettings = ({ children }: TabSettingsProps) => (
  <StyledTabSettings children={children} />
);
