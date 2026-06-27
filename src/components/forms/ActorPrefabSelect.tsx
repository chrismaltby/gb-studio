import React, { memo, useCallback, useMemo } from "react";
import { useAppSelector } from "store/hooks";
import { actorName } from "shared/lib/entities/entitiesHelpers";
import { actorPrefabSelectors } from "store/features/entities/entitiesSelectors";
import {
  FormatFolderLabel,
  Option,
  Select,
  SelectCommonProps,
} from "ui/form/Select";
import { sortByLabel } from "shared/lib/helpers/sort";
import l10n from "shared/lib/lang/l10n";
import { SingleValue } from "react-select";

interface ActorPrefabSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  onChange?: (newId: string) => void;
}

const ActorPrefabSelectComponent = ({
  value,
  onChange,
  ...selectProps
}: ActorPrefabSelectProps) => {
  const actorPrefabs = useAppSelector((state) =>
    actorPrefabSelectors.selectAll(state),
  );

  const options = useMemo<Option[]>(
    () =>
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
          .sort(sortByLabel),
      ),
    [actorPrefabs],
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

export const ActorPrefabSelect = memo(ActorPrefabSelectComponent);
