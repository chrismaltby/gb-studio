import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/configureStore";
import { customEventName } from "store/features/entities/entitiesHelpers";
import { customEventSelectors } from "store/features/entities/entitiesState";
import { Option, Select, SelectCommonProps } from "ui/form/Select";
import { sortByLabel } from "lib/helpers/sort";

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
  const customEvents = useSelector((state: RootState) =>
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
      {...selectProps}
    />
  );
};
