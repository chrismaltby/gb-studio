import React, { FC } from "react";
import l10n from "lib/helpers/l10n";
import { DropdownButton } from "ui/buttons/DropdownButton";
import {
  BlankIcon,
  CheckIcon,
  PriorityHighIcon,
  PriorityLowIcon,
  PriorityMediumIcon,
} from "ui/icons/Icons";
import { MenuGroup, MenuItem, MenuItemIcon } from "ui/menu/Menu";
import { FlexGrow } from "ui/spacing/Spacing";
import styled from "styled-components";

const priorities = ["high", "medium", "low"] as const;
export type Priority = typeof priorities[number];

interface PrioritySelectProps {
  value?: Priority;
  onChange?: (newValue: Priority) => void;
}

const priorityIconsLookup: Record<Priority, JSX.Element> = {
  low: <PriorityLowIcon />,
  medium: <PriorityMediumIcon />,
  high: <PriorityHighIcon />,
};

const priorityNamesLookup: Record<Priority, string> = {
  low: l10n("FIELD_LOW"),
  medium: l10n("FIELD_MEDIUM"),
  high: l10n("FIELD_HIGH"),
};

const MenuSpacer = styled.div`
  width: 10px;
`;

export const PrioritySelect: FC<PrioritySelectProps> = ({
  value,
  onChange,
}) => {
  const selectedIcon = value ? priorityIconsLookup[value] : <PriorityLowIcon />;
  const title = `${l10n("FIELD_PRIORITY")}${value ? ": " : ""}${
    value ? priorityNamesLookup[value] : ""
  }`;
  return (
    <DropdownButton label={selectedIcon} showArrow={false} title={title}>
      <MenuGroup>{l10n("FIELD_PRIORITY")}</MenuGroup>
      {priorities.map((priority) => (
        <MenuItem
          key={priority}
          onClick={() => {
            onChange?.(priority);
          }}
        >
          <MenuItemIcon>
            {value === priority ? <CheckIcon /> : <BlankIcon />}
          </MenuItemIcon>
          <FlexGrow>{priorityNamesLookup[priority]}</FlexGrow>
          <MenuSpacer />
          <MenuItemIcon>{priorityIconsLookup[priority]}</MenuItemIcon>
        </MenuItem>
      ))}
    </DropdownButton>
  );
};

PrioritySelect.defaultProps = {
  value: "low",
};
