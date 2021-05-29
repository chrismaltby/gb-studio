import React, { FC } from "react";
import l10n from "lib/helpers/l10n";
import { ActorSpriteType } from "store/features/entities/entitiesTypes";
import { Select } from "ui/form/Select";

interface SpriteTypeSelectProps {
  name: string;
  value?: ActorSpriteType;
  onChange?: (newValue: ActorSpriteType) => void;
}

interface SpriteTypeOption {
  value: ActorSpriteType;
  label: string;
}

const options: SpriteTypeOption[] = [
  { value: "static", label: l10n("FIELD_MOVEMENT_STATIC") },
  { value: "actor", label: l10n("ACTOR") },
];

export const SpriteTypeSelect: FC<SpriteTypeSelectProps> = ({
  name,
  value,
  onChange,
}) => {
  const currentValue = options.find((o) => o.value === value);
  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      onChange={(newValue: SpriteTypeOption) => {
        onChange?.(newValue.value);
      }}
    />
  );
};
