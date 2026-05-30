import React, { useCallback } from "react";
import Path from "path";
import l10n from "shared/lib/lang/l10n";
import { castEventToBool } from "renderer/lib/helpers/castEventValue";
import { PaletteSelect } from "components/forms/PaletteSelect";
import settingsActions from "store/features/settings/settingsActions";
import { Checkbox } from "ui/form/Checkbox";
import { CardAnchor, CardHeading } from "ui/cards/Card";
import { SearchableSettingRow } from "ui/form/SearchableSettingRow";
import { SettingRowInput, SettingRowLabel } from "ui/form/SettingRow";
import { SearchableCard } from "ui/cards/SearchableCard";
import { FormInfo } from "ui/form/FormInfo";
import electronActions from "store/features/electron/electronActions";
import { UIAssetPreview } from "components/forms/UIAssetPreviewButton";
import { FormField } from "ui/form/layout/FormLayout";
import { FixedSpacer } from "ui/spacing/Spacing";
import { useAppDispatch, useAppSelector } from "store/hooks";

interface SettingsSectionSGBProps {
  searchTerm: string;
}

export const SettingsSectionSGB = ({ searchTerm }: SettingsSectionSGBProps) => {
  const dispatch = useAppDispatch();

  const colorMode = useAppSelector(
    (state) => state.project.present.settings.colorMode,
  );
  const sgbEnabled = useAppSelector(
    (state) => state.project.present.settings.sgbEnabled,
  );
  const defaultBackgroundPaletteIds = useAppSelector(
    (state) => state.project.present.settings.defaultBackgroundPaletteIds,
  );

  const colorEnabled = colorMode !== "mono";

  const onChangeSGBEnabled = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      dispatch(
        settingsActions.editSettings({
          sgbEnabled: castEventToBool(e),
        }),
      ),
    [dispatch],
  );

  const onEditPaletteId = useCallback(
    (index: number, e: string) => {
      const paletteIds = defaultBackgroundPaletteIds
        ? [...defaultBackgroundPaletteIds]
        : [];
      paletteIds[index] = e;
      dispatch(
        settingsActions.editSettings({
          defaultBackgroundPaletteIds: [
            paletteIds[0],
            paletteIds[1],
            paletteIds[2],
            paletteIds[3],
            paletteIds[4],
            paletteIds[5],
            paletteIds[6],
            paletteIds[7],
          ],
        }),
      );
    },
    [defaultBackgroundPaletteIds, dispatch],
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
        "SGB",
        l10n("FIELD_ENABLE_SGB"),
        l10n("FIELD_BORDER_IMAGE"),
      ]}
    >
      <CardAnchor id="settingsSuper" />
      <CardHeading>{l10n("SETTINGS_SGB")}</CardHeading>
      <SearchableSettingRow
        searchTerm={searchTerm}
        searchMatches={["SGB", l10n("FIELD_ENABLE_SGB")]}
      >
        <SettingRowLabel>{l10n("FIELD_ENABLE_SGB")}</SettingRowLabel>
        <SettingRowInput>
          {colorMode === "color" ? (
            <FormInfo>{l10n("FIELD_SGB_UNAVAILABLE")}</FormInfo>
          ) : (
            <Checkbox
              id="sgbEnabled"
              name="sgbEnabled"
              checked={sgbEnabled}
              onChange={onChangeSGBEnabled}
            />
          )}
        </SettingRowInput>
      </SearchableSettingRow>

      {sgbEnabled && colorMode !== "color" && (
        <>
          <SearchableSettingRow
            searchTerm={searchTerm}
            searchMatches={[l10n("FIELD_DEFAULT_PALETTES")]}
          >
            <SettingRowLabel>
              {l10n("FIELD_DEFAULT_PALETTES")}
              {colorEnabled && (
                <FormInfo>{l10n("FIELD_SGB_PALETTES_NOTE")}</FormInfo>
              )}
            </SettingRowLabel>
            <SettingRowInput>
              <div>
                {[4, 5, 6, 7].map((index) => (
                  <FormField key={index} name={`scenePalette${index}`}>
                    <PaletteSelect
                      name={`scenePalette${index}`}
                      prefix={`${index - 3}:`}
                      value={
                        (defaultBackgroundPaletteIds &&
                          defaultBackgroundPaletteIds[index]) ||
                        ""
                      }
                      onChange={(e: string) => {
                        onEditPaletteId(index, e);
                      }}
                      type={index !== 6 ? "sgb" : "tile"}
                    />

                    {index !== 4 && index !== 6 && index !== 7 && (
                      <FixedSpacer height={3} />
                    )}
                    {index === 4 && (
                      <FormInfo>
                        {l10n("FIELD_DEFAULT_SGB_PALETTE_NOTE")}
                      </FormInfo>
                    )}

                    {index === 6 && (
                      <FormInfo>
                        {l10n("FIELD_COLOR_0_SGB_PALETTE_NOTE")}
                      </FormInfo>
                    )}

                    {index === 7 && colorMode !== "mono" && (
                      <FormInfo>{l10n("FIELD_UI_SGB_PALETTE_NOTE")}</FormInfo>
                    )}
                  </FormField>
                ))}
              </div>
            </SettingRowInput>
          </SearchableSettingRow>

          <SearchableSettingRow
            searchTerm={searchTerm}
            searchMatches={[l10n("FIELD_BORDER_IMAGE")]}
          >
            <SettingRowLabel>
              {l10n("FIELD_BORDER_IMAGE")}
              <FormInfo>
                {l10n("FIELD_UPDATE_BY_EDITING")}
                <br />
                /assets/sgb/border.png
              </FormInfo>
            </SettingRowLabel>
            <SettingRowInput>
              <div>
                <FormField name="sgbBorder">
                  <UIAssetPreview
                    path="sgb/border.png"
                    onClick={() => {
                      openAsset("sgb/border.png");
                    }}
                  />
                </FormField>
              </div>
            </SettingRowInput>
          </SearchableSettingRow>
        </>
      )}
    </SearchableCard>
  );
};
