import React, { memo, useMemo } from "react";
import { useAppSelectorPickArray } from "store/hooks";
import { emoteSelectors } from "store/features/entities/entitiesSelectors";
import {
  Option,
  Select,
  OptionLabelWithPreview,
  SingleValueWithPreview,
  SelectCommonProps,
  findSelectOption,
} from "ui/form/Select";
import { EmoteCanvas } from "components/rendering/EmoteCanvas";
import { SingleValue } from "react-select";

interface EmoteSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  onChange?: (newId: string) => void;
  optional?: boolean;
  optionalLabel?: string;
}

type EmoteOption = Option;

const EmoteSelectComponent = ({
  value,
  onChange,
  optional,
  optionalLabel,
  ...selectProps
}: EmoteSelectProps) => {
  const emotes = useAppSelectorPickArray(emoteSelectors.selectAll, [
    "id",
    "name",
  ] as const);
  const options = useMemo(
    () =>
      ([] as EmoteOption[]).concat(
        optional
          ? ([
              {
                value: "",
                label: optionalLabel || "None",
              },
            ] as EmoteOption[])
          : ([] as EmoteOption[]),
        emotes.map((emote) => ({
          value: emote.id,
          label: emote.name,
        })),
      ),
    [emotes, optional, optionalLabel],
  );
  const currentValue = useMemo(() => {
    return (
      findSelectOption(options, value) ||
      findSelectOption(options, optional ? "" : options[0]?.value)
    );
  }, [options, value, optional]);

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
      formatOptionLabel={(option: EmoteOption) => {
        return (
          <OptionLabelWithPreview
            preview={<EmoteCanvas emoteId={option.value} />}
          >
            {option.label}
          </OptionLabelWithPreview>
        );
      }}
      components={{
        SingleValue: () => (
          <SingleValueWithPreview
            preview={<EmoteCanvas emoteId={value || ""} />}
          >
            {currentValue?.label}
          </SingleValueWithPreview>
        ),
      }}
      {...selectProps}
    />
  );
};

export const EmoteSelect = memo(EmoteSelectComponent);
