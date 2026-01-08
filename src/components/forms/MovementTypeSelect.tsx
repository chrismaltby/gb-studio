/* eslint-disable camelcase */
import React, { FC, useMemo } from "react";
import l10n from "shared/lib/lang/l10n";
import { MovementType } from "shared/lib/entities/entitiesTypes";
import { DropdownButton } from "ui/buttons/DropdownButton";
import {
  BlankIcon,
  CheckIcon,
  CursorDiagonalIcon,
  CursorHorizontalIcon,
  CursorVerticalIcon,
  LockIcon,
} from "ui/icons/Icons";
import { MenuDivider, MenuGroup, MenuItem, MenuItemIcon } from "ui/menu/Menu";
import { FlexGrow } from "ui/spacing/Spacing";
import styled from "styled-components";

interface MovementTypeSelectProps {
  value?: MovementType;
  allowLockedDirection?: boolean;
  onChange?: (newValue: MovementType) => void;
}

const LockedIconWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  svg:nth-child(2) {
    position: absolute;
    bottom: -2px;
    right: -12px;
    width: 8px;
    height: 8px;
  }
`;

const LockedIcon = ({ children }: { children: React.ReactNode }) => (
  <LockedIconWrapper>
    {children}
    <LockIcon />
  </LockedIconWrapper>
);

const movementTypeIconsLookup: Record<MovementType, JSX.Element> = {
  horizontal: <CursorHorizontalIcon />,
  vertical: <CursorVerticalIcon />,
  diagonal: <CursorDiagonalIcon />,
  horizontal_locked: (
    <LockedIcon>
      <CursorHorizontalIcon />
    </LockedIcon>
  ),
  vertical_locked: (
    <LockedIcon>
      <CursorVerticalIcon />
    </LockedIcon>
  ),
  diagonal_locked: (
    <LockedIcon>
      <CursorDiagonalIcon />
    </LockedIcon>
  ),
};

const MenuSpacer = styled.div`
  width: 10px;
`;

const flipLocked = (movementType: MovementType): MovementType => {
  switch (movementType) {
    case "horizontal":
      return "horizontal_locked";
    case "vertical":
      return "vertical_locked";
    case "diagonal":
      return "diagonal_locked";
    case "horizontal_locked":
      return "horizontal";
    case "vertical_locked":
      return "vertical";
    case "diagonal_locked":
      return "diagonal";
    default:
      return "horizontal";
  }
};

export const MovementTypeSelect: FC<MovementTypeSelectProps> = ({
  value = "horizontal",
  allowLockedDirection = false,
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
      horizontal_locked: l10n("FIELD_HORIZONTAL_FIRST"),
      vertical_locked: l10n("FIELD_VERTICAL_FIRST"),
      diagonal_locked: l10n("FIELD_DIAGONAL"),
    }),
    [],
  );

  const isLocked = allowLockedDirection && value.endsWith("_locked");

  const title = `${l10n("FIELD_MOVEMENT_TYPE")}${value ? ": " : ""}${
    value ? movementTypeNamesLookup[value] : ""
  }${isLocked ? ` (${l10n("FIELD_LOCK_DIRECTION")})` : ""}`;
  return (
    <DropdownButton label={selectedIcon} showArrow={false} title={title}>
      <MenuGroup>{l10n("FIELD_MOVEMENT_TYPE")}</MenuGroup>
      {(["horizontal", "vertical", "diagonal"] as const).map((movementType) => (
        <MenuItem
          key={movementType}
          onClick={() => {
            if (allowLockedDirection && value.endsWith("_locked")) {
              onChange?.((movementType + "_locked") as MovementType);
            } else {
              onChange?.(movementType);
            }
          }}
          icon={value.startsWith(movementType) ? <CheckIcon /> : <BlankIcon />}
        >
          <FlexGrow>{movementTypeNamesLookup[movementType]}</FlexGrow>
          <MenuSpacer />
          <MenuItemIcon>{movementTypeIconsLookup[movementType]}</MenuItemIcon>
        </MenuItem>
      ))}
      {allowLockedDirection && <MenuDivider />}
      {allowLockedDirection && (
        <MenuItem
          icon={value.endsWith("_locked") ? <CheckIcon /> : <BlankIcon />}
          onClick={() => {
            onChange?.(flipLocked(value));
          }}
        >
          {l10n("FIELD_LOCK_DIRECTION")}
        </MenuItem>
      )}
    </DropdownButton>
  );
};
