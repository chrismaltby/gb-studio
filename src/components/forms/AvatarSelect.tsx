import React, { FC, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/configureStore";
import { avatarSelectors } from "store/features/entities/entitiesState";
import { Avatar } from "store/features/entities/entitiesTypes";
import {
  Option,
  Select,
  OptionLabelWithPreview,
  SingleValueWithPreview,
  SelectCommonProps,
} from "ui/form/Select";
import { AvatarCanvas } from "../world/AvatarCanvas";

interface AvatarSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  onChange?: (newId: string) => void;
  optional?: boolean;
  optionalLabel?: string;
  optionalDefaultAvatarId?: string;
}

interface AvatarOption extends Option {
  avatar: Avatar;
}

export const AvatarSelect: FC<AvatarSelectProps> = ({
  value,
  onChange,
  optional,
  optionalLabel,
  optionalDefaultAvatarId,
  ...selectProps
}) => {
  const avatars = useSelector((state: RootState) =>
    avatarSelectors.selectAll(state)
  );
  const [options, setOptions] = useState<AvatarOption[]>([]);
  const [currentAvatar, setCurrentAvatar] = useState<Avatar>();
  const [currentValue, setCurrentValue] = useState<AvatarOption>();

  useEffect(() => {
    setOptions(
      ([] as AvatarOption[]).concat(
        optional
          ? ([
              {
                value: "",
                label: optionalLabel || "None",
                avatar: avatars.find((p) => p.id === optionalDefaultAvatarId),
              },
            ] as AvatarOption[])
          : ([] as AvatarOption[]),
        avatars.map((avatar) => ({
          value: avatar.id,
          label: avatar.name,
          avatar,
        }))
      )
    );
  }, [avatars, optional, optionalDefaultAvatarId, optionalLabel]);

  useEffect(() => {
    setCurrentAvatar(avatars.find((v) => v.id === value));
  }, [avatars, value]);

  useEffect(() => {
    if (currentAvatar) {
      setCurrentValue({
        value: currentAvatar.id,
        label: `${currentAvatar.name}`,
        avatar: currentAvatar,
      });
    } else if (optional) {
      const optionalAvatar = avatars.find(
        (p) => p.id === optionalDefaultAvatarId
      );
      setCurrentValue({
        value: "",
        label: optionalLabel || "None",
        avatar: optionalAvatar as Avatar,
      });
    } else {
      const firstAvatar = avatars[0];
      if (firstAvatar) {
        setCurrentValue({
          value: firstAvatar.id,
          label: `${firstAvatar.name}`,
          avatar: firstAvatar,
        });
      }
    }
  }, [
    currentAvatar,
    avatars,
    optional,
    optionalDefaultAvatarId,
    optionalLabel,
  ]);

  const onSelectChange = (newValue: Option) => {
    onChange?.(newValue.value);
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
