import React, { useCallback, useMemo, useState } from "react";
import { ScriptEventNormalized } from "shared/lib/entities/entitiesTypes";
import l10n from "shared/lib/lang/l10n";
import { ScriptEventArgs, ScriptEventPreset } from "shared/lib/resources/types";
import { getSettings } from "store/features/settings/settingsState";
import settingsActions from "store/features/settings/settingsActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { Button } from "ui/buttons/Button";
import { Select } from "ui/form/Select";
import { FormField } from "ui/form/FormLayout";
import { CheckboxField } from "ui/form/CheckboxField";
import { TextField } from "ui/form/TextField";
import type { ScriptEventDef } from "lib/project/loadScriptEventHandlers";
import styled from "styled-components";
import { Label } from "ui/form/Label";
import { FlexGrow } from "ui/spacing/Spacing";

interface ScriptEventUserPresetsProps {
  scriptEvent: ScriptEventNormalized;
  onChange: (newArgs: ScriptEventArgs) => void;
}

interface UserPresetOption {
  value: string;
  label: string;
  isDefault?: boolean;
  preset?: ScriptEventPreset;
}

const argsToStore = (
  args: ScriptEventArgs | undefined,
  selectedPresetGroups: string[],
  scriptEventDef: ScriptEventDef
) => {
  if (!args || !scriptEventDef.userPresetsGroups) {
    return {};
  }
  const keysToStore = scriptEventDef.userPresetsGroups
    .filter((group) => selectedPresetGroups.includes(group.id))
    .map((group) => group.fields)
    .flat();

  return keysToStore.reduce((memo, key) => {
    memo[key] = args[key] ?? scriptEventDef.fieldsLookup[key].defaultValue;
    return memo;
  }, {} as Record<string, unknown>);
};

const ButtonGroup = styled.div`
  display: flex;
  margin-top: 5px;
  > * + * {
    margin-left: 5px;
  }
`;

const PresetGroupsForm = styled.div`
  margin: 10px 0;
`;

type EditMode = "select" | "edit" | "create";

export const ScriptEventUserPresets = ({
  scriptEvent,
  onChange,
}: ScriptEventUserPresetsProps) => {
  const dispatch = useAppDispatch();

  const [selectedPresetGroups, setSelectedPresetGroups] = useState<string[]>(
    []
  );
  const [presetName, setPresetName] = useState<string>("");
  const [defaultPresetName, setDefaultPresetName] = useState<string>("");
  const [editMode, setEditMode] = useState<EditMode>("select");

  const scriptEventDef = useAppSelector(
    (state) => state.scriptEventDefs.lookup[scriptEvent.command]
  );
  const userPresets = useAppSelector(
    (state) => getSettings(state).scriptEventPresets[scriptEvent.command] ?? {}
  );
  const userPresetsDefault = useAppSelector(
    (state) => getSettings(state).scriptEventDefaultPresets[scriptEvent.command]
  );

  const options: UserPresetOption[] = useMemo(
    () => [
      {
        value: "",
        label: l10n("FIELD_NONE"),
      },
      {
        value: "create",
        label: l10n("FIELD_CREATE_PRESET"),
      },
      ...Object.values(userPresets).map((userPreset) => ({
        value: userPreset.id,
        label: `${userPreset.name}${
          userPreset.id === userPresetsDefault
            ? ` (${l10n("FIELD_DEFAULT")})`
            : ""
        }`,
        preset: userPreset,
        isDefault: userPreset.id === userPresetsDefault,
      })),
    ],

    [userPresets, userPresetsDefault]
  );

  const value = String(scriptEvent.args?.__presetId ?? "");

  const currentValue = useMemo(
    () => options.find((o) => o.value === value) ?? options[0],
    [options, value]
  );

  const setPreset = useCallback(
    (presetId: string) => {
      if (presetId === "create") {
        setEditMode("create");
        setDefaultPresetName(
          `${l10n("FIELD_PRESET")} ${Object.keys(userPresets).length + 1}`
        );
        setPresetName("");
        setSelectedPresetGroups(
          scriptEventDef?.userPresetsGroups
            ?.filter((group) => group.selected)
            .map((group) => group.id) ?? []
        );
      } else {
        const preset = userPresets[presetId];
        onChange({
          ...scriptEvent.args,
          ...preset?.args,
          __presetId: presetId,
        });
      }
    },
    [onChange, scriptEvent.args, scriptEventDef?.userPresetsGroups, userPresets]
  );

  const onStartEdit = useCallback(() => {
    if (currentValue.preset) {
      setEditMode("edit");
      setDefaultPresetName(
        `${l10n("FIELD_PRESET")} ${
          Object.keys(userPresets).indexOf(currentValue.value) + 1
        }`
      );
      setPresetName(currentValue.preset.name);
      setSelectedPresetGroups(currentValue.preset.groups);
    }
  }, [currentValue.preset, currentValue.value, userPresets]);

  const onCancelEdit = useCallback(() => {
    setEditMode("select");
  }, []);

  const setAsDefault = useCallback(() => {
    dispatch(
      settingsActions.setScriptEventDefaultPreset({
        id: scriptEvent.command,
        presetId: value,
      })
    );
  }, [dispatch, scriptEvent.command, value]);

  const removeDefault = useCallback(() => {
    dispatch(
      settingsActions.setScriptEventDefaultPreset({
        id: scriptEvent.command,
        presetId: "",
      })
    );
  }, [dispatch, scriptEvent.command]);

  const onSavePreset = useCallback(() => {
    if (!scriptEventDef) {
      return;
    }
    const args = argsToStore(
      scriptEvent.args,
      selectedPresetGroups,
      scriptEventDef
    );
    const name = presetName.trim() || defaultPresetName;
    if (editMode === "edit") {
      dispatch(
        settingsActions.editScriptEventPreset({
          id: scriptEvent.command,
          presetId: value,
          name,
          groups: selectedPresetGroups,
          args,
        })
      );
    } else if (editMode === "create") {
      const addAction = settingsActions.addScriptEventPreset({
        id: scriptEvent.command,
        name,
        groups: selectedPresetGroups,
        args,
      });
      onChange({
        ...scriptEvent.args,
        __presetId: addAction.payload.presetId,
      });
      dispatch(addAction);
    }
    setEditMode("select");
  }, [
    defaultPresetName,
    dispatch,
    editMode,
    onChange,
    presetName,
    scriptEvent.args,
    scriptEvent.command,
    scriptEventDef,
    selectedPresetGroups,
    value,
  ]);

  const onDeletePreset = useCallback(() => {
    dispatch(
      settingsActions.removeScriptEventPreset({
        id: scriptEvent.command,
        presetId: value,
      })
    );
  }, [dispatch, scriptEvent.command, value]);

  const onChangePresetName = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPresetName(e.currentTarget.value);
    },
    []
  );
  const toggleSelectedPresetGroup = useCallback(
    (groupId: string) => {
      setSelectedPresetGroups(
        selectedPresetGroups.includes(groupId)
          ? selectedPresetGroups.filter((s) => s !== groupId)
          : [...selectedPresetGroups, groupId]
      );
    },
    [selectedPresetGroups]
  );

  return (
    <div>
      {editMode === "select" && (
        <>
          <FormField label={l10n("FIELD_PRESET")} name={"presetId"}>
            <Select
              name={"presetId"}
              value={currentValue}
              options={options}
              onChange={(newValue: UserPresetOption) => {
                setPreset(newValue.value);
              }}
            />
          </FormField>
          {currentValue.preset && (
            <ButtonGroup>
              <Button size="small" onClick={onStartEdit}>
                {l10n("FIELD_APPLY_CHANGES")}
              </Button>
              {currentValue.isDefault ? (
                <Button size="small" onClick={removeDefault}>
                  {l10n("FIELD_REMOVE_AS_DEFAULT")}
                </Button>
              ) : (
                <Button size="small" onClick={setAsDefault}>
                  {l10n("FIELD_SET_AS_DEFAULT")}
                </Button>
              )}
              <FlexGrow />
              <Button size="small" onClick={onDeletePreset}>
                {l10n("FIELD_DELETE_PRESET")}
              </Button>
            </ButtonGroup>
          )}
        </>
      )}

      {(editMode === "edit" || editMode === "create") && (
        <>
          <TextField
            name={"presetName"}
            label={l10n("FIELD_NAME")}
            placeholder={defaultPresetName}
            value={presetName}
            onChange={onChangePresetName}
          />
          <PresetGroupsForm>
            <FormField name="presetGroups">
              <Label>{l10n("FIELD_INCLUDE_IN_PRESET")}</Label>
              {scriptEventDef?.userPresetsGroups?.map((userPresetsGroup) => (
                <div key={userPresetsGroup.id}>
                  <CheckboxField
                    name={`${userPresetsGroup.id}_store`}
                    label={userPresetsGroup.label}
                    onChange={() =>
                      toggleSelectedPresetGroup(userPresetsGroup.id)
                    }
                    checked={selectedPresetGroups.includes(userPresetsGroup.id)}
                  />
                </div>
              ))}
            </FormField>
          </PresetGroupsForm>
          <ButtonGroup>
            <Button onClick={onSavePreset}>{l10n("FIELD_SAVE_PRESET")}</Button>
            <Button onClick={onCancelEdit}>{l10n("DIALOG_CANCEL")}</Button>
          </ButtonGroup>
        </>
      )}
    </div>
  );
};
