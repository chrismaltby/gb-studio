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
import type { UserPresetsGroup } from "lib/project/loadScriptEventHandlers";
import { pick } from "lodash";

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
  userPresetsGroups: UserPresetsGroup[] | undefined
) => {
  if (!args || !userPresetsGroups) {
    return {};
  }
  const keysToStore = userPresetsGroups
    .filter((group) => selectedPresetGroups.includes(group.id))
    .map((group) => group.fields)
    .flat();
  console.log({ keysToStore });
  return pick(args, keysToStore);
};

export const ScriptEventUserPresets = ({
  scriptEvent,
  onChange,
}: ScriptEventUserPresetsProps) => {
  const dispatch = useAppDispatch();

  const [selectedPresetGroups, setSelectedPresetGroups] = useState<string[]>(
    []
  );
  const [presetName, setPresetName] = useState<string>("");

  const scriptEventDef = useAppSelector(
    (state) => state.scriptEventDefs.lookup[scriptEvent.command]
  );
  const userPresets = useAppSelector(
    (state) => getSettings(state).scriptEventPresets[scriptEvent.command]
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

  const value = String(scriptEvent.args?._presetId ?? "");

  const currentValue = useMemo(
    () => options.find((o) => o.value === value) ?? options[0],
    [options, value]
  );

  const setPreset = useCallback(
    (presetId: string) => {
      const preset = userPresets[presetId];
      onChange({
        ...scriptEvent.args,
        ...preset?.args,
        _presetId: presetId,
      });
      if (presetId === "create") {
        setPresetName(
          `${l10n("FIELD_PRESET")} ${Object.keys(userPresets).length + 1}`
        );
        setSelectedPresetGroups(
          scriptEventDef?.userPresetsGroups
            ?.filter((group) => group.selected)
            .map((group) => group.id) ?? []
        );
      }
    },
    [onChange, scriptEvent.args, scriptEventDef?.userPresetsGroups, userPresets]
  );

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

  const updatePreset = useCallback(() => {
    dispatch(
      settingsActions.editScriptEventPreset({
        id: scriptEvent.command,
        presetId: value,
        name: "Updated name",
        groups: [],
        args: scriptEvent.args ?? {},
      })
    );
  }, [dispatch, scriptEvent.args, scriptEvent.command, value]);

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

  const createPreset = useCallback(() => {
    dispatch(
      settingsActions.addScriptEventPreset({
        id: scriptEvent.command,
        name: presetName,
        groups: selectedPresetGroups,
        args: argsToStore(
          scriptEvent.args,
          selectedPresetGroups,
          scriptEventDef?.userPresetsGroups
        ),
      })
    );
  }, [
    dispatch,
    presetName,
    scriptEvent.args,
    scriptEvent.command,
    scriptEventDef?.userPresetsGroups,
    selectedPresetGroups,
  ]);

  return (
    <div>
      <FormField label="Preset" name={"presetId"}>
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
        <>
          <Button onClick={updatePreset}>{l10n("FIELD_EDIT_PRESET")}</Button>
          {currentValue.isDefault ? (
            <Button onClick={removeDefault}>Remove Default</Button>
          ) : (
            <Button onClick={setAsDefault}>Set As Default</Button>
          )}
        </>
      )}
      {(currentValue.preset || value === "create") && (
        <>
          <TextField
            name={"presetName"}
            label={l10n("FIELD_NAME")}
            placeholder={l10n("FIELD_PRESET")}
            value={presetName}
            onChange={onChangePresetName}
          />
          <br />
          Include in preset...
          {scriptEventDef?.userPresetsGroups?.map((userPresetsGroup) => (
            <div key={userPresetsGroup.id}>
              <CheckboxField
                name={`${userPresetsGroup.id}_store`}
                label={userPresetsGroup.label}
                onChange={() => toggleSelectedPresetGroup(userPresetsGroup.id)}
                checked={selectedPresetGroups.includes(userPresetsGroup.id)}
              />
            </div>
          ))}
          {value === "create" && (
            <Button onClick={createPreset}>{l10n("FIELD_SAVE")}</Button>
          )}
        </>
      )}
    </div>
  );
};
