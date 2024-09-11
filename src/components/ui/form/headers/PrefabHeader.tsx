import React, { ReactNode } from "react";
import { StyledPrefabHeader } from "ui/form/headers/style";

interface PrefabHeaderProps {
  prefabSet: boolean;
  children?: ReactNode;
}

export const PrefabHeader = ({ prefabSet, children }: PrefabHeaderProps) => (
  <StyledPrefabHeader $prefabSet={prefabSet} children={children} />
);
