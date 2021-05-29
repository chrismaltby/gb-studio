import React, { FC, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/configureStore";
import { fontSelectors } from "store/features/entities/entitiesState";
import { Font } from "store/features/entities/entitiesTypes";
import {
  Option,
  Select,
  OptionLabelWithPreview,
  SingleValueWithPreview,
  SelectCommonProps,
} from "ui/form/Select";
import { FontIcon } from "ui/icons/Icons";

interface FontSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  onChange?: (newId: string) => void;
  optional?: boolean;
  optionalLabel?: string;
  optionalDefaultFontId?: string;
}

interface FontOption extends Option {
  font: Font;
}

export const FontSelect: FC<FontSelectProps> = ({
  value,
  onChange,
  optional,
  optionalLabel,
  optionalDefaultFontId,
  ...selectProps
}) => {
  const fonts = useSelector((state: RootState) =>
    fontSelectors.selectAll(state)
  );
  const [options, setOptions] = useState<FontOption[]>([]);
  const [currentFont, setCurrentFont] = useState<Font>();
  const [currentValue, setCurrentValue] = useState<FontOption>();

  useEffect(() => {
    setOptions(
      ([] as FontOption[]).concat(
        optional
          ? ([
              {
                value: "",
                label: optionalLabel || "None",
                font: fonts.find((p) => p.id === optionalDefaultFontId),
              },
            ] as FontOption[])
          : ([] as FontOption[]),
        fonts.map((font) => ({
          value: font.id,
          label: font.name,
          font,
        }))
      )
    );
  }, [fonts, optional, optionalDefaultFontId, optionalLabel]);

  useEffect(() => {
    setCurrentFont(fonts.find((v) => v.id === value));
  }, [fonts, value]);

  useEffect(() => {
    if (currentFont) {
      setCurrentValue({
        value: currentFont.id,
        label: `${currentFont.name}`,
        font: currentFont,
      });
    } else if (optional) {
      const optionalFont = fonts.find((p) => p.id === optionalDefaultFontId);
      setCurrentValue({
        value: "",
        label: optionalLabel || "None",
        font: optionalFont as Font,
      });
    } else {
      const firstFont = fonts[0];
      if (firstFont) {
        setCurrentValue({
          value: firstFont.id,
          label: `${firstFont.name}`,
          font: firstFont,
        });
      }
    }
  }, [currentFont, fonts, optional, optionalDefaultFontId, optionalLabel]);

  const onSelectChange = (newValue: Option) => {
    onChange?.(newValue.value);
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
