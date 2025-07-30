import React, { FC } from "react";
import Path from "path";
import { Select, Option } from "./Select";
import l10n from "shared/lib/lang/l10n";
import API from "renderer/lib/api";
import { SingleValue } from "react-select";

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
      : [],
  );

  const currentValue =
    options.find((option) => option.value === value) || options[0];

  const onSelectOption = async (newValue: SingleValue<Option>) => {
    if (newValue) {
      if (newValue.value === "choose") {
        const path = await API.dialog.chooseFile();
        if (path) {
          const newPath = Path.normalize(path);
          onChange?.(newPath);
        }
      } else {
        onChange?.(newValue.value);
      }
    }
  };

  return (
    <Select options={options} value={currentValue} onChange={onSelectOption} />
  );
};
