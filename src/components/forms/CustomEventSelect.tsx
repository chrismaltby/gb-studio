import React, { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import { customEventName } from "shared/lib/entities/entitiesHelpers";
import { customEventSelectors } from "store/features/entities/entitiesState";
import {
  FormatFolderLabel,
  Option,
  Select,
  SelectCommonProps,
} from "ui/form/Select";
import { sortByLabel } from "shared/lib/helpers/sort";

interface CustomEventSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  onChange?: (newId: string) => void;
}

export const CustomEventSelect = ({
  value,
  onChange,
  ...selectProps
}: CustomEventSelectProps) => {
  const customEvents = useAppSelector((state) =>
    customEventSelectors.selectAll(state)
  );
  const [options, setOptions] = useState<Option[]>([]);
  const [currentValue, setCurrentValue] = useState<Option>();

  useEffect(() => {
    setOptions(
      customEvents
        .map((customEvent, customEventIndex) => ({
          label: customEventName(customEvent, customEventIndex),
          value: customEvent.id,
        }))
        .sort(sortByLabel)
    );
  }, [customEvents]);

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
