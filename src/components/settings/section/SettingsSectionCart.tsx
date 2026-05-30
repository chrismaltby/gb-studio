import React from "react";
import l10n from "shared/lib/lang/l10n";
import { CardAnchor, CardHeading } from "ui/cards/Card";
import { SearchableCard } from "ui/cards/SearchableCard";
import CartSettingsEditor from "components/settings/CartSettingsEditor";

interface SettingsSectionCartProps {
  searchTerm: string;
}

export const SettingsSectionCart = ({
  searchTerm,
}: SettingsSectionCartProps) => {
  return (
    <SearchableCard
      searchTerm={searchTerm}
      searchMatches={[l10n("SETTINGS_CART_TYPE")]}
    >
      <CardAnchor id="settingsCartType" />
      <CardHeading>{l10n("SETTINGS_CART_TYPE")}</CardHeading>
      <CartSettingsEditor searchTerm={searchTerm} />
    </SearchableCard>
  );
};
