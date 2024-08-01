import React, { useMemo } from "react";
import { CollisionGroup } from "shared/lib/entities/entitiesTypes";
import l10n from "shared/lib/lang/l10n";
import { ToggleButtonGroup } from "ui/form/ToggleButtonGroup";

type CollisionMaskPickerProps = {
  id: string;
  includePlayer?: boolean;
  includeNone?: boolean;
} & (
  | {
      multiple: true;
      value: CollisionGroup[];
      onChange: (newValue: CollisionGroup[]) => void;
    }
  | {
      multiple?: false;
      value: CollisionGroup;
      onChange: (newValue: CollisionGroup) => void;
    }
);

interface CollisionMaskPickerOption {
  value: CollisionGroup;
  label: React.ReactNode;
  title: string;
}

const CollisionMaskPicker = ({
  id,
  includePlayer,
  includeNone,
  ...props
}: CollisionMaskPickerProps) => {
  const options = useMemo(
    () =>
      ([] as CollisionMaskPickerOption[]).concat(
        includeNone && !props.multiple
          ? [
              {
                value: "",
                label: "None",
                title: l10n("FIELD_NONE"),
              },
            ]
          : [],
        includePlayer
          ? [
              {
                value: "player",
                label: "Player",
                title: l10n("FIELD_PLAYER"),
              },
            ]
          : [],
        [
          {
            value: "1",
            label: "1",
            title: l10n("FIELD_COLLISION_GROUP_N", { n: 1 }),
          },
          {
            value: "2",
            label: "2",
            title: l10n("FIELD_COLLISION_GROUP_N", { n: 2 }),
          },
          {
            value: "3",
            label: "3",
            title: l10n("FIELD_COLLISION_GROUP_N", { n: 3 }),
          },
        ]
      ) as CollisionMaskPickerOption[],
    [includeNone, includePlayer, props.multiple]
  );
  return <ToggleButtonGroup name={id} options={options} {...props} />;
};

export default CollisionMaskPicker;
