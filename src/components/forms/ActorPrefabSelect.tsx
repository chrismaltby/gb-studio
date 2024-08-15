import React, { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import { actorName } from "shared/lib/entities/entitiesHelpers";
import { actorPrefabSelectors } from "store/features/entities/entitiesState";
import {
  FormatFolderLabel,
  Option,
  Select,
  SelectCommonProps,
} from "ui/form/Select";
import { sortByLabel } from "shared/lib/helpers/sort";
import l10n from "shared/lib/lang/l10n";

interface ActorPrefabSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  onChange?: (newId: string) => void;
}

export const ActorPrefabSelect = ({
  value,
  onChange,
  ...selectProps
}: ActorPrefabSelectProps) => {
  const actorPrefabs = useAppSelector((state) =>
    actorPrefabSelectors.selectAll(state)
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
        actorPrefabs
          .map((actorPrefab, actorPrefabIndex) => ({
            label: actorName(actorPrefab, actorPrefabIndex),
            value: actorPrefab.id,
          }))
          .sort(sortByLabel)
      )
    );
  }, [actorPrefabs]);

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
