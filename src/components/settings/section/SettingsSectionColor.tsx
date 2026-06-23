import React, { useCallback } from "react";
import l10n from "shared/lib/lang/l10n";
import { PaletteSelect } from "components/forms/PaletteSelect";
import { Button } from "ui/buttons/Button";
import { CardAnchor, CardButtons, CardHeading } from "ui/cards/Card";
import { SearchableSettingRow } from "ui/form/SearchableSettingRow";
import { SettingRowInput, SettingRowLabel } from "ui/form/SettingRow";
import { SearchableCard } from "ui/cards/SearchableCard";
import { FormInfo } from "ui/form/FormInfo";
import { FormField } from "ui/form/layout/FormLayout";
import { FixedSpacer } from "ui/spacing/Spacing";
import { ColorModeSelect } from "components/forms/ColorModeSelect";
import { ColorCorrectionSelect } from "components/forms/ColorCorrectionSelect";
import { AutoTileFlipSelect } from "components/forms/AutoTileFlipSelect";
import { DMGPaletteSelectButton } from "components/forms/DMGPaletteSelectButton";
import { defaultProjectSettings } from "consts";
import { useAppDispatch, useAppSelector } from "store/hooks";
import settingsActions from "store/features/settings/settingsActions";
import {
  ColorCorrectionSetting,
  ColorModeSetting,
  MonoBGPPalette,
  MonoOBJPalette,
} from "shared/lib/resources/types";
import { NavigationSection } from "store/features/navigation/navigationState";
import navigationActions from "store/features/navigation/navigationActions";

interface SettingsSectionColorProps {
  searchTerm: string;
}

export const SettingsSectionColor = ({
  searchTerm,
}: SettingsSectionColorProps) => {
  const dispatch = useAppDispatch();

  const colorMode = useAppSelector(
    (state) => state.project.present.settings.colorMode,
  );

  const colorCorrection = useAppSelector(
    (state) => state.project.present.settings.colorCorrection,
  );

  const autoTileFlipEnabled = useAppSelector(
    (state) => state.project.present.settings.autoTileFlipEnabled,
  );

  const defaultMonoBGP = useAppSelector(
    (state) => state.project.present.settings.defaultMonoBGP,
  );

  const defaultMonoOBP0 = useAppSelector(
    (state) => state.project.present.settings.defaultMonoOBP0,
  );

  const defaultMonoOBP1 = useAppSelector(
    (state) => state.project.present.settings.defaultMonoOBP1,
  );

  const defaultBackgroundPaletteIds = useAppSelector(
    (state) => state.project.present.settings.defaultBackgroundPaletteIds,
  );

  const defaultSpritePaletteIds = useAppSelector(
    (state) => state.project.present.settings.defaultSpritePaletteIds,
  );

  const sgbEnabled = useAppSelector(
    (state) => state.project.present.settings.sgbEnabled,
  );

  const colorEnabled = colorMode !== "mono";

  const setSection = useCallback(
    (section: NavigationSection) => {
      dispatch(navigationActions.setSection(section));
    },
    [dispatch],
  );

  const onChangeColorMode = useCallback(
    (e: ColorModeSetting) =>
      dispatch(settingsActions.editSettings({ colorMode: e })),
    [dispatch],
  );

  const onChangeColorCorrection = useCallback(
    (e: ColorCorrectionSetting) =>
      dispatch(settingsActions.editSettings({ colorCorrection: e })),
    [dispatch],
  );

  const onChangeAutoTileFlip = useCallback(
    (e: boolean) =>
      dispatch(settingsActions.editSettings({ autoTileFlipEnabled: e })),
    [dispatch],
  );

  const onEditMonoBGP = useCallback(
    (palette: MonoBGPPalette) =>
      dispatch(settingsActions.editSettings({ defaultMonoBGP: palette })),
    [dispatch],
  );

  const onEditMonoOBP0 = useCallback(
    (palette: MonoOBJPalette) =>
      dispatch(settingsActions.editSettings({ defaultMonoOBP0: palette })),
    [dispatch],
  );

  const onEditMonoOBP1 = useCallback(
    (palette: MonoOBJPalette) =>
      dispatch(settingsActions.editSettings({ defaultMonoOBP1: palette })),

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

  const onEditSpritePaletteId = useCallback(
    (index: number, e: string) => {
      const paletteIds = defaultSpritePaletteIds
        ? [...defaultSpritePaletteIds]
        : [];
      paletteIds[index] = e;
      dispatch(
        settingsActions.editSettings({
          defaultSpritePaletteIds: [
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
    [defaultSpritePaletteIds, dispatch],
  );

  return (
    <SearchableCard
      searchTerm={searchTerm}
      searchMatches={[
        l10n("FIELD_EXPORT_IN_COLOR"),
        colorMode !== "mono" ? l10n("FIELD_DEFAULT_BACKGROUND_PALETTES") : "",
        colorMode !== "mono" ? l10n("FIELD_DEFAULT_SPRITE_PALETTES") : "",
        l10n("FIELD_DEFAULT_MONOCHROME_PALETTES"),
        l10n("FIELD_COLOR_CORRECTION"),
        l10n("FIELD_AUTO_TILE_FLIP"),
      ]}
    >
      <CardAnchor id="settingsColor" />
      <CardHeading>{l10n("SETTINGS_COLOR")}</CardHeading>

      <SearchableSettingRow
        searchTerm={searchTerm}
        searchMatches={[l10n("FIELD_COLOR_MODE")]}
      >
        <SettingRowLabel>{l10n("FIELD_COLOR_MODE")}</SettingRowLabel>
        <SettingRowInput>
          <ColorModeSelect
            name="colorMode"
            value={colorMode}
            onChange={onChangeColorMode}
          />
          <FormInfo>
            {colorMode === "mono" && l10n("FIELD_COLOR_MODE_MONO_NOTE")}
            {colorMode === "mixed" && l10n("FIELD_COLOR_MODE_MIXED_NOTE")}
            {colorMode === "color" &&
              l10n("FIELD_COLOR_MODE_COLOR_LIMITATIONS_NOTE")}
            {colorMode === "color" && (
              <>
                <br />
                <br />
                {l10n("FIELD_COLOR_MODE_COLOR_NOTE")}
              </>
            )}
            <br />
            <br />
            {l10n("FIELD_SUPPORTED_PLATFORMS")}:
            <ul style={{ marginTop: 5, marginBottom: 0 }}>
              {colorMode !== "color" && (
                <li>
                  GB{" "}
                  {colorMode !== "mono"
                    ? `(${l10n("FIELD_MONOCHROME_ONLY")})`
                    : ""}
                </li>
              )}
              <li>GB Color</li>
              {colorMode !== "color" && <li>Super GB</li>}
              <li>Analogue Pocket</li>
            </ul>
          </FormInfo>
        </SettingRowInput>
      </SearchableSettingRow>

      {colorEnabled && (
        <>
          <SearchableSettingRow
            searchTerm={searchTerm}
            searchMatches={[l10n("FIELD_COLOR_CORRECTION")]}
          >
            <SettingRowLabel>{l10n("FIELD_COLOR_CORRECTION")}</SettingRowLabel>
            <SettingRowInput>
              <ColorCorrectionSelect
                name="colorCorrection"
                value={colorCorrection}
                onChange={onChangeColorCorrection}
              />
              <FormInfo>
                {colorCorrection === "default" &&
                  l10n("FIELD_COLOR_CORRECTION_ENABLED_DEFAULT_INFO")}
                {colorCorrection === "none" &&
                  l10n("FIELD_COLOR_CORRECTION_NONE_INFO")}
              </FormInfo>
            </SettingRowInput>
          </SearchableSettingRow>

          <SearchableSettingRow
            searchTerm={searchTerm}
            searchMatches={[l10n("FIELD_AUTO_TILE_FLIP")]}
          >
            <SettingRowLabel>{l10n("FIELD_AUTO_TILE_FLIP")}</SettingRowLabel>
            <SettingRowInput>
              <AutoTileFlipSelect
                value={autoTileFlipEnabled}
                onChange={onChangeAutoTileFlip}
              />
              <FormInfo>
                {l10n("FIELD_AUTO_TILE_FLIP_DESC")}
                {colorMode !== "color" && (
                  <>
                    <br />
                    <br />
                    {l10n("FIELD_AUTO_TILE_FLIP_SUPPORT_DESC")}
                  </>
                )}
              </FormInfo>
            </SettingRowInput>
          </SearchableSettingRow>
        </>
      )}

      <SearchableSettingRow
        searchTerm={searchTerm}
        searchMatches={[l10n("FIELD_DEFAULT_MONOCHROME_PALETTES")]}
      >
        <SettingRowLabel>
          {l10n("FIELD_DEFAULT_MONOCHROME_PALETTES")}
        </SettingRowLabel>
        <SettingRowInput>
          <FormField name="defaultMonoBGP">
            <DMGPaletteSelectButton
              name="bgp"
              label={"BGP"}
              variant="select"
              value={defaultMonoBGP}
              isSpritePalette={false}
              onChange={onEditMonoBGP}
              defaultValue={defaultProjectSettings.defaultMonoBGP}
            />
          </FormField>
          <FormInfo>{l10n("FIELD_MONOCHROME_BGP_NOTE")}</FormInfo>
          <FormField name="defaultMonoOBP0">
            <DMGPaletteSelectButton
              name="obp0"
              label={"OBP0"}
              variant="select"
              value={defaultMonoOBP0}
              isSpritePalette={true}
              onChange={onEditMonoOBP0}
              defaultValue={defaultProjectSettings.defaultMonoOBP0}
            />
          </FormField>
          <FixedSpacer height={3} />
          <FormField name="defaultMonoOBP1">
            <DMGPaletteSelectButton
              name="obp1"
              label={"OBP1"}
              variant="select"
              value={defaultMonoOBP1}
              isSpritePalette={true}
              onChange={onEditMonoOBP1}
              defaultValue={defaultProjectSettings.defaultMonoOBP1}
            />
          </FormField>
          <FormInfo>{l10n("FIELD_MONOCHROME_OBP_NOTE")}</FormInfo>
        </SettingRowInput>
      </SearchableSettingRow>

      {colorEnabled && (
        <>
          <SearchableSettingRow
            searchTerm={searchTerm}
            searchMatches={[l10n("FIELD_DEFAULT_BACKGROUND_PALETTES")]}
          >
            <SettingRowLabel>
              {l10n("FIELD_DEFAULT_BACKGROUND_PALETTES")}
              {sgbEnabled && (
                <FormInfo>{l10n("FIELD_SGB_PALETTES_NOTE")}</FormInfo>
              )}
            </SettingRowLabel>
            <SettingRowInput>
              <div>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                  <FormField key={index} name={`scenePalette${index}`}>
                    <PaletteSelect
                      name={`scenePalette${index}`}
                      prefix={`${index + 1}:`}
                      value={
                        (defaultBackgroundPaletteIds &&
                          defaultBackgroundPaletteIds[index]) ||
                        ""
                      }
                      onChange={(e: string) => {
                        onEditPaletteId(index, e);
                      }}
                    />
                    {index !== 7 && <FixedSpacer height={3} />}
                    {index === 7 && (
                      <FormInfo>{l10n("FIELD_UI_PALETTE_NOTE")}</FormInfo>
                    )}
                  </FormField>
                ))}
              </div>
            </SettingRowInput>
          </SearchableSettingRow>

          <SearchableSettingRow
            searchTerm={searchTerm}
            searchMatches={[l10n("FIELD_DEFAULT_SPRITE_PALETTES")]}
          >
            <SettingRowLabel>
              {l10n("FIELD_DEFAULT_SPRITE_PALETTES")}
            </SettingRowLabel>
            <SettingRowInput>
              <div key={JSON.stringify(defaultSpritePaletteIds)}>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                  <FormField key={index} name={`spritePalette${index}`}>
                    <PaletteSelect
                      name={`spritePalette${index}`}
                      prefix={`${index + 1}:`}
                      value={
                        (defaultSpritePaletteIds &&
                          defaultSpritePaletteIds[index]) ||
                        ""
                      }
                      type="sprite"
                      onChange={(e: string) => {
                        onEditSpritePaletteId(index, e);
                      }}
                    />
                    {index !== 7 && <FixedSpacer height={3} />}
                    {index === 7 && (
                      <FormInfo>{l10n("FIELD_EMOTE_PALETTE_NOTE")}</FormInfo>
                    )}
                  </FormField>
                ))}
              </div>
            </SettingRowInput>
          </SearchableSettingRow>
          {!searchTerm && (
            <CardButtons>
              <Button onClick={() => setSection("palettes")}>
                {l10n("FIELD_EDIT_PALETTES")}
              </Button>
            </CardButtons>
          )}
        </>
      )}
    </SearchableCard>
  );
};
