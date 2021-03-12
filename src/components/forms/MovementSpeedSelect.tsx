import React, { FC, useEffect, useState } from "react";
import l10n from "../../lib/helpers/l10n";
import { Input } from "../ui/form/Input";
import { OptionLabelWithInfo, Select } from "../ui/form/Select";

interface MovementSpeedSelectProps {
  name: string;
  value?: number;
  onChange?: (newValue: number) => void;
}

interface MovementSpeedOption {
  value: number;
  label: string;
}

const options: MovementSpeedOption[] = [
  { value: 0.5, label: `${l10n("FIELD_SPEED")} ½` },
  { value: 1, label: `${l10n("FIELD_SPEED")} 1` },
  { value: 2, label: `${l10n("FIELD_SPEED")} 2` },
  { value: 3, label: `${l10n("FIELD_SPEED")} 3` },
  { value: 4, label: `${l10n("FIELD_SPEED")} 4` },
  { value: 0, label: `${l10n("FIELD_CUSTOM_SPEED")}` },
];

export const MovementSpeedSelect: FC<MovementSpeedSelectProps> = ({
  name,
  value = 1,
  onChange,
}) => {
  const [currentValue, setCurrentValue] = useState<
    MovementSpeedOption | undefined
  >();
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    console.log({ value });
    const current = options.find((o) => o.value === value);
    setCurrentValue(current);
    if (value === 0 || !current) {
      setIsCustom(true);
    }
  }, [value]);

  if (isCustom) {
    return (
      <Input
        autoFocus
        type="number"
        id={name}
        name={name}
        value={value || ""}
        min={0}
        max={10}
        step={1 / 16}
        placeholder={`${l10n("FIELD_PIXELS_PER_FRAME")}...`}
        onChange={(e) =>
          onChange?.(Math.min(10, Math.max(0, Number(e.currentTarget.value))))
        }
        onBlur={(e) => {
          if (!e.currentTarget.value) {
            onChange?.(1);
            setIsCustom(false);
          }
        }}
      />
    );
  }
  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      formatOptionLabel={(
        option: MovementSpeedOption,
        { context }: { context: "menu" | "value" }
      ) => {
        return (
          <OptionLabelWithInfo
            info={
              context === "menu" && option.value > 0
                ? `${String(Math.round(option.value * 100) / 100)} ${l10n(
                    "FIELD_PIXELS_PER_FRAME_SHORT"
                  )}`
                : ""
            }
          >
            {option.label}{" "}
            {option.value === 0.5 && context === "menu"
              ? `(${l10n("FIELD_SLOWER")})`
              : ""}
            {option.value === 4 && context === "menu"
              ? `(${l10n("FIELD_FASTER")})`
              : ""}
          </OptionLabelWithInfo>
        );
      }}
      onChange={(newValue: MovementSpeedOption) => {
        onChange?.(newValue.value);
      }}
    />
  );
};
