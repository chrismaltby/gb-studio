import React, { useCallback } from "react";
import l10n from "shared/lib/lang/l10n";
import { SpriteModeSetting } from "store/features/settings/settingsState";
import settingsActions from "store/features/settings/settingsActions";
import { CardAnchor, CardHeading } from "ui/cards/Card";
import { SearchableSettingRow } from "ui/form/SearchableSettingRow";
import { SettingRowInput, SettingRowLabel } from "ui/form/SettingRow";
import { SearchableCard } from "ui/cards/SearchableCard";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { SpriteModeSelect } from "components/forms/SpriteModeSelect";

interface SettingsSectionSpritesProps {
  searchTerm: string;
}

export const SettingsSectionSprites = ({
  searchTerm,
}: SettingsSectionSpritesProps) => {
  const dispatch = useAppDispatch();

  const spriteMode = useAppSelector(
    (state) => state.project.present.settings.spriteMode,
  );

  const onChangeSpriteMode = useCallback(
    (e: SpriteModeSetting) =>
      dispatch(
        settingsActions.editSettings({
          spriteMode: e,
        }),
      ),
    [dispatch],
  );

  return (
    <SearchableCard
      searchTerm={searchTerm}
      searchMatches={[
        l10n("SETTINGS_SPRITE"),
        l10n("FIELD_DEFAULT_SPRITE_MODE"),
      ]}
    >
      <CardAnchor id="settingsSprite" />
      <CardHeading>{l10n("SETTINGS_SPRITE")}</CardHeading>

      <SearchableSettingRow
        searchTerm={searchTerm}
        searchMatches={[
          l10n("SETTINGS_SPRITE"),
          l10n("FIELD_DEFAULT_SPRITE_MODE"),
        ]}
      >
        <SettingRowLabel>{l10n("FIELD_DEFAULT_SPRITE_MODE")}</SettingRowLabel>
        <SettingRowInput>
          <SpriteModeSelect
            name="spriteMode"
            value={spriteMode}
            onChange={(value) => {
              onChangeSpriteMode(value ?? "8x16");
            }}
          />
        </SettingRowInput>
      </SearchableSettingRow>
    </SearchableCard>
  );
};
