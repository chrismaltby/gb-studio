import React, { FC, useMemo } from "react";
import { Select } from "ui/form/Select";
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

export const SceneTypeSelect: FC<SceneTypeSelectProps> = ({
  name,
  value = "0",
  onChange,
}) => {
  const sceneTypes = useAppSelector((state) => state.engine.sceneTypes);
  const disabledSceneTypeIds = useAppSelector(
    (state) => state.project.present.settings.disabledSceneTypeIds,
  );
  const activeSceneTypes = useMemo(() => {
    return sceneTypes.filter((st) => !disabledSceneTypeIds.includes(st.key));
  }, [disabledSceneTypeIds, sceneTypes]);

  const options = activeSceneTypes.map((t) => {
    return {
      value: t.key,
      label: l10n(t.label as L10NKey),
    } as SceneTypeOption;
  });

  const currentSceneType = sceneTypes.find((o) => o.key === value);
  const currentValue = currentSceneType && {
    value: currentSceneType.key,
    label: l10n(currentSceneType.label as L10NKey),
  };

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
