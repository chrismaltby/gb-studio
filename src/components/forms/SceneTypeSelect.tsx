import React, { memo, useMemo } from "react";
import { findSelectOption, Select } from "ui/form/Select";
import l10n, { L10NKey } from "shared/lib/lang/l10n";
import { useAppSelector } from "store/hooks";
import { SingleValue } from "react-select";

interface SceneTypeSelectProps {
  name: string;
  value?: string;
  onChange?: (newValue: string) => void;
}

interface SceneTypeOption {
  value: string;
  label: string;
}

const SceneTypeSelectComponent = ({
  name,
  value = "0",
  onChange,
}: SceneTypeSelectProps) => {
  const sceneTypes = useAppSelector((state) => state.engine.sceneTypes);
  const disabledSceneTypeIds = useAppSelector(
    (state) => state.project.present.settings.disabledSceneTypeIds,
  );
  const activeSceneTypes = useMemo(() => {
    return sceneTypes.filter((st) => !disabledSceneTypeIds.includes(st.key));
  }, [disabledSceneTypeIds, sceneTypes]);

  const options = useMemo(
    () =>
      activeSceneTypes.map((t) => ({
        value: t.key,
        label: l10n(t.label as L10NKey),
      })),
    [activeSceneTypes],
  );

  const currentSceneType = sceneTypes.find((o) => o.key === value);
  const currentValue =
    findSelectOption(options, value) ||
    (currentSceneType && {
      value: currentSceneType.key,
      label: l10n(currentSceneType.label as L10NKey),
    });

  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      onChange={(newValue: SingleValue<SceneTypeOption>) => {
        if (newValue) {
          onChange?.(newValue.value);
        }
      }}
    />
  );
};

export const SceneTypeSelect = memo<SceneTypeSelectProps>(
  SceneTypeSelectComponent,
);
