import React, { useCallback, useMemo } from "react";
import { CardAnchor, CardHeading } from "ui/cards/Card";
import { SearchableCard } from "ui/cards/SearchableCard";
import l10n, { L10NKey } from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { SearchableSettingRow } from "ui/form/SearchableSettingRow";
import { SettingRowInput, SettingRowLabel } from "ui/form/SettingRow";
import { Checkbox } from "ui/form/Checkbox";
import { Button } from "ui/buttons/Button";
import { FixedSpacer, FlexRow } from "ui/spacing/Spacing";
import { SettingsIcon } from "ui/icons/Icons";
import { ButtonPrefixIcon } from "ui/buttons/style";
import settingsActions from "store/features/settings/settingsActions";
import styled from "styled-components";
import { useGroupedEngineFields } from "components/settings/useGroupedEngineFields";
import { SceneTypeSelect } from "components/forms/SceneTypeSelect";
import { Alert } from "ui/alerts/Alert";
import { FormField } from "ui/form/layout/FormLayout";
import { SpriteSheetSelect } from "components/forms/SpriteSheetSelect";
import { useEnabledSceneTypeIds } from "components/settings/useEnabledSceneTypeIds";

interface SceneTypesSettingsCardProps {
  searchTerm?: string;
}

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-grow: 1;
`;

const SceneTypesSettingsCard = ({
  searchTerm,
}: SceneTypesSettingsCardProps) => {
  const dispatch = useAppDispatch();
  const sceneTypes = useAppSelector((state) => state.engine.sceneTypes);
  const disabledSceneTypeIds = useAppSelector(
    (state) => state.project.present.settings.disabledSceneTypeIds,
  );
  const enabledSceneTypeIds = useEnabledSceneTypeIds();
  const defaultSceneTypeId = useAppSelector(
    (state) => state.project.present.settings.defaultSceneTypeId,
  );
  const defaultPlayerSprites = useAppSelector(
    (state) => state.project.present.settings.defaultPlayerSprites,
  );
  const groupedFields = useGroupedEngineFields();

  const sceneTypeRows = useMemo(() => {
    return sceneTypes
      .filter((sceneType) => {
        return sceneType.key !== "LOGO";
      })
      .map((sceneType) => {
        return {
          ...sceneType,
          l10nLabel: l10n(sceneType.label as L10NKey),
          enabled: !disabledSceneTypeIds.includes(sceneType.key),
          hasSettings: groupedFields.some((group) => {
            return group.sceneType === sceneType.key;
          }),
        };
      });
  }, [disabledSceneTypeIds, sceneTypes, groupedFields]);

  const sceneTypeLabels = useMemo(() => {
    return sceneTypeRows.map((st) => st.l10nLabel);
  }, [sceneTypeRows]);

  const enabledSceneTypeLabels = useMemo(() => {
    return sceneTypeRows.filter((st) => st.enabled).map((st) => st.l10nLabel);
  }, [sceneTypeRows]);

  const searchMatches = useMemo(() => {
    return [
      l10n("FIELD_SCENE_TYPES"),
      l10n("SETTINGS_PLAYER_DEFAULT_SPRITES"),
      l10n("FIELD_ENABLED_SCENE_TYPES"),
    ].concat(sceneTypeLabels);
  }, [sceneTypeLabels]);

  const toggleSceneTypeEnabled = useCallback(
    (sceneTypeKey: string) => {
      let newDisabledSceneTypes: string[];
      if (disabledSceneTypeIds.includes(sceneTypeKey)) {
        newDisabledSceneTypes = disabledSceneTypeIds.filter(
          (key) => key !== sceneTypeKey,
        );
      } else {
        newDisabledSceneTypes = [...disabledSceneTypeIds, sceneTypeKey];
      }
      dispatch(
        settingsActions.editSettings({
          disabledSceneTypeIds: newDisabledSceneTypes,
        }),
      );
    },
    [disabledSceneTypeIds, dispatch],
  );

  const onEditDefaultSceneTypeId = useCallback(
    (value: string) => {
      dispatch(
        settingsActions.editSettings({
          defaultSceneTypeId: value,
        }),
      );
    },
    [dispatch],
  );

  const onEditDefaultPlayerSprites = useCallback(
    (sceneType: string, spriteSheetId: string) => {
      dispatch(
        settingsActions.setSceneTypeDefaultPlayerSprite({
          sceneType,
          spriteSheetId,
        }),
      );
    },
    [dispatch],
  );

  const setScrollToId = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView();
    }
  }, []);

  return (
    <SearchableCard searchTerm={searchTerm} searchMatches={searchMatches}>
      <CardAnchor id="settingsSceneTypes" />
      <CardHeading>{l10n("FIELD_SCENE_TYPES")}</CardHeading>

      <SearchableSettingRow
        searchTerm={searchTerm}
        searchMatches={[l10n("FIELD_DEFAULT_SCENE_TYPE")]}
      >
        <SettingRowLabel>{l10n("FIELD_DEFAULT_SCENE_TYPE")}</SettingRowLabel>
        <SettingRowInput>
          <FormField name={"defaultSceneType"}>
            <SceneTypeSelect
              name={"defaultSceneType"}
              value={defaultSceneTypeId}
              onChange={onEditDefaultSceneTypeId}
            />
            {!enabledSceneTypeIds.includes(defaultSceneTypeId) && (
              <>
                <FixedSpacer height={5} />
                <Alert variant="warning">
                  {l10n("WARNING_SCENE_TYPE_DISABLED", {
                    type: defaultSceneTypeId,
                  })}
                </Alert>
              </>
            )}
          </FormField>
        </SettingRowInput>
      </SearchableSettingRow>

      <SearchableSettingRow
        searchTerm={searchTerm}
        searchMatches={[...sceneTypeLabels, l10n("FIELD_ENABLED_SCENE_TYPES")]}
      >
        <SettingRowLabel $sectionHeading>
          {l10n("FIELD_ENABLED_SCENE_TYPES")}
        </SettingRowLabel>
      </SearchableSettingRow>

      {sceneTypeRows.map((sceneType) => (
        <SearchableSettingRow
          key={sceneType.key}
          searchTerm={searchTerm}
          searchMatches={[
            sceneType.l10nLabel,
            l10n("FIELD_ENABLED_SCENE_TYPES"),
          ]}
          isCheckbox={true}
          indent={1}
        >
          <SettingRowLabel
            htmlFor={sceneType.key}
            $disabled={!sceneType.enabled}
          >
            {sceneType.l10nLabel}
          </SettingRowLabel>
          <SettingRowInput>
            <FlexRow>
              <CheckboxWrapper>
                <Checkbox
                  id={sceneType.key}
                  name={sceneType.key}
                  checked={sceneType.enabled}
                  onChange={() => toggleSceneTypeEnabled(sceneType.key)}
                />
              </CheckboxWrapper>
              {sceneType.enabled && sceneType.hasSettings && (
                <Button
                  onClick={() => setScrollToId(`settings${sceneType.key}`)}
                >
                  <ButtonPrefixIcon>
                    <SettingsIcon />
                  </ButtonPrefixIcon>
                  {l10n("SETTINGS")}
                </Button>
              )}
            </FlexRow>
          </SettingRowInput>
        </SearchableSettingRow>
      ))}

      <SearchableSettingRow
        searchTerm={searchTerm}
        searchMatches={[
          ...enabledSceneTypeLabels,
          l10n("SETTINGS_PLAYER_DEFAULT_SPRITES"),
        ]}
      >
        <SettingRowLabel $sectionHeading>
          {l10n("SETTINGS_PLAYER_DEFAULT_SPRITES")}
        </SettingRowLabel>
      </SearchableSettingRow>

      {sceneTypeRows
        .filter((sceneType) => sceneType.enabled)
        .map((sceneType) => (
          <SearchableSettingRow
            key={sceneType.key}
            searchTerm={searchTerm}
            searchMatches={[
              l10n(sceneType.label as L10NKey),
              l10n("SETTINGS_PLAYER_DEFAULT_SPRITES"),
            ]}
            indent={1}
          >
            <SettingRowLabel>
              {l10n(sceneType.label as L10NKey)}
            </SettingRowLabel>
            <SettingRowInput>
              <SpriteSheetSelect
                name={`defaultPlayerSprite__${sceneType.key}`}
                value={defaultPlayerSprites[sceneType.key] || ""}
                optional
                optionalLabel={l10n("FIELD_NONE")}
                onChange={(value) =>
                  onEditDefaultPlayerSprites(sceneType.key, value)
                }
              />
            </SettingRowInput>
          </SearchableSettingRow>
        ))}
    </SearchableCard>
  );
};

export default SceneTypesSettingsCard;
