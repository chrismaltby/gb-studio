import React, {
  FC,
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import Path from "path";
import l10n, { L10NKey } from "shared/lib/lang/l10n";
import { castEventToBool } from "renderer/lib/helpers/castEventValue";
import CustomControlsPicker from "components/forms/CustomControlsPicker";
import { PaletteSelect } from "components/forms/PaletteSelect";
import { Button } from "ui/buttons/Button";
import {
  ColorModeSetting,
  MusicDriverSetting,
  SettingsState,
} from "store/features/settings/settingsState";
import settingsActions from "store/features/settings/settingsActions";
import navigationActions from "store/features/navigation/navigationActions";
import EngineFieldsEditor from "components/settings/EngineFieldsEditor";
import { Checkbox } from "ui/form/Checkbox";
import { Input } from "ui/form/Input";
import { useGroupedEngineFields } from "components/settings/useGroupedEngineFields";
import { NavigationSection } from "store/features/navigation/navigationState";
import { Textarea } from "ui/form/Textarea";
import useWindowSize from "ui/hooks/use-window-size";
import {
  SettingsContentColumn,
  SettingsMenuColumn,
  SettingsMenuItem,
  SettingsPageWrapper,
  SettingsSearchWrapper,
} from "components/settings/SettingsLayout";
import { CardAnchor, CardButtons, CardHeading } from "ui/cards/Card";
import { SearchableSettingRow } from "ui/form/SearchableSettingRow";
import { SettingRowInput, SettingRowLabel } from "ui/form/SettingRow";
import { SearchableCard } from "ui/cards/SearchableCard";
import { FontSelect } from "components/forms/FontSelect";
import { getOptions as getSceneTypeOptions } from "components/forms/SceneTypeSelect";
import { SpriteSheetSelect } from "components/forms/SpriteSheetSelect";
import { ColorAnimationText } from "components/settings/ColorAnimationText";
import { MusicDriverSelect } from "components/forms/MusicDriverSelect";
import { FormInfo } from "ui/form/FormInfo";
import electronActions from "store/features/electron/electronActions";
import CartSettingsEditor from "components/settings/CartSettingsEditor";
import { UIAssetPreview } from "components/forms/UIAssetPreviewButton";
import { FormField } from "ui/form/FormLayout";
import { FixedSpacer } from "ui/spacing/Spacing";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { ColorModeSelect } from "components/forms/ColorModeSelect";

const SettingsPage: FC = () => {
  const dispatch = useAppDispatch();
  const projectRoot = useAppSelector((state) => state.document.root);
  const settings = useAppSelector((state) => state.project.present.settings);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [scrollToId, setScrollToId] = useState<string>("");
  const groupedFields = useGroupedEngineFields();
  const editSettings = useCallback(
    (patch: Partial<SettingsState>) => {
      dispatch(settingsActions.editSettings(patch));
    },
    [dispatch]
  );
  const setSection = useCallback(
    (section: NavigationSection) => {
      dispatch(navigationActions.setSection(section));
    },
    [dispatch]
  );
  const sceneTypes = useMemo(getSceneTypeOptions, []);
  const windowSize = useWindowSize();
  const showMenu = (windowSize.width || 0) >= 750;

  useLayoutEffect(() => {
    if (scrollToId) {
      const el = document.getElementById(scrollToId);
      if (el) {
        el.scrollIntoView();
      }
    }
  }, [scrollToId]);

  const {
    colorMode,
    sgbEnabled,
    customHead,
    defaultBackgroundPaletteIds,
    defaultSpritePaletteIds,
    defaultFontId,
    defaultPlayerSprites,
    musicDriver,
  } = settings;

  const colorEnabled = colorMode !== "mono";

  const onSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.currentTarget.value);
  };

  const onMenuItem = (id: string) => () => {
    const el = document.getElementById(id);
    if (el) {
      setScrollToId(id);
    } else {
      setSearchTerm("");
      setScrollToId(id);
    }
  };

  const onChangeSettingProp = useCallback(
    <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
      dispatch(
        settingsActions.editSettings({
          [key]: value,
        })
      );
    },
    [dispatch]
  );

  const onChangeColorMode = useCallback(
    (e: ColorModeSetting) => onChangeSettingProp("colorMode", e),
    [onChangeSettingProp]
  );

  const onChangeSGBEnabled = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeSettingProp("sgbEnabled", castEventToBool(e)),
    [onChangeSettingProp]
  );

  const onChangeDefaultFontId = useCallback(
    (e: string) => onChangeSettingProp("defaultFontId", e),
    [onChangeSettingProp]
  );

  const onChangeMusicDriver = useCallback(
    (e: MusicDriverSetting) => onChangeSettingProp("musicDriver", e),
    [onChangeSettingProp]
  );

  const onChangeCustomHead = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      onChangeSettingProp("customHead", e.currentTarget.value),
    [onChangeSettingProp]
  );

  const onEditPaletteId = useCallback(
    (index: number, e: string) => {
      const paletteIds = defaultBackgroundPaletteIds
        ? [...defaultBackgroundPaletteIds]
        : [];
      paletteIds[index] = e;
      editSettings({
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
      });
    },
    [defaultBackgroundPaletteIds, editSettings]
  );

  const onEditSpritePaletteId = useCallback(
    (index: number, e: string) => {
      const paletteIds = defaultSpritePaletteIds
        ? [...defaultSpritePaletteIds]
        : [];
      paletteIds[index] = e;
      editSettings({
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
      });
    },
    [defaultSpritePaletteIds, editSettings]
  );

  const onEditDefaultPlayerSprites = useCallback(
    (sceneType: string, spriteSheetId: string) => {
      console.log("onEditDefaultPlayerSprites", sceneType, spriteSheetId);
      dispatch(
        settingsActions.setSceneTypeDefaultPlayerSprite({
          sceneType,
          spriteSheetId,
        })
      );
    },
    [dispatch]
  );

  const openAsset = useCallback(
    (path: string) => {
      dispatch(
        electronActions.openFile({
          filename: Path.join(projectRoot, "assets", path),
          type: "image",
        })
      );
    },
    [dispatch, projectRoot]
  );

  return (
    <SettingsPageWrapper>
      {showMenu && (
        <SettingsMenuColumn>
          <SearchableCard>
            <SettingsSearchWrapper>
              <Input
                autoFocus
                type="search"
                placeholder={l10n("FIELD_SEARCH_SETTINGS")}
                value={searchTerm}
                onChange={onSearch}
              />
            </SettingsSearchWrapper>
            <SettingsMenuItem onClick={onMenuItem("settingsColor")}>
              {l10n("SETTINGS_COLOR")}
            </SettingsMenuItem>
            <SettingsMenuItem onClick={onMenuItem("settingsSuper")}>
              {l10n("SETTINGS_SGB")}
            </SettingsMenuItem>
            <SettingsMenuItem onClick={onMenuItem("settingsPlayer")}>
              {l10n("SETTINGS_PLAYER_DEFAULT_SPRITES")}
            </SettingsMenuItem>
            <SettingsMenuItem onClick={onMenuItem("settingsUI")}>
              {l10n("MENU_UI_ELEMENTS")}
            </SettingsMenuItem>
            <SettingsMenuItem onClick={onMenuItem("settingsMusic")}>
              {l10n("SETTINGS_MUSIC")}
            </SettingsMenuItem>
            {groupedFields.map((group) => (
              <SettingsMenuItem
                key={group.name}
                onClick={onMenuItem(`settings${group.name}`)}
              >
                {l10n(group.name as L10NKey)}
              </SettingsMenuItem>
            ))}
            <SettingsMenuItem onClick={onMenuItem("settingsControls")}>
              {l10n("SETTINGS_CONTROLS")}
            </SettingsMenuItem>
            <SettingsMenuItem onClick={onMenuItem("settingsCartType")}>
              {l10n("SETTINGS_CART_TYPE")}
            </SettingsMenuItem>
            <SettingsMenuItem onClick={onMenuItem("settingsCustomHead")}>
              {l10n("SETTINGS_CUSTOM_HEADER")}
            </SettingsMenuItem>
          </SearchableCard>
        </SettingsMenuColumn>
      )}
      <SettingsContentColumn>
        <SearchableCard
          searchTerm={searchTerm}
          searchMatches={[
            l10n("FIELD_EXPORT_IN_COLOR"),
            l10n("FIELD_DEFAULT_BACKGROUND_PALETTES"),
            l10n("FIELD_DEFAULT_SPRITE_PALETTES"),
          ]}
        >
          <CardAnchor id="settingsColor" />
          <CardHeading>
            <ColorAnimationText>{l10n("SETTINGS_COLOR")}</ColorAnimationText>
          </CardHeading>

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
                searchMatches={[l10n("FIELD_DEFAULT_BACKGROUND_PALETTES")]}
              >
                <SettingRowLabel>
                  {l10n("FIELD_DEFAULT_BACKGROUND_PALETTES")}
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
                        {sgbEnabled && colorMode !== "color" && index === 4 && (
                          <FormInfo>{l10n("FIELD_SGB_PALETTE_NOTE")}</FormInfo>
                        )}
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
                          onChange={(e: string) => {
                            onEditSpritePaletteId(index, e);
                          }}
                        />
                        {index !== 7 && <FixedSpacer height={3} />}
                        {index === 7 && (
                          <FormInfo>
                            {l10n("FIELD_EMOTE_PALETTE_NOTE")}
                          </FormInfo>
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
                searchMatches={[l10n("FIELD_DEFAULT_PALETTE")]}
              >
                <SettingRowLabel>
                  {l10n("FIELD_DEFAULT_PALETTE")}
                </SettingRowLabel>
                <SettingRowInput>
                  <div>
                    <FormField name="scenePalette">
                      <PaletteSelect
                        name="scenePalette"
                        value={
                          (defaultBackgroundPaletteIds &&
                            defaultBackgroundPaletteIds[4]) ||
                          ""
                        }
                        onChange={(e: string) => {
                          onEditPaletteId(4, e);
                        }}
                      />
                      {colorEnabled && (
                        <FormInfo>{l10n("FIELD_SGB_PALETTE_NOTE")}</FormInfo>
                      )}
                    </FormField>
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

        <SearchableCard
          searchTerm={searchTerm}
          searchMatches={[l10n("SETTINGS_PLAYER_DEFAULT_SPRITES")]}
        >
          <CardAnchor id="settingsPlayer" />
          <CardHeading>{l10n("SETTINGS_PLAYER_DEFAULT_SPRITES")}</CardHeading>
          {sceneTypes
            .filter((s) => s.value !== "LOGO")
            .map((sceneType) => (
              <SearchableSettingRow
                key={sceneType.value}
                searchTerm={searchTerm}
                searchMatches={[sceneType.label]}
              >
                <SettingRowLabel>{sceneType.label}</SettingRowLabel>
                <SettingRowInput>
                  <SpriteSheetSelect
                    name={`defaultPlayerSprite__${sceneType.value}`}
                    value={defaultPlayerSprites[sceneType.value] || ""}
                    optional
                    optionalLabel={l10n("FIELD_NONE")}
                    onChange={(value) =>
                      onEditDefaultPlayerSprites(sceneType.value, value)
                    }
                  />
                </SettingRowInput>
              </SearchableSettingRow>
            ))}
        </SearchableCard>

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

        <SearchableCard
          searchTerm={searchTerm}
          searchMatches={[l10n("SETTINGS_MUSIC"), l10n("FIELD_MUSIC_FORMAT")]}
        >
          <CardAnchor id="settingsMusic" />
          <CardHeading>{l10n("SETTINGS_MUSIC")}</CardHeading>

          <SearchableSettingRow
            searchTerm={searchTerm}
            searchMatches={[l10n("FIELD_MUSIC_FORMAT")]}
          >
            <SettingRowLabel>{l10n("FIELD_MUSIC_FORMAT")}</SettingRowLabel>
            <SettingRowInput>
              <FormField name="musicDriver">
                <MusicDriverSelect
                  name="musicDriver"
                  value={musicDriver || ""}
                  onChange={onChangeMusicDriver}
                />
                {musicDriver !== "gbt" ? (
                  <FormInfo>{l10n("FIELD_HUGE_DRIVER_NOTE")}</FormInfo>
                ) : (
                  <FormInfo>{l10n("FIELD_GBT_PLAYER_NOTE")}</FormInfo>
                )}
              </FormField>
            </SettingRowInput>
          </SearchableSettingRow>
        </SearchableCard>

        <EngineFieldsEditor searchTerm={searchTerm} />

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

        <SearchableCard
          searchTerm={searchTerm}
          searchMatches={[l10n("SETTINGS_CART_TYPE")]}
        >
          <CardAnchor id="settingsCartType" />
          <CardHeading>{l10n("SETTINGS_CART_TYPE")}</CardHeading>
          <CartSettingsEditor searchTerm={searchTerm} />
        </SearchableCard>

        <SearchableCard
          searchTerm={searchTerm}
          searchMatches={[l10n("FIELD_CUSTOM_HTML_HEADER")]}
        >
          <CardAnchor id="settingsCustomHead" />
          <CardHeading>{l10n("SETTINGS_CUSTOM_HEADER")}</CardHeading>
          <SearchableSettingRow
            searchTerm={searchTerm}
            searchMatches={[l10n("FIELD_CUSTOM_HTML_HEADER")]}
          >
            <SettingRowLabel>
              {l10n("FIELD_CUSTOM_HTML_HEADER")}
            </SettingRowLabel>
            <SettingRowInput>
              <pre>
                &lt;!DOCTYPE html&gt;{"\n"}
                &lt;html&gt;{"\n  "}
                &lt;head&gt;{"\n  "}
                ...
              </pre>
              <Textarea
                id="customHead"
                value={customHead || ""}
                placeholder={
                  'e.g. <style type"text/css">\nbody {\n  background-color: darkgreen;\n}\n</style>'
                }
                onChange={onChangeCustomHead}
                rows={15}
                style={{ fontFamily: "monospace" }}
              />
              <pre>
                {"  "}&lt;/head&gt;{"\n  "}
                &lt;body&gt;{"\n  "}
                ...{"\n  "}
                &lt;body&gt;{"\n"}
                &lt;html&gt;
              </pre>
            </SettingRowInput>
          </SearchableSettingRow>
        </SearchableCard>
      </SettingsContentColumn>
    </SettingsPageWrapper>
  );
};

export default SettingsPage;
