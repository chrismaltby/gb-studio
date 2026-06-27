import React, { memo, useMemo } from "react";
import { useAppSelectorPickArray } from "store/hooks";
import { emoteSelectors } from "store/features/entities/entitiesSelectors";
import {
  Option,
  Select,
  OptionLabelWithPreview,
  SingleValueWithPreview,
  SelectCommonProps,
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
    const currentEmote = emotes.find((item) => item.id === value);
    if (currentEmote) {
      return {
        value: currentEmote.id,
        label: `${currentEmote.name}`,
      };
    }
    if (optional) {
      return {
        value: "",
        label: optionalLabel || "None",
      };
    }
    const firstEmote = emotes[0];
    return firstEmote
      ? {
          value: firstEmote.id,
          label: `${firstEmote.name}`,
        }
      : undefined;
  }, [emotes, value, optional, optionalLabel]);

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
