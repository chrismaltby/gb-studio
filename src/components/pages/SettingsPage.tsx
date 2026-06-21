import React, { useCallback, useRef, useState } from "react";
import l10n, { L10NKey } from "shared/lib/lang/l10n";
import SettingsSectionEngineFields from "components/settings/section/SettingsSectionEngineFields";
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
import { SearchableCard } from "ui/cards/SearchableCard";
import { useAppDispatch, useAppSelector } from "store/hooks";
import SettingsSectionSceneTypes from "components/settings/section/SettingsSectionSceneTypes";
import editorActions from "store/features/editor/editorActions";
import { useRestoreScroll } from "ui/hooks/use-restore-scroll";
import { useSaveScroll } from "ui/hooks/use-save-scroll";
import { SettingsSectionColor } from "components/settings/section/SettingsSectionColor";
import { SettingsSectionWeb } from "components/settings/section/SettingsSectionWeb";
import { SettingsSectionBuild } from "components/settings/section/SettingsSectionBuild";
import { SettingsSectionSGB } from "components/settings/section/SettingsSectionSGB";
import { SettingsSectionCart } from "components/settings/section/SettingsSectionCart";
import { SettingsSectionControls } from "components/settings/section/SettingsSectionControls";
import { SettingsSectionUI } from "components/settings/section/SettingsSectionUI";
import { SettingsSectionSprites } from "components/settings/section/SettingsSectionSprites";

const SettingsPage = () => {
  const dispatch = useAppDispatch();
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
            <SettingsMenuItem onClick={onMenuItem("settingsWeb")}>
              {l10n("SETTINGS_WEB_EXPORT")}
            </SettingsMenuItem>
          </SearchableCard>
        </SettingsMenuColumn>
      )}
      <SettingsContentColumn ref={scrollRef}>
        <SettingsSectionColor searchTerm={searchTerm} />
        <SettingsSectionSGB searchTerm={searchTerm} />
        <SettingsSectionSceneTypes searchTerm={searchTerm} />
        <SettingsSectionEngineFields searchTerm={searchTerm} />
        <SettingsSectionSprites searchTerm={searchTerm} />
        <SettingsSectionUI searchTerm={searchTerm} />
        <SettingsSectionControls searchTerm={searchTerm} />
        <SettingsSectionCart searchTerm={searchTerm} />
        <SettingsSectionBuild searchTerm={searchTerm} />
        <SettingsSectionWeb searchTerm={searchTerm} />
      </SettingsContentColumn>
    </SettingsPageWrapper>
  );
};

export default SettingsPage;
