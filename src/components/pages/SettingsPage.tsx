import React, { useCallback, useRef, useState } from "react";
import Path from "path";
import l10n, { L10NKey } from "shared/lib/lang/l10n";
import { castEventToBool } from "renderer/lib/helpers/castEventValue";
import CustomControlsPicker from "components/forms/CustomControlsPicker";
import { PaletteSelect } from "components/forms/PaletteSelect";
import {
  SettingsState,
  SpriteModeSetting,
} from "store/features/settings/settingsState";
import settingsActions from "store/features/settings/settingsActions";
import EngineFieldsEditor from "components/settings/EngineFieldsEditor";
import { Checkbox } from "ui/form/Checkbox";
import { Input } from "ui/form/Input";
import { useGroupedEngineFields } from "components/settings/useGroupedEngineFields";
import useWindowSize from "ui/hooks/use-window-size";
import {
  SettingsContentColumn,
  SettingsMenuColumn,
  SettingsMenuItem,
  SettingsPageWrapper,
  SettingsSearchWrapper,
} from "components/settings/SettingsLayout";
import { CardAnchor, CardHeading } from "ui/cards/Card";
import { SearchableSettingRow } from "ui/form/SearchableSettingRow";
import { SettingRowInput, SettingRowLabel } from "ui/form/SettingRow";
import { SearchableCard } from "ui/cards/SearchableCard";
import { FontSelect } from "components/forms/FontSelect";
import { FormInfo } from "ui/form/FormInfo";
import electronActions from "store/features/electron/electronActions";
import CartSettingsEditor from "components/settings/CartSettingsEditor";
import { UIAssetPreview } from "components/forms/UIAssetPreviewButton";
import { FormField } from "ui/form/layout/FormLayout";
import { FixedSpacer } from "ui/spacing/Spacing";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { SpriteModeSelect } from "components/forms/SpriteModeSelect";
import SceneTypesSettingsCard from "components/settings/SceneTypesSettingsCard";
import editorActions from "store/features/editor/editorActions";
import { useRestoreScroll } from "ui/hooks/use-restore-scroll";
import { useSaveScroll } from "ui/hooks/use-save-scroll";
import { SettingsSectionColor } from "components/settings/section/SettingsSectionColor";
import { SettingsSectionWeb } from "components/settings/section/SettingsSectionWeb";
import { SettingsSectionBuild } from "components/settings/section/SettingsSectionBuild";

const SettingsPage = () => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.project.present.settings);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const groupedFields = useGroupedEngineFields();
  const editSettings = useCallback(
    (patch: Partial<SettingsState>) => {
      dispatch(settingsActions.editSettings(patch));
    },
    [dispatch],
  );
  const windowSize = useWindowSize();
  const showMenu = (windowSize.width || 0) >= 750;

  const setScrollToId = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView();
    }
  }, []);

  const {
    colorMode,
    sgbEnabled,
    defaultBackgroundPaletteIds,
    defaultFontId,
    spriteMode,
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
        }),
      );
    },
    [dispatch],
  );

  const onChangeSGBEnabled = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeSettingProp("sgbEnabled", castEventToBool(e)),
    [onChangeSettingProp],
  );

  const onChangeSpriteMode = useCallback(
    (e: SpriteModeSetting) => onChangeSettingProp("spriteMode", e),
    [onChangeSettingProp],
  );

  const onChangeDefaultFontId = useCallback(
    (e: string) => onChangeSettingProp("defaultFontId", e),
    [onChangeSettingProp],
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
    [defaultBackgroundPaletteIds, editSettings],
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const settingsScrollTop = useAppSelector(
    (state) => state.editor.settingsScrollTop,
  );

  useSaveScroll(
    scrollRef,
    (scrollTop) => {
      dispatch(editorActions.setSettingsScrollTop(scrollTop));
    },
    250,
  );

  useRestoreScroll(scrollRef, settingsScrollTop, {
    behavior: "auto",
  });

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
            <SettingsMenuItem onClick={onMenuItem("settingsSceneTypes")}>
              {l10n("FIELD_SCENE_TYPES")}
            </SettingsMenuItem>
            {groupedFields.map((group) => (
              <SettingsMenuItem
                key={group.name}
                onClick={onMenuItem(`settings${group.name}`)}
                $indent={group.sceneType ? 1 : 0}
              >
                {l10n(group.name as L10NKey)}
              </SettingsMenuItem>
            ))}
            <SettingsMenuItem onClick={onMenuItem("settingsSprite")}>
              {l10n("SETTINGS_SPRITE")}
            </SettingsMenuItem>
            <SettingsMenuItem onClick={onMenuItem("settingsUI")}>
              {l10n("MENU_UI_ELEMENTS")}
            </SettingsMenuItem>
            <SettingsMenuItem onClick={onMenuItem("settingsControls")}>
              {l10n("SETTINGS_CONTROLS")}
            </SettingsMenuItem>
            <SettingsMenuItem onClick={onMenuItem("settingsCartType")}>
              {l10n("SETTINGS_CART_TYPE")}
            </SettingsMenuItem>
            <SettingsMenuItem onClick={onMenuItem("settingsBuild")}>
              {l10n("SETTINGS_BUILD")}
            </SettingsMenuItem>
            <SettingsMenuItem onClick={onMenuItem("settingsCustomHead")}>
              {l10n("SETTINGS_CUSTOM_HEADER")}
            </SettingsMenuItem>
          </SearchableCard>
        </SettingsMenuColumn>
      )}
      <SettingsContentColumn ref={scrollRef}>
        <SettingsSectionColor searchTerm={searchTerm} />

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
                          <FormInfo>
                            {l10n("FIELD_UI_SGB_PALETTE_NOTE")}
                          </FormInfo>
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

        <SceneTypesSettingsCard searchTerm={searchTerm} />

        <EngineFieldsEditor searchTerm={searchTerm} />

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
            <SettingRowLabel>
              {l10n("FIELD_DEFAULT_SPRITE_MODE")}
            </SettingRowLabel>
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

        <SettingsSectionBuild searchTerm={searchTerm} />

        <SettingsSectionWeb searchTerm={searchTerm} />
      </SettingsContentColumn>
    </SettingsPageWrapper>
  );
};

export default SettingsPage;
