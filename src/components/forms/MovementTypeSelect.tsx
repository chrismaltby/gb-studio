import React, { FC, useMemo } from "react";
import l10n from "renderer/lib/l10n";
import {
  MovementType,
  movementTypes,
} from "store/features/entities/entitiesTypes";
import { DropdownButton } from "ui/buttons/DropdownButton";
import {
  BlankIcon,
  CheckIcon,
  CursorDiagonalIcon,
  CursorHorizontalIcon,
  CursorVeticalIcon,
} from "ui/icons/Icons";
import { MenuGroup, MenuItem, MenuItemIcon } from "ui/menu/Menu";
import { FlexGrow } from "ui/spacing/Spacing";
import styled from "styled-components";

interface MovementTypeSelectProps {
  value?: MovementType;
  onChange?: (newValue: MovementType) => void;
}

const movementTypeIconsLookup: Record<MovementType, JSX.Element> = {
  horizontal: <CursorHorizontalIcon />,
  vertical: <CursorVeticalIcon />,
  diagonal: <CursorDiagonalIcon />,
};

const MenuSpacer = styled.div`
  width: 10px;
`;

export const MovementTypeSelect: FC<MovementTypeSelectProps> = ({
  value,
  onChange,
}) => {
  const selectedIcon = value ? (
    movementTypeIconsLookup[value]
  ) : (
    <CursorHorizontalIcon />
  );
  const movementTypeNamesLookup: Record<MovementType, string> = useMemo(
    () => ({
      horizontal: l10n("FIELD_HORIZONTAL_FIRST"),
      vertical: l10n("FIELD_VERTICAL_FIRST"),
      diagonal: l10n("FIELD_DIAGONAL"),
    }),
    []
  );

  const title = `${l10n("FIELD_MOVEMENT_TYPE")}${value ? ": " : ""}${
    value ? movementTypeNamesLookup[value] : ""
  }`;
  return (
    <DropdownButton label={selectedIcon} showArrow={false} title={title}>
      <MenuGroup>{l10n("FIELD_MOVEMENT_TYPE")}</MenuGroup>
      {movementTypes.map((movementType) => (
        <MenuItem
          key={movementType}
          onClick={() => {
            onChange?.(movementType);
          }}
        >
          <MenuItemIcon>
            {value === movementType ? <CheckIcon /> : <BlankIcon />}
          </MenuItemIcon>
          <FlexGrow>{movementTypeNamesLookup[movementType]}</FlexGrow>
          <MenuSpacer />
          <MenuItemIcon>{movementTypeIconsLookup[movementType]}</MenuItemIcon>
        </MenuItem>
      ))}
    </DropdownButton>
  );
};

MovementTypeSelect.defaultProps = {
  value: "horizontal",
};
