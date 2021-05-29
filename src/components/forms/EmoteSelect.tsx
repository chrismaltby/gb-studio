import React, { FC, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/configureStore";
import { emoteSelectors } from "store/features/entities/entitiesState";
import { Emote } from "store/features/entities/entitiesTypes";
import {
  Option,
  Select,
  OptionLabelWithPreview,
  SingleValueWithPreview,
  SelectCommonProps,
} from "ui/form/Select";
import { EmoteCanvas } from "../world/EmoteCanvas";

interface EmoteSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  onChange?: (newId: string) => void;
  optional?: boolean;
  optionalLabel?: string;
  optionalDefaultEmoteId?: string;
}

interface EmoteOption extends Option {
  emote: Emote;
}

export const EmoteSelect: FC<EmoteSelectProps> = ({
  value,
  onChange,
  optional,
  optionalLabel,
  optionalDefaultEmoteId,
  ...selectProps
}) => {
  const emotes = useSelector((state: RootState) =>
    emoteSelectors.selectAll(state)
  );
  const [options, setOptions] = useState<EmoteOption[]>([]);
  const [currentEmote, setCurrentEmote] = useState<Emote>();
  const [currentValue, setCurrentValue] = useState<EmoteOption>();

  useEffect(() => {
    setOptions(
      ([] as EmoteOption[]).concat(
        optional
          ? ([
              {
                value: "",
                label: optionalLabel || "None",
                emote: emotes.find((p) => p.id === optionalDefaultEmoteId),
              },
            ] as EmoteOption[])
          : ([] as EmoteOption[]),
        emotes.map((emote) => ({
          value: emote.id,
          label: emote.name,
          emote,
        }))
      )
    );
  }, [emotes, optional, optionalDefaultEmoteId, optionalLabel]);

  useEffect(() => {
    setCurrentEmote(emotes.find((v) => v.id === value));
  }, [emotes, value]);

  useEffect(() => {
    if (currentEmote) {
      setCurrentValue({
        value: currentEmote.id,
        label: `${currentEmote.name}`,
        emote: currentEmote,
      });
    } else if (optional) {
      const optionalEmote = emotes.find((p) => p.id === optionalDefaultEmoteId);
      setCurrentValue({
        value: "",
        label: optionalLabel || "None",
        emote: optionalEmote as Emote,
      });
    } else {
      const firstEmote = emotes[0];
      if (firstEmote) {
        setCurrentValue({
          value: firstEmote.id,
          label: `${firstEmote.name}`,
          emote: firstEmote,
        });
      }
    }
  }, [currentEmote, emotes, optional, optionalDefaultEmoteId, optionalLabel]);

  const onSelectChange = (newValue: Option) => {
    onChange?.(newValue.value);
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
