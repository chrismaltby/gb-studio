import l10n from "shared/lib/lang/l10n";
import React, { useMemo } from "react";
import { UnitType } from "shared/lib/entities/entitiesTypes";
import styled from "styled-components";
import { Button } from "ui/buttons/Button";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { CheckIcon, BlankIcon } from "ui/icons/Icons";
import { MenuItem } from "ui/menu/Menu";
import { StyledButton } from "ui/buttons/style";

interface UnitSelectLabelButtonProps<T extends UnitType = UnitType> {
  value?: T;
  allowedValues?: readonly T[];
  onChange?: (newValue: T) => void;
}

const Units = styled.div`
  display: inline-flex;
  pointer-events: all;
  margin: -6px 3px;

  ${StyledButton} {
    opacity: 0.5;
    padding: 1px;
    min-width: 0;
    height: 18px;

    &:hover {
      opacity: 1;
    }
  }
`;

export const UnitSelectLabelButton = <T extends UnitType>({
  value,
  allowedValues,
  onChange,
}: UnitSelectLabelButtonProps<T>) => {
  const unitTypeNames: Record<UnitType, string> = useMemo(
    () => ({
      tiles: l10n("FIELD_TILES"),
      pixels: l10n("FIELD_PIXELS"),
      time: l10n("FIELD_SECONDS"),
      frames: l10n("FIELD_FRAMES"),
      "8px": "8px",
      "16px": "16px",
    }),
    [],
  );

  const unitTypeButtonNames: Record<UnitType, string> = useMemo(
    () => ({
      tiles: l10n("FIELD_TILES").toLocaleLowerCase(),
      pixels: l10n("FIELD_PIXELS_SHORT").toLocaleLowerCase(),
      time: l10n("FIELD_SECONDS").toLocaleLowerCase(),
      frames: l10n("FIELD_FRAMES").toLocaleLowerCase(),
      "8px": "8px",
      "16px": "16px",
    }),
    [],
  );

  const currentValue = value && unitTypeButtonNames[value];
  return (
    <Units>
      {allowedValues ? (
        <DropdownButton
          label={currentValue}
          showArrow={false}
          size="small"
          variant="transparent"
          type="button"
        >
          {allowedValues.map((item) => (
            <MenuItem
              key={item}
              onClick={() => onChange?.(item)}
              icon={value === item ? <CheckIcon /> : <BlankIcon />}
            >
              {unitTypeNames[item]}
            </MenuItem>
          ))}
        </DropdownButton>
      ) : (
        <Button size="small" variant="transparent" type="button">
          {currentValue}
        </Button>
      )}
    </Units>
  );
};
