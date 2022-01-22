import React, { FC } from "react";
import l10n from "lib/helpers/l10n";
import { Select } from "ui/form/Select";
import initElectronL10n from "lib/helpers/initElectronL10n";

// Make sure localisation has loaded so that
// l10n function can be used at top level
initElectronL10n();

interface SceneTypeSelectProps {
  name: string;
  value?: string;
  onChange?: (newValue: string) => void;
}

interface SceneTypeOption {
  value: string;
  label: string;
}

export const options: SceneTypeOption[] = [
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
