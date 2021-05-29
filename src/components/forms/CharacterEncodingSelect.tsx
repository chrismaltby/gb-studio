import React, { FC, useEffect, useState } from "react";
import { Option, Select, SelectCommonProps } from "ui/form/Select";
import l10n from "lib/helpers/l10n";
import { encodings } from "lib/helpers/encodings";

interface CharacterEncodingSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  onChange?: (newId: string) => void;
}

interface FontOption extends Option {
  value: string;
  label: string;
}

const options: FontOption[] = [
  { value: "", label: `ISO/IEC 8859-1 (${l10n("FIELD_DEFAULT")})` },
].concat(
  encodings.map((encoding) => ({
    value: encoding.id,
    label: encoding.name || encoding.id,
  }))
);

export const CharacterEncodingSelect: FC<CharacterEncodingSelectProps> = ({
  value,
  onChange,
  ...selectProps
}) => {
  const [currentValue, setCurrentValue] = useState<FontOption>();

  useEffect(() => {
    setCurrentValue(options.find((v) => v.value === value));
  }, [value]);

  const onSelectChange = (newValue: Option) => {
    onChange?.(newValue.value);
  };

  return (
    <Select
      value={currentValue}
      options={options}
      onChange={onSelectChange}
      {...selectProps}
    />
  );
};
