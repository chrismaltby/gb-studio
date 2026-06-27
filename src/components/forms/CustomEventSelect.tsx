import React, { memo, useCallback, useMemo } from "react";
import { useAppSelectorPickArray } from "store/hooks";
import { customEventName } from "shared/lib/entities/entitiesHelpers";
import { customEventSelectors } from "store/features/entities/entitiesSelectors";
import {
  FormatFolderLabel,
  Option,
  Select,
  SelectCommonProps,
} from "ui/form/Select";
import { sortByLabel } from "shared/lib/helpers/sort";
import { SingleValue } from "react-select";

interface CustomEventSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  onChange?: (newId: string) => void;
}

const CustomEventSelectComponent = ({
  value,
  onChange,
  ...selectProps
}: CustomEventSelectProps) => {
  const customEvents = useAppSelectorPickArray(customEventSelectors.selectAll, [
    "id",
    "name",
  ] as const);
  const options = useMemo(() => {
    return customEvents
      .map((customEvent, customEventIndex) => ({
        label: customEventName(customEvent, customEventIndex),
        value: customEvent.id,
      }))
      .sort(sortByLabel);
  }, [customEvents]);
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

export const CustomEventSelect = memo(CustomEventSelectComponent);
