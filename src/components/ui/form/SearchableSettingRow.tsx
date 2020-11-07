import React, { FC, ReactNode } from "react";
import { SettingRow } from "./SettingRow";

export interface SearchableSettingRowProps {
  searchTerm?: string;
  searchMatches?: string[];
  children?: ReactNode;
}

export const SearchableSettingRow: FC<SearchableSettingRowProps> = ({
  searchTerm,
  searchMatches,
  children,
}) => {
  const component = <SettingRow>{children}</SettingRow>;
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
