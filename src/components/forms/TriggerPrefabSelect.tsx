import React, { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import { triggerName } from "shared/lib/entities/entitiesHelpers";
import { triggerPrefabSelectors } from "store/features/entities/entitiesState";
import {
  FormatFolderLabel,
  Option,
  Select,
  SelectCommonProps,
} from "ui/form/Select";
import { sortByLabel } from "shared/lib/helpers/sort";
import l10n from "shared/lib/lang/l10n";

interface TriggerPrefabSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  onChange?: (newId: string) => void;
}

export const TriggerPrefabSelect = ({
  value,
  onChange,
  ...selectProps
}: TriggerPrefabSelectProps) => {
  const triggerPrefabs = useAppSelector((state) =>
    triggerPrefabSelectors.selectAll(state)
  );
  const [options, setOptions] = useState<Option[]>([]);
  const [currentValue, setCurrentValue] = useState<Option>();

  useEffect(() => {
    setOptions(
      [
        {
          label: l10n("FIELD_NONE"),
          value: "",
        },
      ].concat(
        triggerPrefabs
          .map((triggerPrefab, triggerPrefabIndex) => ({
            label: triggerName(triggerPrefab, triggerPrefabIndex),
            value: triggerPrefab.id,
          }))
          .sort(sortByLabel)
      )
    );
  }, [triggerPrefabs]);

  useEffect(() => {
    setCurrentValue(
      options.find((option) => {
        return option.value === value;
      })
    );
  }, [options, value]);

  const onSelectChange = useCallback(
    (newValue: Option) => {
      onChange?.(newValue.value);
    },
    [onChange]
  );

  return (
    <Select
      value={currentValue}
      options={options}
      onChange={onSelectChange}
      formatOptionLabel={(option: Option) => {
        return <FormatFolderLabel label={option.label} />;
      }}
      {...selectProps}
    />
  );
};
