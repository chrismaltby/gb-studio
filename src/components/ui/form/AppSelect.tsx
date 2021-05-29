import React, { FC } from "react";
import Path from "path";
import l10n from "lib/helpers/l10n";
import { Select, Option } from "./Select";
import { remote } from "electron";

const { dialog } = remote;

interface AppSelectProps {
  value?: string;
  onChange?: (newValue: string) => void;
}

export const AppSelect: FC<AppSelectProps> = ({ value, onChange }) => {
  const options = ([] as Option[]).concat(
    [
      {
        value: "choose",
        label: l10n("FIELD_CHOOSE_APPLICATION"),
      },
      {
        value: "",
        label: l10n("FIELD_SYSTEM_DEFAULT"),
      },
    ],
    value
      ? {
          value,
          label: Path.basename(value),
        }
      : []
  );

  const currentValue =
    options.find((option) => option.value === value) || options[0];

  const onSelectOption = async (newValue: Option) => {
    if (newValue.value === "choose") {
      const path = await dialog.showOpenDialog({
        properties: ["openFile"],
      });
      if (path.filePaths[0]) {
        const newPath = Path.normalize(path.filePaths[0]);
        onChange?.(newPath);
      }
    } else {
      onChange?.(newValue.value);
    }
  };

  return (
    <Select options={options} value={currentValue} onChange={onSelectOption} />
  );
};
