import React, { FC } from "react";
import l10n from "shared/lib/lang/l10n";
import { variableSelectors } from "store/features/entities/entitiesState";
import { useAppSelector } from "store/hooks";
import { Select, SelectCommonProps } from "ui/form/Select";

interface FlagSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  variableId: string;
  entityId: string;
  onChange?: (newId: string) => void;
}

export const FlagSelect: FC<FlagSelectProps> = ({
  value,
  variableId,
  entityId,
  onChange,
  ...selectProps
}) => {
  const variableIsLocal = variableId && variableId.startsWith("L");

  const namedVariable = useAppSelector((state) => {
    let id = variableId;
    if (variableIsLocal) {
      id = `${entityId}__${variableId}`;
    }
    return variableSelectors.selectById(state, id);
  });

  const flagOptions = Array(16)
    .fill(0)
    .map((_, i) => {
      let namedLabel = l10n("FIELD_FLAG_N", { n: i + 1 });
      if (namedVariable?.flags && namedVariable?.flags[`flag${i + 1}`]) {
        namedLabel = namedVariable?.flags[`flag${i + 1}`];
      }
      return {
        label: namedLabel,
        value: `${i}`,
      };
    });

  const currentValue =
    flagOptions.find((o) => (value ? o.value === value : o.value === value)) ||
    flagOptions[0];

  const onFieldChange = (newOption: { value: string }) => {
    if (onChange) {
      onChange(newOption.value);
    }
  };

  return (
    <Select
      value={currentValue}
      options={flagOptions}
      onChange={onFieldChange}
      {...selectProps}
    />
  );
};
