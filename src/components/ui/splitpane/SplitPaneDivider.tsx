import React from "react";
import {
  StyledSplitPaneHorizontalDivider,
  StyledSplitPaneVerticalDivider,
} from "ui/splitpane/style";

export const SplitPaneHorizontalDivider = (
  props: React.HTMLAttributes<HTMLDivElement>,
) => <StyledSplitPaneHorizontalDivider {...props} />;

export const SplitPaneVerticalDivider = (
  props: React.HTMLAttributes<HTMLDivElement>,
) => <StyledSplitPaneVerticalDivider {...props} />;
