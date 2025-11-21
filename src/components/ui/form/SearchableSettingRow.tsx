import React, { FC, ReactNode } from "react";
import { SettingRow } from "./SettingRow";

interface SearchableSettingRowProps {
  searchTerm?: string;
  searchMatches?: string[];
  children?: ReactNode;
  title?: string;
}

export const SearchableSettingRow: FC<SearchableSettingRowProps> = ({
  searchTerm,
  searchMatches,
  children,
  title,
}) => {
  const component = <SettingRow title={title}>{children}</SettingRow>;
  if (!searchTerm || !searchMatches || searchTerm.length === 0) {
    return component;
  }
  const upperSearchTerm = searchTerm.toLocaleUpperCase();
  const match = searchMatches.find((s) =>
    s?.toLocaleUpperCase().includes(upperSearchTerm),
  );
  if (match) {
    return component;
  }
  return null;
};
