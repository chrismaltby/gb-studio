import l10n from "renderer/lib/l10n";
import React, { useMemo } from "react";
import { UnitType, unitTypes } from "store/features/entities/entitiesTypes";
import styled from "styled-components";
import { Button } from "ui/buttons/Button";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { CheckIcon, BlankIcon } from "ui/icons/Icons";
import { MenuItem, MenuItemIcon } from "ui/menu/Menu";

interface UnitsSelectButtonInputOverlayProps {
  parentValue?: string;
  parentValueOffset?: number;
  value?: UnitType;
  allowedValues?: UnitType[];
  onChange?: (newValue: UnitType) => void;
}

const UnitsWrapper = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 1px;
  display: flex;
  align-items: center;
  pointer-events: none;
`;

interface HiddenValueProps {
  offset: number;
}

const HiddenValue = styled.div<HiddenValueProps>`
  padding: 2px;
  opacity: 0;
  font-size: ${(props) => props.theme.typography.fontSize};
  padding: 5px;
  padding-right: 5px;
  box-sizing: border-box;
  pointer-events: none;
  margin-right: ${(props) => props.offset}px;
`;

const Units = styled.div`
  background: ${(props) => props.theme.colors.input.background};
  pointer-events: all;

  ${Button} {
    opacity: 0.5;
    padding: 1px;
    min-width: 0;

    &:hover {
      opacity: 1;
    }
  }
`;

export const UnitsSelectButtonInputOverlay = ({
  parentValue,
  parentValueOffset = 0,
  value,
  allowedValues,
  onChange,
}: UnitsSelectButtonInputOverlayProps) => {
  const unitTypeNames: Record<UnitType, string> = useMemo(
    () => ({
      tiles: l10n("FIELD_TILES"),
      pixels: l10n("FIELD_PIXELS"),
      time: l10n("FIELD_SECONDS"),
      frames: l10n("FIELD_FRAMES"),
    }),
    []
  );

  const unitTypeButtonNames: Record<UnitType, string> = useMemo(
    () => ({
      tiles: l10n("FIELD_TILES").toLocaleLowerCase(),
      pixels: l10n("FIELD_PIXELS_SHORT").toLocaleLowerCase(),
      time: l10n("FIELD_SECONDS").toLocaleLowerCase(),
      frames: l10n("FIELD_FRAMES").toLocaleLowerCase(),
    }),
    []
  );

  const allValues = allowedValues ? allowedValues : unitTypes;
  const currentValue = value && unitTypeButtonNames[value];
  return (
    <UnitsWrapper>
      <HiddenValue offset={parentValueOffset}>{parentValue}</HiddenValue>
      <Units>
        {allowedValues ? (
          <DropdownButton
            label={currentValue}
            showArrow={false}
            size="small"
            variant="transparent"
          >
            {allValues.map((item) => (
              <MenuItem key={item} onClick={() => onChange?.(item)}>
                <MenuItemIcon>
                  {value === item ? <CheckIcon /> : <BlankIcon />}
                </MenuItemIcon>
                {unitTypeNames[item]}
              </MenuItem>
            ))}
          </DropdownButton>
        ) : (
          <Button size="small" variant="transparent">
            {currentValue}
          </Button>
        )}
      </Units>
    </UnitsWrapper>
  );
};
