import React, { FC, ReactNode } from "react";
import { Card } from "./Card";

export interface SettingsSectionProps {
  searchTerm?: string;
  searchMatches?: string[];
  children?: ReactNode;
}

export const SearchableCard: FC<SettingsSectionProps> = ({
  searchTerm,
  searchMatches,
  children,
}) => {
  const component = <Card>{children}</Card>;
  if (!searchTerm || !searchMatches || searchTerm.length === 0) {
    return component;
  }
  const upperSearchTerm = searchTerm.toLocaleUpperCase();
  const match = searchMatches.find((s) =>
    s.toLocaleUpperCase().includes(upperSearchTerm)
  );
  if (match) {
    return component;
  }
  return null;
};
