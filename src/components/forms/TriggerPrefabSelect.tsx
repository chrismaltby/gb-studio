import React, { memo, useCallback, useMemo } from "react";
import { useAppSelector } from "store/hooks";
import { triggerName } from "shared/lib/entities/entitiesHelpers";
import { triggerPrefabSelectors } from "store/features/entities/entitiesSelectors";
import {
  FormatFolderLabel,
  Option,
  Select,
  SelectCommonProps,
} from "ui/form/Select";
import { sortByLabel } from "shared/lib/helpers/sort";
import l10n from "shared/lib/lang/l10n";
import { SingleValue } from "react-select";

interface TriggerPrefabSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  onChange?: (newId: string) => void;
}

const TriggerPrefabSelectComponent = ({
  value,
  onChange,
  ...selectProps
}: TriggerPrefabSelectProps) => {
  const triggerPrefabs = useAppSelector((state) =>
    triggerPrefabSelectors.selectAll(state),
  );

  const options = useMemo<Option[]>(
    () =>
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
          .sort(sortByLabel),
      ),
    [triggerPrefabs],
  );

  const currentValue = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const onSelectChange = useCallback(
    (newValue: SingleValue<Option>) => {
      if (newValue) {
        onChange?.(newValue.value);
      }
    },
    [onChange],
  );

  const formatOptionLabel = useCallback((option: Option) => {
    return <FormatFolderLabel label={option.label} />;
  }, []);

  return (
    <Select
      value={currentValue}
      options={options}
      onChange={onSelectChange}
      formatOptionLabel={formatOptionLabel}
      {...selectProps}
    />
  );
};

export const TriggerPrefabSelect = memo(TriggerPrefabSelectComponent);
