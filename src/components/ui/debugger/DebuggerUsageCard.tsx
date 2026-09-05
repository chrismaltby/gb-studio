import React, { type ReactNode } from "react";
import { Card } from "ui/cards/Card";
import {
  StyledDebuggerUsageCardHeader,
  StyledDebuggerUsageCardTitle,
} from "./style";
import { FlexGrow } from "ui/spacing/Spacing";

interface DebuggerUsageCardProps {
  readonly title: ReactNode;
  readonly toolbar?: ReactNode;
  readonly children: ReactNode;
}

export const DebuggerUsageCard = ({
  title,
  toolbar,
  children,
}: DebuggerUsageCardProps) => (
  <Card>
    <StyledDebuggerUsageCardHeader>
      <StyledDebuggerUsageCardTitle>{title}</StyledDebuggerUsageCardTitle>
      {toolbar && (
        <>
          <FlexGrow />
          {toolbar}
        </>
      )}
    </StyledDebuggerUsageCardHeader>

    {children}
  </Card>
);
