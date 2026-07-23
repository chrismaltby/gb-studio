import React, { memo, useCallback, useMemo } from "react";
import { useAppSelector } from "store/hooks";
import { variableSelectors } from "store/features/entities/entitiesSelectors";
import {
  FormatFolderLabel,
  Option,
  Select,
  SelectCommonProps,
} from "ui/form/Select";
import { sortByLabel } from "shared/lib/helpers/sort";
import { SingleValue } from "react-select";
import { isGlobalVariableId } from "shared/lib/variables/variableNames";
import { getParentPath } from "shared/lib/helpers/virtualFilesystem";

interface VariableArraySelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  onChange?: (newValue: string) => void;
}

// Selects a variable array — a folder of global variables in the
// variables list (as created with "Add Array" in the variables navigator)
const VariableArraySelectComponent = ({
  value,
  onChange,
  ...selectProps
}: VariableArraySelectProps) => {
  const variables = useAppSelector(variableSelectors.selectAll);

  const options = useMemo(() => {
    const folderPaths = new Set<string>();
    for (const variable of variables) {
      if (!isGlobalVariableId(variable.id)) {
        continue;
      }
      const folderPath = getParentPath(variable.name);
      if (folderPath) {
        folderPaths.add(folderPath);
      }
    }
    return Array.from(folderPaths)
      .map((folderPath) => ({
        label: folderPath,
        value: folderPath,
      }))
      .sort(sortByLabel);
  }, [variables]);

  const currentValue = useMemo(() => {
    const existing = options.find((option) => option.value === value);
    if (existing) {
      return existing;
    }
    // Keep selections visible even when the folder no longer exists
    if (value) {
      return { label: value, value };
    }
    return undefined;
  }, [options, value]);

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

export const VariableArraySelect = memo(VariableArraySelectComponent);
