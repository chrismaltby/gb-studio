import React, { useCallback, useRef, useState } from "react";
import Path from "path";
import l10n, { L10NKey } from "shared/lib/lang/l10n";
import CustomControlsPicker from "components/forms/CustomControlsPicker";
import {
  SettingsState,
  SpriteModeSetting,
} from "store/features/settings/settingsState";
import settingsActions from "store/features/settings/settingsActions";
import EngineFieldsEditor from "components/settings/EngineFieldsEditor";
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
import electronActions from "store/features/electron/electronActions";
import CartSettingsEditor from "components/settings/CartSettingsEditor";
import { UIAssetPreview } from "components/forms/UIAssetPreviewButton";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { SpriteModeSelect } from "components/forms/SpriteModeSelect";
import SceneTypesSettingsCard from "components/settings/SceneTypesSettingsCard";
import editorActions from "store/features/editor/editorActions";
import { useRestoreScroll } from "ui/hooks/use-restore-scroll";
import { useSaveScroll } from "ui/hooks/use-save-scroll";
import { SettingsSectionColor } from "components/settings/section/SettingsSectionColor";
import { SettingsSectionWeb } from "components/settings/section/SettingsSectionWeb";
import { SettingsSectionBuild } from "components/settings/section/SettingsSectionBuild";
import { SettingsSectionSGB } from "components/settings/section/SettingsSectionSGB";

const SettingsPage = () => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.project.present.settings);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const groupedFields = useGroupedEngineFields();
  const windowSize = useWindowSize();
  const showMenu = (windowSize.width || 0) >= 750;

  const setScrollToId = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView();
    }
  }, []);

  const { defaultFontId, spriteMode } = settings;

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

  const onChangeSpriteMode = useCallback(
    (e: SpriteModeSetting) => onChangeSettingProp("spriteMode", e),
    [onChangeSettingProp],
  );

  const onChangeDefaultFontId = useCallback(
    (e: string) => onChangeSettingProp("defaultFontId", e),
    [onChangeSettingProp],
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

        <SettingsSectionSGB searchTerm={searchTerm} />

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
