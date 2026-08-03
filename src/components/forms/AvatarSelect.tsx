import React, { memo, useMemo } from "react";
import { useAppSelectorPickArray } from "store/hooks";
import { avatarSelectors } from "store/features/entities/entitiesSelectors";
import {
  Option,
  Select,
  OptionLabelWithPreview,
  SingleValueWithPreview,
  SelectCommonProps,
  findSelectOption,
} from "ui/form/Select";
import { AvatarCanvas } from "components/rendering/AvatarCanvas";
import { SingleValue } from "react-select";

interface AvatarSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  onChange?: (newId: string) => void;
  optional?: boolean;
  optionalLabel?: string;
}

type AvatarOption = Option;

const AvatarSelectComponent = ({
  value,
  onChange,
  optional,
  optionalLabel,
  ...selectProps
}: AvatarSelectProps) => {
  const avatars = useAppSelectorPickArray(avatarSelectors.selectAll, [
    "id",
    "name",
  ] as const);
  const options = useMemo(
    () =>
      ([] as AvatarOption[]).concat(
        optional
          ? ([
              {
                value: "",
                label: optionalLabel || "None",
              },
            ] as AvatarOption[])
          : ([] as AvatarOption[]),
        avatars.map((avatar) => ({
          value: avatar.id,
          label: avatar.name,
        })),
      ),
    [avatars, optional, optionalLabel],
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
      formatOptionLabel={(option: AvatarOption) => {
        return (
          <OptionLabelWithPreview
            preview={<AvatarCanvas avatarId={option.value} />}
          >
            {option.label}
          </OptionLabelWithPreview>
        );
      }}
      components={{
        SingleValue: () => (
          <SingleValueWithPreview
            preview={<AvatarCanvas avatarId={value || ""} />}
          >
            {currentValue?.label}
          </SingleValueWithPreview>
        ),
      }}
      {...selectProps}
    />
  );
};

export const AvatarSelect = memo(AvatarSelectComponent);
