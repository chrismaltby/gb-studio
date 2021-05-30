import React, { FC } from "react";
import l10n from "../../lib/helpers/l10n";
import { Select } from "../ui/form/Select";

interface SceneTypeSelectProps {
  name: string;
  value?: string;
  onChange?: (newValue: string) => void;
}

interface SceneTypeOption {
  value: string;
  label: string;
}

const options: SceneTypeOption[] = [
  { value: "0", label: l10n("GAMETYPE_TOP_DOWN") },
  { value: "1", label: l10n("GAMETYPE_PLATFORMER") },
  {
    value: "2",
    label: `${l10n("GAMETYPE_ADVENTURE")} (${l10n("FIELD_WORK_IN_PROGRESS")}}`,
  },
  { value: "3", label: l10n("GAMETYPE_SHMUP") },
  { value: "4", label: l10n("GAMETYPE_POINT_N_CLICK") },
];

export const SceneTypeSelect: FC<SceneTypeSelectProps> = ({
  name,
  value,
  onChange,
}) => {
  const currentValue = options.find((o) => o.value === value);
  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      onChange={(newValue: SceneTypeOption) => {
        onChange?.(newValue.value);
      }}
    />
  );
};

SceneTypeSelect.defaultProps = {
  name: undefined,
  value: "0",
};

// {(showHiddenSceneTypes || scene.type === "2") &&
