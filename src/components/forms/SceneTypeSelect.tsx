import React, { FC, useMemo } from "react";
import { Select } from "ui/form/Select";
import l10n from "shared/lib/lang/l10n";

interface SceneTypeSelectProps {
  name: string;
  value?: string;
  onChange?: (newValue: string) => void;
}

interface SceneTypeOption {
  value: string;
  label: string;
}

export const getOptions: () => SceneTypeOption[] = () => [
  { value: "TOPDOWN", label: l10n("GAMETYPE_TOP_DOWN") },
  { value: "PLATFORM", label: l10n("GAMETYPE_PLATFORMER") },
  { value: "ADVENTURE", label: l10n("GAMETYPE_ADVENTURE") },
  { value: "SHMUP", label: l10n("GAMETYPE_SHMUP") },
  { value: "POINTNCLICK", label: l10n("GAMETYPE_POINT_N_CLICK") },
  { value: "LOGO", label: l10n("GAMETYPE_LOGO") },
];

export const SceneTypeSelect: FC<SceneTypeSelectProps> = ({
  name,
  value,
  onChange,
}) => {
  const options = useMemo(getOptions, []);
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
