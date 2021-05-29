import React, { FC, useEffect, useState } from "react";
import styled from "styled-components";
import {
  Option,
  Select,
  OptionLabelWithPreview,
  SingleValueWithPreview,
  SelectCommonProps,
} from "ui/form/Select";

export const instrumentColors = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "gray",
  "cyan",
  "red-alt",
  "orange-alt",
  "yellow-alt",
  "green-alt",
  "blue-alt",
  "purple-alt",
  "gray-alt",
  "cyan-alt",
];

const instruments = Array(15)
  .fill("")
  .map((_, i) => ({
    id: `${i}`,
    name: `Instrument ${i + 1}`,
  }));

interface LabelColorProps {
  color: string;
}

const LabelColor = styled.div.attrs<LabelColorProps>((props) => ({
  className: `label--${props.color}`,
}))`
  width: 10px;
  height: 10px;
  border-radius: 10px;
  flex-shrink: 0;
  margin-left: 5px;
`;

interface InstrumentSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  onChange?: (newId: string) => void;
  optional?: boolean;
  optionalLabel?: string;
  optionalDefaultInstrumentId?: string;
}

export const InstrumentSelect: FC<InstrumentSelectProps> = ({
  value,
  onChange,
  ...selectProps
}) => {
  const [options, setOptions] = useState<Option[]>([]);
  const [currentInstrument, setCurrentInstrument] =
    useState<{ id: string; name: string }>();
  const [currentValue, setCurrentValue] = useState<Option>();

  useEffect(() => {
    setOptions(
      ([] as Option[]).concat(
        [] as Option[],
        instruments.map((instrument) => ({
          value: instrument.id,
          label: instrument.name,
        }))
      )
    );
  }, []);

  useEffect(() => {
    setCurrentInstrument(instruments.find((v) => v.id === value));
  }, [value]);

  useEffect(() => {
    if (currentInstrument) {
      setCurrentValue({
        value: currentInstrument.id,
        label: `${currentInstrument.name}`,
      });
    } else {
      const firstInstrument = instruments[0];
      if (firstInstrument) {
        setCurrentValue({
          value: firstInstrument.id,
          label: `${firstInstrument.name}`,
        });
      }
    }
  }, [currentInstrument]);

  const onSelectChange = (newValue: Option) => {
    onChange?.(newValue.value);
  };

  return (
    <Select
      value={currentValue}
      options={options}
      onChange={onSelectChange}
      formatOptionLabel={(option: Option) => {
        return (
          <OptionLabelWithPreview
            preview={
              <LabelColor color={instrumentColors[parseInt(option.value)]} />
            }
          >
            {option.label}
          </OptionLabelWithPreview>
        );
      }}
      components={{
        SingleValue: () => (
          <SingleValueWithPreview
            preview={
              <LabelColor color={instrumentColors[parseInt(value || "")]} />
            }
          >
            {currentValue?.label}
          </SingleValueWithPreview>
        ),
      }}
      {...selectProps}
    />
  );
};
