import React, { FC } from "react";
import l10n from "lib/helpers/l10n";
import { OptionLabelWithInfo, Select } from "ui/form/Select";

interface AnimationSpeedSelectProps {
  name: string;
  value?: number | null;
  onChange?: (newValue: number | null) => void;
}

interface AnimationSpeedOption {
  value: number;
  label: string;
}

export const animLabelLookup: Record<number, string> = {
  255: `${l10n("FIELD_NONE")}`,
  127: `${l10n("FIELD_SPEED")} 1`,
  63: `${l10n("FIELD_SPEED")} 2`,
  31: `${l10n("FIELD_SPEED")} 3`,
  15: `${l10n("FIELD_SPEED")} 4`,
  7: `${l10n("FIELD_SPEED")} 5`,
  3: `${l10n("FIELD_SPEED")} 6`,
  1: `${l10n("FIELD_SPEED")} 7`,
  0: `${l10n("FIELD_SPEED")} 8`,
};

const options: AnimationSpeedOption[] = [255, 127, 63, 31, 15, 7, 3, 1, 0].map(
  (value) => ({
    value,
    label: animLabelLookup[value],
  })
);

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
