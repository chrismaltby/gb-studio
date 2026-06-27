import React, { memo, useCallback, useMemo } from "react";
import { Select, SelectCommonProps } from "ui/form/Select";
import l10n from "shared/lib/lang/l10n";
import { SingleValue } from "react-select";

type AutoTileFlipSelectProps =
  | ({
      allowDefault: true;
      value?: boolean;
      onChange?: (newId: boolean | undefined) => void;
    } & SelectCommonProps)
  | ({
      allowDefault?: false | undefined;
      value?: boolean;
      onChange?: (newId: boolean) => void;
    } & SelectCommonProps);

interface AutoTileFlipOption {
  value: boolean | undefined;
  label: string;
}

const AutoTileFlipSelectComponent = ({
  value,
  allowDefault,
  onChange,
}: AutoTileFlipSelectProps) => {
  const autoTileFlipOptions: AutoTileFlipOption[] = useMemo(() => {
    const options = allowDefault
      ? [
          {
            value: undefined,
            label: l10n("FIELD_NONE"),
          },
        ]
      : ([] as AutoTileFlipOption[]);

    return options.concat([
      {
        value: true,
        label: l10n(allowDefault ? "FIELD_ENABLED" : "FIELD_ENABLED_DEFAULT"),
      },
      {
        value: false,
        label: l10n("FIELD_DISABLED"),
      },
    ]);
  }, [allowDefault]);

  const currentValue = useMemo(
    () => autoTileFlipOptions.find((option) => option.value === value),
    [autoTileFlipOptions, value],
  );

  const onSelectChange = useCallback(
    (newValue: SingleValue<AutoTileFlipOption>) => {
      if (newValue) {
        if (allowDefault) {
          onChange?.(newValue.value);
        } else {
          onChange?.(!!newValue.value);
        }
      }
    },
    [allowDefault, onChange],
  );

  return (
    <Select
      value={currentValue}
      options={autoTileFlipOptions}
      onChange={onSelectChange}
    />
  );
};

export const AutoTileFlipSelect = memo<AutoTileFlipSelectProps>(
  AutoTileFlipSelectComponent,
);
