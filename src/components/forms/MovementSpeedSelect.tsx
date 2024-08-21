import React, { FC, useEffect, useMemo, useState } from "react";
import l10n from "shared/lib/lang/l10n";
import { Input } from "ui/form/Input";
import { OptionLabelWithInfo, Select } from "ui/form/Select";

interface MovementSpeedSelectProps {
  name: string;
  value?: number;
  allowNone?: boolean;
  noneLabel?: string;
  onChange?: (newValue: number) => void;
}

interface MovementSpeedOption {
  value: number | undefined;
  label: string;
}

export const MovementSpeedSelect: FC<MovementSpeedSelectProps> = ({
  name,
  value = 1,
  allowNone,
  noneLabel,
  onChange,
}) => {
  const [currentValue, setCurrentValue] =
    useState<MovementSpeedOption | undefined>();
  const [{ isCustom, autoFocus }, setIsCustom] = useState({
    isCustom: false,
    autoFocus: false,
  });

  const options: MovementSpeedOption[] = useMemo(
    () => [
      { value: 0.25, label: `${l10n("FIELD_SPEED")} ¼` },
      { value: 0.5, label: `${l10n("FIELD_SPEED")} ½` },
      { value: 1, label: `${l10n("FIELD_SPEED")} 1` },
      { value: 2, label: `${l10n("FIELD_SPEED")} 2` },
      { value: 3, label: `${l10n("FIELD_SPEED")} 3` },
      { value: 4, label: `${l10n("FIELD_SPEED")} 4` },
      { value: undefined, label: `${l10n("FIELD_CUSTOM_SPEED")}` },
    ],
    []
  );

  const optionsWithNone: MovementSpeedOption[] = useMemo(
    () => [
      { value: 0, label: noneLabel ?? `${l10n("FIELD_NONE")}` },
      ...options,
    ],
    [noneLabel, options]
  );

  useEffect(() => {
    const current = (allowNone ? optionsWithNone : options).find(
      (o) => o.value === value
    );
    setCurrentValue(current);
    if (value === undefined || !current) {
      setIsCustom({ isCustom: true, autoFocus: false });
    }
  }, [allowNone, options, optionsWithNone, value]);

  if (isCustom) {
    return (
      <Input
        autoFocus={autoFocus}
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
            setIsCustom({ isCustom: false, autoFocus: false });
          }
        }}
      />
    );
  }
  return (
    <Select
      name={name}
      value={currentValue}
      options={allowNone ? optionsWithNone : options}
      formatOptionLabel={(
        option: MovementSpeedOption,
        { context }: { context: "menu" | "value" }
      ) => {
        return (
          <OptionLabelWithInfo
            info={
              context === "menu" && option.value && option.value > 0
                ? `${String(Math.round(option.value * 100) / 100)} ${l10n(
                    "FIELD_PIXELS_PER_FRAME_SHORT"
                  )}`
                : ""
            }
          >
            {option.label}{" "}
            {option.value === 0.25 && context === "menu"
              ? `(${l10n("FIELD_SLOWER")})`
              : ""}
            {option.value === 4 && context === "menu"
              ? `(${l10n("FIELD_FASTER")})`
              : ""}
          </OptionLabelWithInfo>
        );
      }}
      onChange={(newValue: MovementSpeedOption) => {
        if (newValue.value !== undefined) {
          onChange?.(newValue.value);
        } else {
          setIsCustom({ isCustom: true, autoFocus: true });
        }
      }}
    />
  );
};
