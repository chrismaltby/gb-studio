import React, { FC } from "react";
import l10n from "../../lib/helpers/l10n";
import { OptionLabelWithInfo, Select } from "../ui/form/Select";

interface AnimationSpeedSelectProps {
  name: string;
  value?: number | null;
  onChange?: (newValue: number | null) => void;
}

interface AnimationSpeedOption {
  value: number;
  label: string;
}

const options: AnimationSpeedOption[] = [
  { value: 255, label: `${l10n("FIELD_NONE")}` },
  { value: 127, label: `${l10n("FIELD_SPEED")} 1` },
  { value: 63, label: `${l10n("FIELD_SPEED")} 2` },
  { value: 31, label: `${l10n("FIELD_SPEED")} 3` },
  { value: 15, label: `${l10n("FIELD_SPEED")} 4` },
  { value: 7, label: `${l10n("FIELD_SPEED")} 5` },
  { value: 3, label: `${l10n("FIELD_SPEED")} 6` },
  { value: 1, label: `${l10n("FIELD_SPEED")} 7` },
  { value: 0, label: `${l10n("FIELD_SPEED")} 8` },
];

export const AnimationSpeedSelect: FC<AnimationSpeedSelectProps> = ({
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
      formatOptionLabel={(
        option: AnimationSpeedOption,
        { context }: { context: "menu" | "value" }
      ) => {
        return (
          <OptionLabelWithInfo
            info={
              context === "menu" && option.value !== 255
                ? `${String(
                    Math.round((60 / (option.value + 1)) * 100) / 100
                  )} ${l10n("FIELD_FRAMES_PER_SECOND_SHORT")}`
                : ""
            }
          >
            {option.label}{" "}
            {option.value === 127 && context === "menu"
              ? `(${l10n("FIELD_SLOWER")})`
              : ""}
            {option.value === 0 && context === "menu"
              ? `(${l10n("FIELD_FASTER")})`
              : ""}
          </OptionLabelWithInfo>
        );
      }}
      onChange={(newValue: AnimationSpeedOption) => {
        onChange?.(newValue.value);
      }}
    />
  );
};

AnimationSpeedSelect.defaultProps = {
  name: undefined,
  value: 3,
};
