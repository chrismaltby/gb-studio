import React, { useMemo } from "react";
import { TriangleIcon } from "ui/icons/Icons";
import l10n from "renderer/lib/l10n";
import { ActorDirection } from "store/features/entities/entitiesTypes";
import { ToggleButtonGroup } from "ui/form/ToggleButtonGroup";
import styled from "styled-components";

interface DirectionPickerProps {
  id: string;
  value: ActorDirection | undefined;
  onChange: (newValue: ActorDirection) => void;
}

interface DirectionOption {
  value: ActorDirection;
  name: string;
  label: React.ReactNode;
  title: string;
}

const RotateLeft = styled.div`
  svg {
    transform: rotate(-90deg);
  }
`;

const RotateRight = styled.div`
  svg {
    transform: rotate(90deg);
  }
`;

const RotateDown = styled.div`
  svg {
    transform: rotate(180deg);
  }
`;

const DirectionPicker = ({ id, value, onChange }: DirectionPickerProps) => {
  const options = useMemo(
    () =>
      [
        {
          value: "left",
          name: "Left",
          label: (
            <RotateLeft>
              <TriangleIcon />
            </RotateLeft>
          ),
          title: l10n("FIELD_DIRECTION_LEFT"),
        },
        {
          value: "up",
          name: "Up",
          label: <TriangleIcon />,
          title: l10n("FIELD_DIRECTION_UP"),
        },
        {
          value: "down",
          name: "Down",
          label: (
            <RotateDown>
              <TriangleIcon />
            </RotateDown>
          ),
          title: l10n("FIELD_DIRECTION_DOWN"),
        },
        {
          value: "right",
          name: "Right",
          label: (
            <RotateRight>
              <TriangleIcon />
            </RotateRight>
          ),
          title: l10n("FIELD_DIRECTION_RIGHT"),
        },
      ] as DirectionOption[],
    []
  );

  return (
    <ToggleButtonGroup
      name={id}
      value={value as ActorDirection}
      options={options}
      onChange={onChange}
    />
  );
};

export default DirectionPicker;
