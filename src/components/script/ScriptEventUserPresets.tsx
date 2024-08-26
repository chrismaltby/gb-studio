import React, { useCallback, useMemo } from "react";
import { ScriptEventNormalized } from "shared/lib/entities/entitiesTypes";
import l10n from "shared/lib/lang/l10n";
import { ScriptEventArgs, ScriptEventPreset } from "shared/lib/resources/types";
import { getSettings } from "store/features/settings/settingsState";
import settingsActions from "store/features/settings/settingsActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { Button } from "ui/buttons/Button";
import { CheckboxField } from "ui/form/CheckboxField";
import { Select } from "ui/form/Select";

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

export const ScriptEventUserPresets = ({
  scriptEvent,
  onChange,
}: ScriptEventUserPresetsProps) => {
  const dispatch = useAppDispatch();

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
    },
    [onChange, scriptEvent.args, userPresets]
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
        args: scriptEvent.args ?? {},
      })
    );
  }, [dispatch, scriptEvent.args, scriptEvent.command, value]);

  return (
    <div>
      <Select
        name={"presetSelect"}
        value={currentValue}
        options={options}
        onChange={(newValue: UserPresetOption) => {
          setPreset(newValue.value);
        }}
      />

      {currentValue.preset && (
        <>
          <Button onClick={updatePreset}>Update Preset</Button>
          {currentValue.isDefault ? (
            <Button onClick={removeDefault}>Remove Default</Button>
          ) : (
            <Button onClick={setAsDefault}>Set As Default</Button>
          )}
        </>
      )}
      {currentValue.preset && !currentValue.isDefault && <></>}
      <br />
      {scriptEventDef?.userPresetsGroups?.map(
        (userPresetsGroup, userPresetsGroupIndex) => (
          <div key={userPresetsGroupIndex}>
            <CheckboxField
              name={`${userPresetsGroupIndex}_store`}
              label={userPresetsGroup.label}
            />
          </div>
        )
      )}
    </div>
  );
};
