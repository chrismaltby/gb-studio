import React, { FC, useCallback, useLayoutEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FormField } from "../../components/library/Forms";
import l10n from "../../lib/helpers/l10n";
import castEventValue from "../../lib/helpers/castEventValue";
import CustomControlsPicker from "../../components/forms/CustomControlsPicker";
import CartPicker from "../../components/forms/CartPicker";
import PaletteSelect from "../../components/forms/PaletteSelectOld";
import { Button } from "../../components/ui/buttons/Button";
import { SettingsState } from "../../store/features/settings/settingsState";
import settingsActions from "../../store/features/settings/settingsActions";
import navigationActions from "../../store/features/navigation/navigationActions";
import EngineFieldsEditor from "../../components/settings/EngineFieldsEditor";
import { Checkbox } from "../../components/ui/form/Checkbox";
import { Input } from "../../components/ui/form/Input";
import { RootState } from "../../store/configureStore";
import { useGroupedEngineFields } from "../../components/settings/useGroupedEngineFields";
import { NavigationSection } from "../../store/features/navigation/navigationState";
import { Textarea } from "../../components/ui/form/Textarea";
import useWindowSize from "../../components/ui/hooks/use-window-size";
import {
  SettingsContentColumn,
  SettingsMenuColumn,
  SettingsMenuItem,
  SettingsPageWrapper,
  SettingsSearchWrapper,
} from "../../components/settings/SettingsLayout";
import {
  CardAnchor,
  CardButtons,
  CardHeading,
} from "../../components/ui/cards/Card";
import { SearchableSettingRow } from "../../components/ui/form/SearchableSettingRow";
import {
  SettingRowInput,
  SettingRowLabel,
} from "../../components/ui/form/SettingRow";
import { SearchableCard } from "../../components/ui/cards/SearchableCard";
import { FontSelect } from "../../components/forms/FontSelect";
import { options as sceneTypes } from "../../components/forms/SceneTypeSelect";
import { SpriteSheetSelect } from "../../components/forms/SpriteSheetSelect";
import { CharacterEncodingSelect } from "../../components/forms/CharacterEncodingSelect";

const SettingsPage: FC = () => {
  const dispatch = useDispatch();
  const settings = useSelector(
    (state: RootState) => state.project.present.settings
  );
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
    customColorsEnabled,
    customHead,
    defaultUIPaletteId,
    defaultSpritePaletteId,
    defaultBackgroundPaletteIds,
    defaultSpritePaletteIds,
    defaultFontId,
    defaultCharacterEncoding,
    defaultPlayerSprites,
  } = settings;

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

  const onEditSetting = (id: string) => (e: any) => {
    editSettings({
      [id]: castEventValue(e),
    });
  };

  const onEditPaletteId = useCallback(
    (index: number, e: any) => {
      const paletteIds = defaultBackgroundPaletteIds
        ? [...defaultBackgroundPaletteIds]
        : [];
      paletteIds[index] = castEventValue(e);
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
    (index: number, e: any) => {
      const paletteIds = defaultSpritePaletteIds
        ? [...defaultSpritePaletteIds]
        : [];
      paletteIds[index] = castEventValue(e);
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

  return (
    <SettingsPageWrapper>
      {showMenu && (
        <SettingsMenuColumn>
          <SearchableCard>
            <SettingsSearchWrapper>
              <Input
                autoFocus
                type="search"
                placeholder="Search Settings..."
                value={searchTerm}
                onChange={onSearch}
              />
            </SettingsSearchWrapper>
            <SettingsMenuItem onClick={onMenuItem("settingsColor")}>
              {l10n("SETTINGS_GBC")}
            </SettingsMenuItem>
            <SettingsMenuItem onClick={onMenuItem("settingsPlayer")}>
              {l10n("SETTINGS_PLAYER_DEFAULT_SPRITES")}
            </SettingsMenuItem>
            <SettingsMenuItem onClick={onMenuItem("settingsUI")}>
              {l10n("MENU_UI_ELEMENTS")}
            </SettingsMenuItem>
            {groupedFields.map((group) => (
              <SettingsMenuItem
                key={group.name}
                onClick={onMenuItem(`settings${group.name}`)}
              >
                {l10n(group.name)}
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
            "Default Background Palettes",
            "Default Sprite Palette",
            "Default UI Palette",
          ]}
        >
          <CardAnchor id="settingsColor" />
          <CardHeading>{l10n("SETTINGS_GBC")}</CardHeading>
          <SearchableSettingRow
            searchTerm={searchTerm}
            searchMatches={[l10n("FIELD_EXPORT_IN_COLOR")]}
          >
            <SettingRowLabel>{l10n("FIELD_EXPORT_IN_COLOR")}</SettingRowLabel>
            <SettingRowInput>
              <Checkbox
                id="customColorsEnabled"
                name="customColorsEnabled"
                checked={customColorsEnabled}
                onChange={onEditSetting("customColorsEnabled")}
              />
            </SettingRowInput>
          </SearchableSettingRow>
          {customColorsEnabled && (
            <>
              <SearchableSettingRow
                searchTerm={searchTerm}
                searchMatches={["Default Background Palettes"]}
              >
                <SettingRowLabel>Default Background Palettes</SettingRowLabel>
                <SettingRowInput>
                  <div key={JSON.stringify(defaultBackgroundPaletteIds)}>
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                      <FormField
                        key={index}
                        style={{
                          padding: 0,
                          paddingBottom: index === 7 ? 0 : 3,
                        }}
                      >
                        <PaletteSelect
                          id="scenePalette"
                          prefix={`${index + 1}${index === 7 ? " / UI" : ""}: `}
                          value={
                            (defaultBackgroundPaletteIds &&
                              defaultBackgroundPaletteIds[index]) ||
                            ""
                          }
                          onChange={(e: string) => {
                            onEditPaletteId(index, e);
                          }}
                        />
                      </FormField>
                    ))}
                  </div>
                </SettingRowInput>
              </SearchableSettingRow>

              <SearchableSettingRow
                searchTerm={searchTerm}
                searchMatches={["Default Sprite Palettes"]}
              >
                <SettingRowLabel>Default Sprite Palettes</SettingRowLabel>
                <SettingRowInput>
                  <div key={JSON.stringify(defaultSpritePaletteIds)}>
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                      <FormField
                        key={index}
                        style={{
                          padding: 0,
                          paddingBottom: index === 7 ? 0 : 3,
                        }}
                      >
                        <PaletteSelect
                          id="scenePalette"
                          prefix={`${index + 1}${
                            index === 7 ? ` / ${l10n("FIELD_EMOTE")}` : ""
                          }: `}
                          value={
                            (defaultSpritePaletteIds &&
                              defaultSpritePaletteIds[index]) ||
                            ""
                          }
                          onChange={(e: string) => {
                            onEditSpritePaletteId(index, e);
                          }}
                        />
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
          searchMatches={[l10n("SETTINGS_PLAYER_DEFAULT_SPRITES")]}
        >
          <CardAnchor id="settingsPlayer" />
          <CardHeading>{l10n("SETTINGS_PLAYER_DEFAULT_SPRITES")}</CardHeading>
          {sceneTypes.map((sceneType) => (
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
            l10n("FIELD_CHARACTER_ENCODING"),
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
                onChange={onEditSetting("defaultFontId")}
              />
            </SettingRowInput>
          </SearchableSettingRow>

          <SearchableSettingRow
            searchTerm={searchTerm}
            searchMatches={[l10n("FIELD_CHARACTER_ENCODING")]}
          >
            <SettingRowLabel>
              {l10n("FIELD_CHARACTER_ENCODING")}
            </SettingRowLabel>
            <SettingRowInput>
              <CharacterEncodingSelect
                name="defaultCharacterEncoding"
                value={defaultCharacterEncoding || ""}
                onChange={onEditSetting("defaultCharacterEncoding")}
              />
            </SettingRowInput>
          </SearchableSettingRow>
        </SearchableCard>

        <EngineFieldsEditor searchTerm={searchTerm} />

        <SearchableCard
          searchTerm={searchTerm}
          searchMatches={[
            "Up",
            "Down",
            "Left",
            "Right",
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
          <CartPicker searchTerm={searchTerm} />
        </SearchableCard>

        <SearchableCard
          searchTerm={searchTerm}
          searchMatches={["Custom HTML Header"]}
        >
          <CardAnchor id="settingsCustomHead" />
          <CardHeading>{l10n("SETTINGS_CUSTOM_HEADER")}</CardHeading>
          <SearchableSettingRow
            searchTerm={searchTerm}
            searchMatches={["Custom HTML Header"]}
          >
            <SettingRowLabel>Custom HTML Header</SettingRowLabel>
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
                onChange={onEditSetting("customHead")}
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
