import React, { ReactNode } from "react";
import {
  StyledFixedSpacer,
  StyledFlexBreak,
  StyledFlexGrow,
  StyledFlexRow,
} from "ui/spacing/style";

export const FlexGrow = (props: React.HTMLAttributes<HTMLDivElement>) => (
  <StyledFlexGrow {...props} />
);

export interface FixedSpacerProps {
  width?: number;
  height?: number;
}

export const FixedSpacer = ({ width, height }: FixedSpacerProps) => (
  <StyledFixedSpacer $width={width} $height={height} />
);

export const FlexBreak = () => <StyledFlexBreak />;

export interface FlexRowProps {
  children: ReactNode;
}

export const FlexRow = ({ children }: FlexRowProps) => (
  <StyledFlexRow children={children} />
);
