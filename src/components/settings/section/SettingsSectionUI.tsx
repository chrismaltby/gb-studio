import React, { useCallback } from "react";
import Path from "path";
import l10n from "shared/lib/lang/l10n";
import settingsActions from "store/features/settings/settingsActions";
import { CardAnchor, CardHeading } from "ui/cards/Card";
import { SearchableSettingRow } from "ui/form/SearchableSettingRow";
import { SettingRowInput, SettingRowLabel } from "ui/form/SettingRow";
import { SearchableCard } from "ui/cards/SearchableCard";
import { FontSelect } from "components/forms/FontSelect";
import electronActions from "store/features/electron/electronActions";
import { UIAssetPreview } from "components/forms/UIAssetPreviewButton";
import { useAppDispatch, useAppSelector } from "store/hooks";

interface SettingsSectionUIProps {
  searchTerm: string;
}

export const SettingsSectionUI = ({ searchTerm }: SettingsSectionUIProps) => {
  const dispatch = useAppDispatch();

  const defaultFontId = useAppSelector(
    (state) => state.project.present.settings.defaultFontId,
  );

  const onChangeDefaultFontId = useCallback(
    (e: string) =>
      dispatch(
        settingsActions.editSettings({
          defaultFontId: e,
        }),
      ),
    [dispatch],
  );

  const openAsset = useCallback(
    (path: string) => {
      dispatch(
        electronActions.openFile({
          filename: Path.join("assets", path),
          type: "image",
        }),
      );
    },
    [dispatch],
  );

  return (
    <SearchableCard
      searchTerm={searchTerm}
      searchMatches={[
        l10n("FIELD_DEFAULT_FONT"),
        l10n("FIELD_CURSOR_IMAGE"),
        l10n("FIELD_FRAME_IMAGE"),
      ]}
    >
      <CardAnchor id="settingsUI" />
      <CardHeading>{l10n("MENU_UI_ELEMENTS")}</CardHeading>

      <SearchableSettingRow
        searchTerm={searchTerm}
        searchMatches={[l10n("FIELD_DEFAULT_FONT")]}
      >
        <SettingRowLabel>{l10n("FIELD_DEFAULT_FONT")}</SettingRowLabel>
        <SettingRowInput>
          <FontSelect
            name="defaultFont"
            value={defaultFontId || ""}
            onChange={onChangeDefaultFontId}
          />
        </SettingRowInput>
      </SearchableSettingRow>

      <SearchableSettingRow
        searchTerm={searchTerm}
        searchMatches={[l10n("FIELD_CURSOR_IMAGE")]}
      >
        <SettingRowLabel>{l10n("FIELD_CURSOR_IMAGE")}</SettingRowLabel>
        <SettingRowInput>
          <UIAssetPreview
            path="ui/cursor.png"
            onClick={() => {
              openAsset("ui/cursor.png");
            }}
          />
        </SettingRowInput>
      </SearchableSettingRow>

      <SearchableSettingRow
        searchTerm={searchTerm}
        searchMatches={[l10n("FIELD_FRAME_IMAGE")]}
      >
        <SettingRowLabel>{l10n("FIELD_FRAME_IMAGE")}</SettingRowLabel>
        <SettingRowInput>
          <UIAssetPreview
            path="ui/frame.png"
            onClick={() => {
              openAsset("ui/frame.png");
            }}
          />
        </SettingRowInput>
      </SearchableSettingRow>
    </SearchableCard>
  );
};
