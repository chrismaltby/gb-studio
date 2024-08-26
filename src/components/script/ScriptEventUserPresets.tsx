import React, { useCallback, useMemo } from "react";
import { ScriptEventNormalized } from "shared/lib/entities/entitiesTypes";
import l10n from "shared/lib/lang/l10n";
import { ScriptEventArgs } from "shared/lib/resources/types";
import { getSettings } from "store/features/settings/settingsState";
import { useAppSelector } from "store/hooks";
import { CheckboxField } from "ui/form/CheckboxField";
import { Select } from "ui/form/Select";

interface ScriptEventUserPresetsProps {
  scriptEvent: ScriptEventNormalized;
  value?: string;
  onChange: (newArgs: ScriptEventArgs) => void;
}

interface UserPresetOption {
  value: string;
  label: string;
}

export const ScriptEventUserPresets = ({
  scriptEvent,
  value,
  onChange,
}: ScriptEventUserPresetsProps) => {
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
      })),
    ],

    [userPresets, userPresetsDefault]
  );

  const currentValue = useMemo(
    () => options.find((o) => o.value === value) ?? options[0],
    [options, value]
  );

  const setPreset = useCallback(
    (presetId: string) => {
      const preset = userPresets[presetId];
      if (preset) {
        onChange({
          ...scriptEvent.args,
          ...preset.args,
        });
      }
    },
    [onChange, scriptEvent.args, userPresets]
  );

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
