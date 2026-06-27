import React, { memo, useMemo } from "react";
import { useAppSelectorPickArray } from "store/hooks";
import { fontSelectors } from "store/features/entities/entitiesSelectors";
import {
  Option,
  Select,
  OptionLabelWithPreview,
  SingleValueWithPreview,
  SelectCommonProps,
} from "ui/form/Select";
import { FontIcon } from "ui/icons/Icons";
import { SingleValue } from "react-select";

interface FontSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  onChange?: (newId: string) => void;
  optional?: boolean;
  optionalLabel?: string;
}

type FontOption = Option;

const FontSelectComponent = ({
  value,
  onChange,
  optional,
  optionalLabel,
  ...selectProps
}: FontSelectProps) => {
  const fonts = useAppSelectorPickArray(fontSelectors.selectAll, [
    "id",
    "name",
  ] as const);
  const options = useMemo(
    () =>
      ([] as FontOption[]).concat(
        optional
          ? ([
              {
                value: "",
                label: optionalLabel || "None",
              },
            ] as FontOption[])
          : ([] as FontOption[]),
        fonts.map((font) => ({
          value: font.id,
          label: font.name,
        })),
      ),
    [fonts, optional, optionalLabel],
  );
  const currentValue = useMemo(() => {
    const currentFont = fonts.find((item) => item.id === value);
    if (currentFont) {
      return {
        value: currentFont.id,
        label: `${currentFont.name}`,
      };
    }
    if (optional) {
      return {
        value: "",
        label: optionalLabel || "None",
      };
    }
    const firstFont = fonts[0];
    return firstFont
      ? {
          value: firstFont.id,
          label: `${firstFont.name}`,
        }
      : undefined;
  }, [fonts, value, optional, optionalLabel]);

  const onSelectChange = (newValue: SingleValue<Option>) => {
    if (newValue) {
      onChange?.(newValue.value);
    }
  };

  return (
    <Select
      value={currentValue}
      options={options}
      onChange={onSelectChange}
      formatOptionLabel={(option: FontOption) => {
        return (
          <OptionLabelWithPreview preview={<FontIcon />}>
            {option.label}
          </OptionLabelWithPreview>
        );
      }}
      components={{
        SingleValue: () => (
          <SingleValueWithPreview preview={<FontIcon />}>
            {currentValue?.label}
          </SingleValueWithPreview>
        ),
      }}
      {...selectProps}
    />
  );
};

export const FontSelect = memo(FontSelectComponent);
