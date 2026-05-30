import React from "react";
import l10n from "shared/lib/lang/l10n";
import CustomControlsPicker from "components/forms/CustomControlsPicker";
import { CardAnchor, CardHeading } from "ui/cards/Card";
import { SearchableCard } from "ui/cards/SearchableCard";

interface SettingsSectionControlsProps {
  searchTerm: string;
}

export const SettingsSectionControls = ({
  searchTerm,
}: SettingsSectionControlsProps) => {
  return (
    <SearchableCard
      searchTerm={searchTerm}
      searchMatches={[
        l10n("FIELD_DIRECTION_UP"),
        l10n("FIELD_DIRECTION_DOWN"),
        l10n("FIELD_DIRECTION_LEFT"),
        l10n("FIELD_DIRECTION_RIGHT"),
        "A",
        "B",
        "Start",
        "Select",
      ]}
    >
      <CardAnchor id="settingsControls" />
      <CardHeading>{l10n("SETTINGS_CONTROLS")}</CardHeading>
      <CustomControlsPicker searchTerm={searchTerm} />
    </SearchableCard>
  );
};
